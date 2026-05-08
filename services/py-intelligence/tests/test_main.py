from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health() -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "py-intelligence"}


def test_analyze_endpoint_is_mapped() -> None:
    response = client.post(
        "/api/v1/analyze",
        json={"content": "Deployment failed: database connection timeout", "task": "troubleshoot", "use_rag": False},
    )

    assert response.status_code == 501
    assert response.json() == {"detail": "Analyze endpoint not implemented yet"}


def test_analyze_empty_content_returns_422() -> None:
    response = client.post("/api/v1/analyze", json={"content": "   "})

    assert response.status_code == 422


def test_removed_endpoints_return_404() -> None:
    assert client.get("/api/v1/models").status_code == 404
    assert client.post("/api/v1/summarize", json={"content": "x"}).status_code == 404
    assert client.post("/api/v1/troubleshoot", json={"log_content": "x"}).status_code == 404
    assert client.post("/api/v1/rag/answer", json={"question": "x"}).status_code == 404


def test_create_rag_document_endpoint_is_mapped() -> None:
    response = client.post(
        "/api/v1/rag/documents",
        json={"title": "Database timeout fix", "content": "Restarted database connection pool", "tags": ["db", "timeout"]},
    )

    assert response.status_code == 501
    assert response.json() == {"detail": "RAG document endpoint not implemented yet"}


def test_delete_rag_document_endpoint_is_mapped() -> None:
    response = client.delete("/api/v1/rag/documents/does-not-exist-999")

    assert response.status_code == 501
    assert response.json() == {"detail": "RAG document deletion endpoint not implemented yet"}


def test_rag_search_endpoint_is_mapped() -> None:
    response = client.post("/api/v1/rag/search", json={"query": "crash loop", "limit": 3})

    assert response.status_code == 501
    assert response.json() == {"detail": "RAG search endpoint not implemented yet"}
