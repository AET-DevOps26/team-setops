from contextlib import asynccontextmanager

from app.utils.embedding_utils import create_all_embeddings
from fastapi import Body, FastAPI, HTTPException, Response
from prometheus_fastapi_instrumentator import Instrumentator
from prometheus_client import Gauge
from app.utils.db_utils import DB
from app.utils.embedding_utils import similarity_search
from app.func import Intelligence, REQUIRED_RESPONSE_KEYS, LOCAL_MODEL_ACCELERATED
from app.model import LOCAL_MODEL_RECOMMENDED_THREADS
import os
import datetime

db: DB | None = None
intelligence = Intelligence()
COLLECTION_NAME = os.getenv("COLLECTION_NAME", "ingestions")

ANALYSES_COMPLETED_METRIC = Gauge(
    "devpulse_analyses_completed_total", "Total number of completed AI analyses persisted in MongoDB"
)


def get_db() -> DB:
    global db
    if db is None:
        db = DB()
    return db


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        count = get_db().db["completed_analyses"].count_documents({})
        ANALYSES_COMPLETED_METRIC.set(count)
    except Exception as e:
        print(f"Failed to initialize analyses metric: {e}")
    yield


app = FastAPI(
    title="DevPulse Intelligence Service",
    description="GenAI/RAG service for log summarization and troubleshooting.",
    version="0.1.0",
    lifespan=lifespan,
)

Instrumentator().instrument(app).expose(app)


@app.get("/health")
def health() -> dict[str, str | int | bool]:
    """
    Liveness/health endpoint to verify the service status.

    Returns:
        dict[str, str | int | bool]: A status message, service identifier, whether this
            deployment runs the accelerated local model, and (if CPU-constrained) the
            local model's available vs recommended threads.
    """
    response: dict[str, str | int | bool] = {
        "status": "ok",
        "service": "py-intelligence",
        "local_model_accelerated": LOCAL_MODEL_ACCELERATED,
    }
    llama_threads = os.getenv("LLAMA_N_THREADS")
    if llama_threads:
        try:
            response["local_threads"] = int(llama_threads)
            response["local_threads_recommended"] = LOCAL_MODEL_RECOMMENDED_THREADS
        except ValueError:
            pass
    return response


@app.post("/api/v1/analyze")
def analyze(
    content: str = Body(...),
    mode: str = Body("local"),
    use_rag: bool = Body(False),
    context: str | None = Body(None),
    log_id: str | None = Body(None),
) -> dict:
    """
    The main intelligence endpoint for analyzing log content.

    Coordinates the full pipeline: optional RAG retrieval, problem analysis,
    troubleshooting steps, and solution suggestions.

    Args:
        content (str): The raw log or text content to analyze.
        mode (str, optional): The analysis mode ("local" or "cloud"). Defaults to "local".
        use_rag (bool, optional): Whether to use Retrieval-Augmented Generation for context. Defaults to False.
        context (str, optional): Additional context to include in the analysis. Defaults to None.
        log_id (str, optional): Log this analysis belongs to. When set, the result is persisted
            and can be fetched again via /api/v1/analyses/query.

    Returns:
        dict: A structured JSON response containing:
            - problem_type (str): Categorization of the issue.
            - summary (str): High-level summary of the analysis.
            - problem_summary (str): Detailed explanation of the detected problem.
            - troubleshoot (str): Diagnostic steps taken or found.
            - solutions (list): Recommended fixes or next steps.
            - sources (list, optional): Reference documents found via RAG.
    """
    if not content.strip():
        raise HTTPException(status_code=422, detail="'content' must not be empty.")

    retrieved_docs = []
    if use_rag:
        try:
            retrieved_docs = similarity_search(content, limit=3)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"RAG retrieval failed: {str(e)}")

    try:
        result = intelligence.analyze(
            content=content,
            mode=mode,
            use_rag=use_rag,
            context=context,
            retrieved_docs=retrieved_docs,
        )

        # Persist the analysis in MongoDB (keyed by log_id if given, so a
        # re-analysis of the same log overwrites its previous result instead
        # of piling up duplicates) and update the completed-analyses gauge.
        try:
            record = {
                "timestamp": datetime.datetime.now(datetime.timezone.utc),
                "mode": mode,
                **result,
            }
            collection = get_db().db["completed_analyses"]
            if log_id:
                record["log_id"] = log_id
                collection.update_one({"log_id": log_id}, {"$set": record}, upsert=True)
            else:
                collection.insert_one(record)
            ANALYSES_COMPLETED_METRIC.set(collection.count_documents({}))
        except Exception as db_err:
            print(f"Failed to persist analysis to database: {db_err}")

        return result
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))


