import json
import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch
from app.apis import app
from app.func import AVAILABLE_MODELS

client = TestClient(app)

LOCAL_ANALYSIS_RESPONSE = {
    "model": "Qwen",
    "problem_type": "database_connectivity",
    "severity": "high",
    "summary": "The model identified a database connectivity issue.",
    "problem_summary": "The model points to a failing database path.",
    "evidence": ["Deployment failed: database connection timeout"],
    "troubleshoot": ["Check database connectivity."],
    "solutions": ["Restore connectivity by fixing the connection settings."],
    "sources": [],
    "confidence": "high",
}


def test_health() -> None:
    """Verifies that the /health API endpoint returns a 200 OK status and correct metadata."""
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "py-intelligence"}


def test_local_model_matches_docker_gguf() -> None:
    """Verifies that the configured local model properties match the GGUF model path inside Docker."""
    local_model = next(model for model in AVAILABLE_MODELS if not model["cloud"])

    assert local_model["name"] == "Qwen/Qwen2.5-Coder-1.5B-Instruct-GGUF"
    assert local_model["model_path"] == "/app/models/qwen2.5-coder-1.5b-instruct-q4_k_m.gguf"


@patch("app.apis.intelligence.get_model_for_mode")
def test_analyze_endpoint_returns_structured_analysis(mock_get_model) -> None:
    """Verifies that the /api/v1/analyze API endpoint successfully coordinates prompt generation,

    model execution, and structured normalization.
    """
    mock_model = MagicMock()
    mock_model.shortened = "Qwen"
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
    """Verifies that the /api/v1/analyze API endpoint queries similarity search for RAG

    and incorporates RAG document context when enabled.
    """
    mock_search.return_value = [
        {
            "_id": "mock_id",
            "title": "Database timeout fix",
            "content": "Increase database connection pool capacity after validating saturation.",
            "tags": ["db", "timeout"],
        }
    ]
    mock_model = MagicMock()
    mock_model.shortened = "Qwen"
    mock_model.generate.return_value = json.dumps(
        {
            **LOCAL_ANALYSIS_RESPONSE,
            "sources": [
                {
                    "id": "mock_id",
                    "title": "Database timeout fix",
                    "tags": ["db", "timeout"],
                }
            ],
            "confidence": "high",
        }
    )
    mock_get_model.return_value = mock_model

    response = client.post(
        "/api/v1/analyze",
        json={
            "content": "Deployment failed: database connection timeout",
            "mode": "local",
            "use_rag": True,
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["sources"][0]["title"] == "Database timeout fix"
    assert body["confidence"] == "high"
    mock_search.assert_called_once_with("Deployment failed: database connection timeout", limit=3)
    assert "Database timeout fix" in mock_model.generate.call_args.args[0]


def test_analyze_empty_content_returns_422() -> None:
    """Verifies that /api/v1/analyze returns a 422 Unprocessable Entity status when content is empty."""
    response = client.post("/api/v1/analyze", json={"content": "   "})

    assert response.status_code == 422


@patch("app.func._load_prompts")
def test_intelligence_prompt_building_fallback(mock_load_prompts) -> None:
    """Verifies that the Intelligence engine constructs valid prompt defaults even if prompts.json is missing."""
    mock_load_prompts.return_value = {}
    from app.func import Intelligence

    intel = Intelligence()
    prompt = intel._build_analysis_prompt(
        content="test content",
        mode="local",
        use_rag=False,
        context=None,
        retrieved_docs=[],
    )
    assert "Return one valid JSON object with keys:" in prompt


def test_get_model_for_mode_behavior() -> None:
    """Verifies that get_model_for_mode retrieves the correct model based on mode,

    normalizes strings, and handles errors.
    """
    from app.func import Intelligence

    intel = Intelligence()

    # Valid modes with different casing and spaces
    assert intel.get_model_for_mode("local").cloud is False
    assert intel.get_model_for_mode("  CLOUD ").cloud is True

    # Invalid mode raises ValueError
    with pytest.raises(ValueError, match="mode must be either 'local' or 'cloud'."):
        intel.get_model_for_mode("invalid_mode")


def test_parse_model_response_handling() -> None:
    """Verifies that raw LLM response text is cleaned (removing markdown,

    parsing nested blocks) and errors are handled.
    """
    from app.func import Intelligence

    intel = Intelligence()

    # Standard clean JSON
    assert intel._parse_model_response('{"test": 123}') == {"test": 123}

    # Markdown fenced JSON
    assert intel._parse_model_response('```json\n{"test": 123}\n```') == {"test": 123}

    # Nested JSON in text
    assert intel._parse_model_response('Some text {\n  "test": 123\n} other text') == {"test": 123}

    # Empty response raises ValueError
    with pytest.raises(ValueError, match="Model returned an empty response."):
        intel._parse_model_response("")

    # Invalid JSON raises ValueError
    with pytest.raises(ValueError, match="Model response was not valid JSON."):
        intel._parse_model_response("not a json string")

    # Unescaped double quotes in JSON string
    assert intel._parse_model_response('{"evidence": ["Module \'"./App.css"\' has no default export."]}') == {
        "evidence": ["Module '\"./App.css\"' has no default export."]
    }


def test_normalize_response_defaults_and_rag_sources() -> None:
    """Verifies that incomplete model responses are completed with defaults,

    and RAG references are populated as sources.
    """
    from app.func import Intelligence

    intel = Intelligence()

    # Incomplete response, should get filled with defaults
    incomplete_res = {
        "problem_type": "infra_issue",
        "severity": None,
        "summary": "Server down",
    }
    normalized = intel._normalize_response(incomplete_res, retrieved_docs=[], use_rag=False)

    assert normalized["problem_type"] == "infra_issue"
    assert normalized["severity"] == "unknown"
    assert normalized["summary"] == "Server down"
    assert normalized["problem_summary"] == ""
    assert normalized["evidence"] == []
    assert normalized["troubleshoot"] == []
    assert normalized["solutions"] == []
    assert normalized["sources"] == []
    assert normalized["confidence"] == "low"

    # RAG enabled, empty sources: should populate sources from retrieved docs
    retrieved = [
        {
            "_id": "1a",
            "title": "Doc 1",
            "tags": ["tag1"],
            "content": "This is a detailed snippet of Doc 1.",
        }
    ]
    normalized_rag = intel._normalize_response({"problem_type": "x"}, retrieved_docs=retrieved, use_rag=True)

    assert len(normalized_rag["sources"]) == 1
    assert normalized_rag["sources"][0]["id"] == "1a"
    assert normalized_rag["sources"][0]["title"] == "Doc 1"
    assert normalized_rag["sources"][0]["snippet"] == "This is a detailed snippet of Doc 1."


def test_normalize_response_coerces_invalid_confidence_to_low() -> None:
    """Verifies that a non-enum confidence value (e.g. a number) is coerced to 'low'."""
    from app.func import Intelligence

    intel = Intelligence()

    normalized = intel._normalize_response({"confidence": 100}, retrieved_docs=[], use_rag=False)
    assert normalized["confidence"] == "low"

    normalized = intel._normalize_response({"confidence": "very sure"}, retrieved_docs=[], use_rag=False)
    assert normalized["confidence"] == "low"


def test_normalize_response_lowercases_valid_confidence() -> None:
    """Verifies that a valid but differently-cased confidence value is normalized to lowercase."""
    from app.func import Intelligence

    intel = Intelligence()

    normalized = intel._normalize_response({"confidence": "High"}, retrieved_docs=[], use_rag=False)
    assert normalized["confidence"] == "high"


def test_normalize_response_strips_hallucinated_sources_without_rag() -> None:
    """Verifies that sources are always empty when RAG wasn't used, even if the model invents some."""
    from app.func import Intelligence

    intel = Intelligence()

    hallucinated = {"sources": [{"id": "made up source", "title": "Not real"}]}
    normalized = intel._normalize_response(hallucinated, retrieved_docs=[], use_rag=False)

    assert normalized["sources"] == []


def test_removed_endpoints_return_404() -> None:
    """Verifies that older/removed service endpoints correctly return a 404 Not Found status."""
    assert client.get("/api/v1/models").status_code == 404
    assert client.post("/api/v1/rag/answer", json={"question": "x"}).status_code == 404


@patch("app.apis.create_all_embeddings")
@patch("app.apis.db")
def test_create_rag_document_success(mock_db, mock_create_embeddings) -> None:
    """Verifies that adding a new document via /api/v1/rag/documents successfully indexes and updates embeddings."""

    def mock_add(doc):
        doc["_id"] = "mock_id_123"
        return True

    mock_db.add_new_document.side_effect = mock_add
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
    assert response.json() == {
        "id": "mock_id_123",
        "title": "Database timeout fix",
        "content": "Restarted database connection pool",
        "tags": ["db", "timeout"],
    }
    mock_db.add_new_document.assert_called_once()
    mock_create_embeddings.assert_called_once()


@patch("app.apis.create_all_embeddings")
@patch("app.apis.db")
def test_delete_rag_document_endpoint_is_mapped(mock_db, mock_create_embeddings) -> None:
    """Verifies that deleting a document via /api/v1/rag/documents/{id} correctly removes it and updates embeddings."""
    mock_db.delete_document.return_value = True
    mock_create_embeddings.return_value = True
    response = client.delete("/api/v1/rag/documents/675e3ed186e03e4169b4d354")

    assert response.status_code == 204
    mock_db.delete_document.assert_called_once_with("675e3ed186e03e4169b4d354")
    mock_create_embeddings.assert_called_once()


@patch("app.apis.similarity_search")
def test_rag_search_success(mock_search) -> None:
    """Verifies that semantic searching via /api/v1/rag/search returns ranked search results from embedding_utils."""
    mock_search.return_value = [{"_id": "mock_id", "title": "Mock Title", "content": "Mock Content", "tags": []}]
    response = client.post("/api/v1/rag/search", json={"query": "crash loop", "limit": 3})

    assert response.status_code == 200
    res_data = response.json()
    assert "results" in res_data
    assert res_data["count"] == 1
    assert res_data["results"][0]["title"] == "Mock Title"
    assert res_data["results"][0]["document_id"] == "mock_id"
    assert res_data["results"][0]["score"] == 1.0
    assert res_data["results"][0]["snippet"] == "Mock Content"
    mock_search.assert_called_once_with("crash loop", limit=3)


def test_model_initialization_and_string_representation() -> None:
    """Verifies that Model instances load configs and return correct string descriptions for cloud/local backends."""
    from app.model import Model

    google_cfg = {
        "name": "gemini-3.5-flash",
        "provider": "google",
        "shortened": "Gemini",
        "cloud": True,
    }
    qwen_cfg = {
        "name": "Qwen/Qwen2.5-Coder-1.5B-Instruct-GGUF",
        "model_path": "/app/models/qwen2.5-coder-1.5b-instruct-q4_k_m.gguf",
        "provider": "Qwen",
        "shortened": "Qwen",
        "cloud": False,
    }

    model_google = Model(google_cfg)
    model_qwen = Model(qwen_cfg)

    assert model_google.model_name == "gemini-3.5-flash"
    assert model_google.provider == "google"
    assert model_google.cloud is True
    assert str(model_google) == "google - gemini-3.5-flash (cloud)"

    assert model_qwen.model_name == "Qwen/Qwen2.5-Coder-1.5B-Instruct-GGUF"
    assert model_qwen.provider == "qwen"
    assert model_qwen.cloud is False
    assert str(model_qwen) == "qwen - Qwen/Qwen2.5-Coder-1.5B-Instruct-GGUF (local)"


def test_model_load_raises_runtime_error_on_import_error_google() -> None:
    """Verifies that Model._load raises an explicit RuntimeError if the google-genai library is missing."""
    from app.model import Model

    google_cfg = {
        "name": "gemini-3.5-flash",
        "provider": "google",
        "shortened": "Gemini",
        "cloud": True,
    }
    model = Model(google_cfg)

    with patch.dict("sys.modules", {"google": None}):
        with pytest.raises(RuntimeError, match="Google GenAI dependencies are not installed."):
            model._load()


def test_model_load_raises_runtime_error_on_import_error_qwen() -> None:
    """Verifies that Model._load raises an explicit RuntimeError if llama-cpp-python is missing."""
    from app.model import Model

    qwen_cfg = {
        "name": "Qwen/Qwen2.5-Coder-1.5B-Instruct-GGUF",
        "model_path": "/app/models/qwen2.5-coder-1.5b-instruct-q4_k_m.gguf",
        "provider": "Qwen",
        "shortened": "Qwen",
        "cloud": False,
    }
    model = Model(qwen_cfg)

    with patch.dict("sys.modules", {"llama_cpp": None}):
        with pytest.raises(RuntimeError, match="llama-cpp-python is required for local GGUF inference."):
            model._load()


def test_model_load_raises_runtime_error_if_qwen_path_missing() -> None:
    """Verifies that Model._load raises a RuntimeError if the local GGUF model path configuration is missing."""
    from app.model import Model

    qwen_cfg = {
        "name": "Qwen/Qwen2.5-Coder-1.5B-Instruct-GGUF",
        "provider": "Qwen",
        "shortened": "Qwen",
        "cloud": False,
    }
    model = Model(qwen_cfg)

    with patch("builtins.__import__"):
        with pytest.raises(RuntimeError, match="Local Qwen GGUF model_path is not configured."):
            model._load()


def test_model_load_raises_value_error_for_unknown_provider() -> None:
    """Verifies that Model._load raises a ValueError if initialized with an unknown provider configuration."""
    from app.model import Model

    unknown_cfg = {
        "name": "custom-model",
        "provider": "unknown_provider",
        "shortened": "custom",
        "cloud": True,
    }
    model = Model(unknown_cfg)

    with pytest.raises(ValueError, match="Unknown provider: unknown_provider"):
        model._load()


def _qwen_model():
    from app.model import Model

    return Model(
        {
            "name": "Qwen/Qwen2.5-Coder-1.5B-Instruct-GGUF",
            "model_path": "/app/models/qwen2.5-coder-1.5b-instruct-q4_k_m.gguf",
            "provider": "Qwen",
            "shortened": "Qwen",
            "cloud": False,
        }
    )


def test_qwen_load_reads_n_threads_from_env() -> None:
    """Verifies that Model._load() passes LLAMA_N_THREADS (or a default of 4) to Llama."""
    model = _qwen_model()
    mock_llama_cls = MagicMock()

    with patch.dict("sys.modules", {"llama_cpp": MagicMock(Llama=mock_llama_cls)}):
        with patch.dict("os.environ", {"LLAMA_N_THREADS": "2"}):
            model._load()
        assert mock_llama_cls.call_args.kwargs["n_threads"] == 2

    model_default = _qwen_model()
    with patch.dict("sys.modules", {"llama_cpp": MagicMock(Llama=mock_llama_cls)}):
        with patch.dict("os.environ", {}, clear=True):
            model_default._load()
        assert mock_llama_cls.call_args.kwargs["n_threads"] == 4


def test_count_tokens_uses_local_tokenizer() -> None:
    """Verifies that count_tokens delegates to the loaded local model's own tokenizer."""
    model = _qwen_model()
    mock_client = MagicMock()
    mock_client.tokenize.return_value = [1, 2, 3, 4, 5]

    with patch("app.model.Model._load", return_value=mock_client):
        assert model.count_tokens("some text") == 5
        mock_client.tokenize.assert_called_once_with(b"some text")


def test_qwen_generate_raises_value_error_on_token_overflow() -> None:
    """Verifies that generate() rejects oversized local prompts before running inference."""
    from app.model import LOCAL_MODEL_N_CTX, LOCAL_MODEL_MAX_OUTPUT_TOKENS

    model = _qwen_model()
    mock_client = MagicMock()
    overflow_token_count = LOCAL_MODEL_N_CTX - LOCAL_MODEL_MAX_OUTPUT_TOKENS + 1
    mock_client.tokenize.return_value = list(range(overflow_token_count))

    with patch("app.model.Model._load", return_value=mock_client):
        with pytest.raises(ValueError, match="switch to cloud mode"):
            model.generate("a very long prompt")

    mock_client.create_chat_completion.assert_not_called()


def test_qwen_generate_success_within_budget() -> None:
    """Verifies that generate() runs local inference normally when the prompt fits the context budget."""
    model = _qwen_model()
    mock_client = MagicMock()
    mock_client.tokenize.return_value = [1, 2, 3]
    mock_client.create_chat_completion.return_value = {"choices": [{"message": {"content": '{"ok": true}'}}]}

    with patch("app.model.Model._load", return_value=mock_client):
        result = model.generate("short prompt")

    assert result == '{"ok": true}'
    assert mock_client.create_chat_completion.call_args.kwargs["max_tokens"] == 768


def test_openai_model_load_and_generate() -> None:
    """Verifies that the Model class successfully handles the OpenAI provider."""
    from app.model import Model

    openai_cfg = {
        "name": "gpt-4o-mini",
        "provider": "openai",
        "shortened": "GPT",
        "cloud": True,
    }
    model = Model(openai_cfg)

    # Test load
    assert model._load() is True

    # Test generate
    with patch("httpx.post") as mock_post, patch.dict("os.environ", {"OPENAI_API_KEY": "test-key"}):
        mock_response = MagicMock()
        mock_response.json.return_value = {"choices": [{"message": {"content": '{"problem_type": "none"}'}}]}
        mock_post.return_value = mock_response

        res = model.generate("test prompt")
        assert res == '{"problem_type": "none"}'
        mock_post.assert_called_once()


@patch("app.apis.intelligence.models")
def test_analyze_fallback_to_openai(mock_models) -> None:
    """Verifies that analyze falls back to OpenAI if Gemini fails in cloud mode."""
    from app.func import Intelligence

    intel = Intelligence()

    # Find the models in the instances
    gemini_model = next(m for m in intel.models if m.provider == "google")
    openai_model = next(m for m in intel.models if m.provider == "openai")

    # Mock Gemini model generate to raise an exception, and OpenAI model generate to return JSON
    with (
        patch.object(gemini_model, "generate", side_effect=Exception("Gemini Offline")),
        patch.object(openai_model, "generate", return_value=json.dumps(LOCAL_ANALYSIS_RESPONSE)) as mock_openai_gen,
    ):

        res = intel.analyze(content="test logs", mode="cloud", use_rag=False)

        assert res["problem_type"] == LOCAL_ANALYSIS_RESPONSE["problem_type"]
        assert res["model"] == openai_model.shortened
        mock_openai_gen.assert_called_once()


@patch("app.apis.db")
@patch("app.apis.intelligence.get_model_for_mode")
def test_analyze_persists_with_log_id(mock_get_model, mock_db) -> None:
    """Verifies that /api/v1/analyze upserts the result into completed_analyses when log_id is given."""
    mock_model = MagicMock()
    mock_model.shortened = "Qwen"
    mock_model.generate.return_value = json.dumps(LOCAL_ANALYSIS_RESPONSE)
    mock_get_model.return_value = mock_model
    collection = mock_db.db["completed_analyses"]
    collection.count_documents.return_value = 1

    response = client.post(
        "/api/v1/analyze",
        json={
            "content": "Deployment failed: database connection timeout",
            "mode": "local",
            "log_id": "log-123",
        },
    )

    assert response.status_code == 200
    collection.insert_one.assert_not_called()
    collection.update_one.assert_called_once()
    args, kwargs = collection.update_one.call_args
    assert args[0] == {"log_id": "log-123"}
    assert kwargs.get("upsert") is True
    assert args[1]["$set"]["log_id"] == "log-123"
    assert args[1]["$set"]["problem_type"] == LOCAL_ANALYSIS_RESPONSE["problem_type"]


@patch("app.apis.db")
@patch("app.apis.intelligence.get_model_for_mode")
def test_analyze_without_log_id_inserts_without_upsert(mock_get_model, mock_db) -> None:
    """Verifies that /api/v1/analyze inserts a plain record when no log_id is given."""
    mock_model = MagicMock()
    mock_model.shortened = "Qwen"
    mock_model.generate.return_value = json.dumps(LOCAL_ANALYSIS_RESPONSE)
    mock_get_model.return_value = mock_model
    collection = mock_db.db["completed_analyses"]
    collection.count_documents.return_value = 1

    response = client.post(
        "/api/v1/analyze",
        json={"content": "Deployment failed: database connection timeout", "mode": "local"},
    )

    assert response.status_code == 200
    collection.update_one.assert_not_called()
    collection.insert_one.assert_called_once()
    assert "log_id" not in collection.insert_one.call_args.args[0]


@patch("app.apis.db")
def test_query_analyses_returns_persisted_results(mock_db) -> None:
    """Verifies that /api/v1/analyses/query returns persisted analyses keyed by log_id."""
    collection = mock_db.db["completed_analyses"]
    collection.find.return_value = [{"log_id": "log-123", **LOCAL_ANALYSIS_RESPONSE}]

    response = client.post("/api/v1/analyses/query", json={"log_ids": ["log-123", "log-456"]})

    assert response.status_code == 200
    body = response.json()
    assert list(body.keys()) == ["log-123"]
    assert body["log-123"]["problem_type"] == LOCAL_ANALYSIS_RESPONSE["problem_type"]
    collection.find.assert_called_once_with({"log_id": {"$in": ["log-123", "log-456"]}})


def test_query_analyses_empty_log_ids_returns_empty_dict() -> None:
    """Verifies that /api/v1/analyses/query short-circuits to an empty map for an empty log_ids list."""
    response = client.post("/api/v1/analyses/query", json={"log_ids": []})

    assert response.status_code == 200
    assert response.json() == {}


@patch("app.apis.db")
def test_delete_analysis_removes_single_entry(mock_db) -> None:
    """Verifies that DELETE /api/v1/analyses/{log_id} removes only the matching persisted analysis."""
    collection = mock_db.db["completed_analyses"]
    collection.count_documents.return_value = 0

    response = client.delete("/api/v1/analyses/log-123")

    assert response.status_code == 204
    collection.delete_one.assert_called_once_with({"log_id": "log-123"})


@patch("app.apis.db")
def test_delete_all_analyses_removes_only_log_linked_entries(mock_db) -> None:
    """Verifies that DELETE /api/v1/analyses removes only analyses tied to a log_id."""
    collection = mock_db.db["completed_analyses"]
    collection.count_documents.return_value = 0

    response = client.delete("/api/v1/analyses")

    assert response.status_code == 200
    assert response.json() == {"message": "All persisted analyses deleted successfully"}
    collection.delete_many.assert_called_once_with({"log_id": {"$exists": True}})
