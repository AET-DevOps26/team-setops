import json
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch
from app.apis import app
from app.func import AVAILABLE_MODELS

client = TestClient(app)

LOCAL_ANALYSIS_RESPONSE = {
    "problem_type": "database_connectivity",
    "severity": "high",
    "summary": "The model identified a database connectivity issue.",
    "problem_summary": "The model points to a failing database path.",
    "evidence": ["Deployment failed: database connection timeout"],
    "troubleshoot": ["Check database connectivity."],
    "solutions": [{"title": "Restore connectivity", "steps": "Fix the connection settings.", "risk": "medium"}],
    "sources": [],
    "confidence": "high",
}


def test_health() -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "py-intelligence"}


def test_local_model_matches_docker_gguf() -> None:
    local_model = next(model for model in AVAILABLE_MODELS if not model["cloud"])

    assert local_model["name"] == "Qwen/Qwen2.5-Coder-3B-Instruct-GGUF"
    assert local_model["model_path"] == "/app/models/qwen2.5-coder-3b-instruct-q4_k_m.gguf"


@patch("app.apis.intelligence.get_model_for_mode")
def test_analyze_endpoint_returns_structured_analysis(mock_get_model) -> None:
    mock_model = MagicMock()
    mock_model.generate.return_value = json.dumps(LOCAL_ANALYSIS_RESPONSE)
    mock_get_model.return_value = mock_model

    response = client.post(
        "/api/v1/analyze",
        json={
            "content": "Deployment failed: database connection timeout",
            "mode": "local",
            "use_rag": False,
            "context": "Production environment, cluster-west-1",
        },
    )

    assert response.status_code == 200
    assert response.json() == LOCAL_ANALYSIS_RESPONSE
    mock_model.generate.assert_called_once()


@patch("app.apis.intelligence.get_model_for_mode")
@patch("app.apis.similarity_search")
def test_analyze_endpoint_uses_rag(mock_search, mock_get_model) -> None:
    mock_search.return_value = [
        {
            "_id": "mock_id",
            "title": "Database timeout fix",
            "content": "Increase database connection pool capacity after validating saturation.",
            "tags": ["db", "timeout"],
        }
    ]
    mock_model = MagicMock()
    mock_model.generate.return_value = json.dumps(
        {
            **LOCAL_ANALYSIS_RESPONSE,
            "sources": [{"id": "mock_id", "title": "Database timeout fix", "tags": ["db", "timeout"]}],
            "confidence": "high",
        }
    )
    mock_get_model.return_value = mock_model

    response = client.post(
        "/api/v1/analyze",
        json={"content": "Deployment failed: database connection timeout", "mode": "local", "use_rag": True},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["sources"][0]["title"] == "Database timeout fix"
    assert body["confidence"] == "high"
    mock_search.assert_called_once_with("Deployment failed: database connection timeout", limit=3)
    assert "Database timeout fix" in mock_model.generate.call_args.args[0]


def test_analyze_empty_content_returns_422() -> None:
    response = client.post("/api/v1/analyze", json={"content": "   "})

    assert response.status_code == 422


def test_removed_endpoints_return_404() -> None:
    assert client.get("/api/v1/models").status_code == 404
    assert client.post("/api/v1/rag/answer", json={"question": "x"}).status_code == 404



@patch("app.apis.create_all_embeddings")
@patch("app.apis.db")
def test_create_rag_document_success(mock_db, mock_create_embeddings) -> None:
    mock_db.add_new_document.return_value = True
    mock_create_embeddings.return_value = True
    response = client.post(
        "/api/v1/rag/documents",
        json={
            "title": "Database timeout fix",
            "content": "Restarted database connection pool",
            "tags": ["db", "timeout"],
        },
    )

    assert response.status_code == 201
    assert response.json() == {"message": "Document added and embeddings were updated successfully"}
    mock_db.add_new_document.assert_called_once()
    mock_create_embeddings.assert_called_once()


@patch("app.apis.create_all_embeddings")
@patch("app.apis.db")
def test_delete_rag_document_endpoint_is_mapped(mock_db, mock_create_embeddings) -> None:
    mock_db.delete_document.return_value = True
    mock_create_embeddings.return_value = True
    response = client.delete("/api/v1/rag/documents/675e3ed186e03e4169b4d354")

    assert response.status_code == 200
    mock_db.delete_document.assert_called_once_with("675e3ed186e03e4169b4d354")
    mock_create_embeddings.assert_called_once()


@patch("app.apis.similarity_search")
def test_rag_search_success(mock_search) -> None:
    mock_search.return_value = [{"_id": "mock_id", "title": "Mock Title", "content": "Mock Content", "tags": []}]
    response = client.post("/api/v1/rag/search", json={"query": "crash loop", "limit": 3})

    assert response.status_code == 200
    assert "results" in response.json()
    assert response.json()["results"][0]["title"] == "Mock Title"
    mock_search.assert_called_once_with("crash loop", limit=3)
