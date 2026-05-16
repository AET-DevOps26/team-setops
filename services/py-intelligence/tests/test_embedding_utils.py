import pytest
from unittest.mock import MagicMock, patch
from app.utils.embedding_utils import get_embedding, create_all_embeddings, similarity_search

@pytest.fixture
def mock_ollama():
    """
    Fixture to mock the ollama library to prevent actual API calls during tests.
    """
    with patch("app.utils.embedding_utils.ollama") as mock:
        yield mock

@pytest.fixture
def mock_db():
    """
    Fixture to mock the DB class to prevent actual database connections during tests.
    """
    with patch("app.utils.embedding_utils.DB") as mock:
        yield mock

def test_get_embedding(mock_ollama):
    """
    Test that get_embedding correctly calls Ollama and returns the first embedding.
    """
    mock_ollama.embed.return_value = {"embeddings": [[0.1, 0.2, 0.3]]}
    
    embedding = get_embedding("test text")
    
    assert embedding == [0.1, 0.2, 0.3]
    mock_ollama.embed.assert_called_once_with(model="nomic-embed-text", input="test text")

def test_create_all_embeddings_success(mock_db, mock_ollama):
    """
    Test that create_all_embeddings processes all documents and updates them.
    """
    # Setup mock DB and collection
    mock_collection = MagicMock()
    mock_db.return_value.db = {"injestions": mock_collection}
    
    # Mock documents to be processed
    mock_collection.find.return_value = [
        {"_id": "1", "content": "text 1"},
        {"_id": "2", "content": "text 2"}
    ]
    
    # Mock embedding generation
    mock_ollama.embed.return_value = {"embeddings": [[0.5, 0.6]]}
    
    success = create_all_embeddings(collection_name="injestions")
    
    assert success is True
    assert mock_collection.update_one.call_count == 2
    mock_collection.find.assert_called_once()

def test_create_all_embeddings_no_docs(mock_db):
    """
    Test that create_all_embeddings handles empty collections gracefully.
    """
    mock_collection = MagicMock()
    mock_db.return_value.db = {"injestions": mock_collection}
    mock_collection.find.return_value = []
    
    success = create_all_embeddings(collection_name="injestions")
    
    assert success is True
    mock_collection.update_one.assert_not_called()

def test_similarity_search(mock_db, mock_ollama):
    """
    Test that similarity_search performs vector search and cleans results.
    """
    mock_collection = MagicMock()
    mock_db.return_value.db = {"injestions": mock_collection}
    
    # Mock aggregation results
    mock_collection.aggregate.return_value = [
        {"title": "Result 1", "embedding": [0.1]},
        {"title": "Result 2"}
    ]
    
    # Mock query embedding
    mock_ollama.embed.return_value = {"embeddings": [[0.9, 0.8]]}
    
    results = similarity_search("query", limit=2)
    
    assert len(results) == 2
    assert "embedding" not in results[0] # Should be deleted
    mock_collection.aggregate.assert_called_once()
