from app.utils.embedding_utils import create_all_embeddings
from fastapi import Body, FastAPI, HTTPException
from app.utils.db_utils import DB
from app.utils.embedding_utils import similarity_search
import os

db = DB()
COLLECTION_NAME = os.getenv("COLLECTION_NAME", "injestions")


app = FastAPI(
    title="DevPulse Intelligence Service",
    description="GenAI/RAG service for log summarization and troubleshooting.",
    version="0.1.0",
)


@app.get("/health")
def health() -> dict[str, str]:
    """
    Liveness/health endpoint to verify the service status.

    Returns:
        dict[str, str]: A status message and service identifier.
    """
    return {"status": "ok", "service": "py-intelligence"}


@app.post("/api/v1/analyze")
def analyze(
    content: str = Body(...),
    mode: str = Body("local"),
    use_rag: bool = Body(False),
    context: str | None = Body(None),
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
    # Contract-only endpoint. Implement later.
    raise HTTPException(status_code=501, detail="Analyze endpoint not implemented yet")


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
        dict: A confirmation message.
    """
    if not title.strip() or not content.strip():
        raise HTTPException(status_code=422, detail="'title' and 'content' must not be empty.")
    document = {"title": title, "content": content, "tags": tags}

    success = (db.add_new_document(document)) and create_all_embeddings(COLLECTION_NAME)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to add document to the database.")
    return {"message": "Document added and embeddings were updated successfully"}


@app.delete("/api/v1/rag/documents/{document_id}", status_code=200)
def delete_rag_document(document_id: str) -> dict:
    """
    Remove a previously indexed RAG document from the database.

    Args:
        document_id (str): The unique identifier of the document to delete.
    """
    success = db.delete_document(document_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete document from the database.")
    success = create_all_embeddings(COLLECTION_NAME)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update embeddings after deletion.")
    return {"message": "Document deleted and embeddings were updated successfully"}


@app.delete("/api/v1/rag/delete_all", status_code=200)
def delete_all_rag_documents() -> dict:
    """
    Remove all documents from the RAG retrieval store.
    """
    success = db.delete_all_documents()
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
        # Convert ObjectId to string for JSON serialization
        for doc in results:
            doc["_id"] = str(doc["_id"])
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")