@app.post("/api/v1/analyses/query")
def query_analyses(log_ids: list[str] = Body(..., embed=True)) -> dict:
    """
    Fetch previously persisted analyses for a set of log IDs.

    Args:
        log_ids (list[str]): The log IDs to look up.

    Returns:
        dict: Map of log_id to its persisted analysis. Log IDs with no
            stored analysis are omitted from the response.
    """
    if not log_ids:
        return {}

    docs = get_db().db["completed_analyses"].find({"log_id": {"$in": log_ids}})
    return {doc["log_id"]: {key: doc.get(key) for key in REQUIRED_RESPONSE_KEYS} for doc in docs}


@app.delete("/api/v1/analyses/{log_id}", status_code=204)
def delete_analysis(log_id: str) -> Response:
    """
    Remove the persisted analysis for a single log.

    Called when the corresponding log is deleted in the frontend, so
    analyses don't pile up for logs that no longer exist.

    Args:
        log_id (str): The log whose analysis should be removed.
    """
    collection = get_db().db["completed_analyses"]
    collection.delete_one({"log_id": log_id})
    ANALYSES_COMPLETED_METRIC.set(collection.count_documents({}))
    return Response(status_code=204)


@app.delete("/api/v1/analyses", status_code=200)
def delete_all_analyses() -> dict:
    """
    Remove all persisted analyses that are tied to a log_id.

    Called when the frontend clears all logs at once.
    """
    collection = get_db().db["completed_analyses"]
    collection.delete_many({"log_id": {"$exists": True}})
    ANALYSES_COMPLETED_METRIC.set(collection.count_documents({}))
    return {"message": "All persisted analyses deleted successfully"}


@app.post("/api/v1/rag/documents", status_code=201)
def create_rag_document(
    title: str = Body(...),
    content: str = Body(...),
    tags: list[str] = Body([]),
) -> dict:
    """
    Create and index a new document in the RAG retrieval store.

    Args:
        title (str): The title of the document.
        content (str): The content of the document to be indexed.
        tags (list[str], optional): A list of category tags. Defaults to [].

    Returns:
        dict: The created RAG document.
    """
    if not title.strip() or not content.strip():
        raise HTTPException(status_code=422, detail="'title' and 'content' must not be empty.")
    document = {"title": title, "content": content, "tags": tags}

    db_instance = get_db()
    if not db_instance.add_new_document(document):
        raise HTTPException(status_code=500, detail="Failed to add document to the database.")

    if not create_all_embeddings(COLLECTION_NAME):
        raise HTTPException(status_code=500, detail="Failed to update embeddings after adding document.")

    return {
        "id": str(document.get("_id", "")),
        "title": document["title"],
        "content": document["content"],
        "tags": document["tags"],
    }


@app.delete("/api/v1/rag/documents/{document_id}", status_code=204)
def delete_rag_document(document_id: str) -> Response:
    """
    Remove a previously indexed RAG document from the database.

    Args:
        document_id (str): The unique identifier of the document to delete.
    """
    success = get_db().delete_document(document_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete document from the database.")
    success = create_all_embeddings(COLLECTION_NAME)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update embeddings after deletion.")
    return Response(status_code=204)


@app.delete("/api/v1/rag/delete_all", status_code=200)
def delete_all_rag_documents() -> dict:
    """
    Remove all documents from the RAG retrieval store.
    """
    success = get_db().delete_all_documents()
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete all documents from the database.")
    return {"message": "All documents deleted successfully"}


@app.post("/api/v1/rag/search")
def search_rag_documents(
    query: str = Body(...),
    limit: int = Body(5),
) -> dict:
    """
    Search for documents in the RAG store that are semantically similar to the query.

    Args:
        query (str): The search query text.
        limit (int, optional): Maximum number of results to return. Defaults to 5.

    Returns:
        dict: A list of relevant documents found in the retrieval store.
    """
    if not query.strip():
        raise HTTPException(status_code=422, detail="'query' must not be empty.")

    try:
        results = similarity_search(query, limit=limit)
        formatted_results = []
        for doc in results:
            formatted_results.append(
                {
                    "document_id": str(doc.get("_id", "")),
                    "title": doc.get("title", ""),
                    "score": float(doc.get("score", 1.0)),
                    "snippet": doc.get("content", ""),
                }
            )
        return {"results": formatted_results, "count": len(formatted_results)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")
