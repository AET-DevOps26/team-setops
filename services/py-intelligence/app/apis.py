from fastapi import Body, FastAPI, HTTPException
from app.utils.db_utils import DB

db = DB()


app = FastAPI(
    title="DevPulse Intelligence Service",
    description="GenAI/RAG service for log summarization and troubleshooting.",
    version="0.1.0",
)


@app.get("/health")
def health() -> dict[str, str]:
    """Liveness/health endpoint.

    Returns a small JSON payload so orchestration/monitoring can verify the
    service is reachable.
    """
    return {"status": "ok", "service": "py-intelligence"}


@app.post("/api/v1/analyze")
def analyze(
    content: str = Body(...),
    mode: str = Body("local"),
    use_rag: bool = Body(False),
    context: str | None = Body(None),
) -> dict:
    """Single entry-point for the full intelligence pipeline.

    Frontend/backend can call this endpoint with:
    - content: the log/text to analyze
    - mode: "local" or "cloud" (chosen by frontend, forwarded by backend)
    - use_rag: whether to retrieve additional context
    - context: optional extra context from the caller

    Response is a single structured JSON produced by one end-to-end process:
    - problem_type: a short tag for the UI (top-level field)
    - summary: short overall summary
    - problem_summary: what went wrong / main issue
    - troubleshoot: key findings/diagnostics
    - solutions: suggested fixes / next steps
    - sources: optional RAG/source references
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
    """Create/index a document for later retrieval (RAG).

    Input comes from the backend (not the UI) when new knowledge should be added
    to the retrieval store (e.g., past incidents, runbooks, resolved fixes).
    """
    if not title.strip() or not content.strip():
        raise HTTPException(status_code=422, detail="'title' and 'content' must not be empty.")
    document = {"title": title, "content": content, "tags": tags}

    success = db.add_new_document(document)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to add document to the database.")

    return {"message": "Document added successfully"}


@app.delete("/api/v1/rag/documents/{document_id}", status_code=204)
def delete_rag_document(document_id: str) -> None:
    """Delete a previously indexed RAG document by id."""
    # Contract-only endpoint. Implement later.
    raise HTTPException(status_code=501, detail="RAG document deletion endpoint not implemented yet")


@app.post("/api/v1/rag/search")
def search_rag_documents(
    query: str = Body(...),
    limit: int = Body(5),
) -> dict:
    """Search the retrieval store for documents relevant to a query.

    This is useful for debugging retrieval quality and for building RAG flows
    where the backend wants explicit sources/snippets.
    """
    if not query.strip():
        raise HTTPException(status_code=422, detail="'query' must not be empty.")
    # Contract-only endpoint. Implement later.
    raise HTTPException(status_code=501, detail="RAG search endpoint not implemented yet")
