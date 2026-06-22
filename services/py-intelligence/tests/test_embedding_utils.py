import os
import pytest
import numpy as np
from unittest.mock import MagicMock, patch
from app.utils.embedding_utils import (
    get_embedding,
    create_all_embeddings,
    similarity_search,
)


@pytest.fixture
def mock_sentence_transformer():
    """
    Fixture to mock SentenceTransformer to prevent actual model loading during tests.
    """
    with patch("app.utils.embedding_utils.SentenceTransformer") as mock:
        mock_instance = MagicMock()
        mock.return_value = mock_instance
        yield mock_instance


@pytest.fixture
def mock_db():
    """
    Fixture to mock the DB class to prevent actual database connections during tests.
    """
    with patch("app.utils.embedding_utils.DB") as mock:
        yield mock


def test_get_embedding(mock_sentence_transformer):
    """
    Test that get_embedding correctly calls SentenceTransformer and returns the embedding.
    """
    mock_sentence_transformer.encode.return_value = np.array([0.1, 0.2, 0.3])

    # Reset any cached model to trigger the mock
    import app.utils.embedding_utils

    app.utils.embedding_utils._model = None

    embedding = get_embedding("test text")

    assert embedding == [0.1, 0.2, 0.3]
    mock_sentence_transformer.encode.assert_called_once_with("test text", convert_to_numpy=True)


def test_create_all_embeddings_success(mock_db, mock_sentence_transformer):
    """
    Test that create_all_embeddings processes all documents and updates them.
    """
    # Setup mock DB and collection
    mock_collection = MagicMock()
    collection_name = os.getenv("COLLECTION_NAME", "injestions")
    mock_db.return_value.db = {collection_name: mock_collection}

    # Mock documents to be processed
    mock_collection.find.return_value = [
        {"_id": "1", "content": "text 1"},
        {"_id": "2", "content": "text 2"},
    ]

    # Mock embedding generation
    mock_sentence_transformer.encode.return_value = np.array([0.5, 0.6])

    # Reset any cached model to trigger the mock
    import app.utils.embedding_utils

    app.utils.embedding_utils._model = None

    success = create_all_embeddings(collection_name=collection_name)

    assert success is True
    assert mock_collection.update_one.call_count == 2
    mock_collection.find.assert_called_once()


def test_create_all_embeddings_no_docs(mock_db):
    """
    Test that create_all_embeddings handles empty collections gracefully.
    """
    mock_collection = MagicMock()
    collection_name = os.getenv("COLLECTION_NAME", "injestions")
    mock_db.return_value.db = {collection_name: mock_collection}
    mock_collection.find.return_value = []

    success = create_all_embeddings(collection_name=collection_name)

    assert success is True
    mock_collection.update_one.assert_not_called()


def test_similarity_search(mock_db, mock_sentence_transformer):
    """
    Test that similarity_search performs vector search and cleans results.
    """
    mock_collection = MagicMock()
    collection_name = os.getenv("COLLECTION_NAME", "injestions")
    mock_db.return_value.db = {collection_name: mock_collection}

    # Mock aggregation results
    mock_collection.aggregate.return_value = [
        {"title": "Result 1", "embedding": [0.1]},
        {"title": "Result 2"},
    ]

    # Mock query embedding
    mock_sentence_transformer.encode.return_value = np.array([0.9, 0.8])

    # Reset any cached model to trigger the mock
    import app.utils.embedding_utils

    app.utils.embedding_utils._model = None

    results = similarity_search("query", limit=2)

    assert len(results) == 2
    assert "embedding" not in results[0]
    mock_collection.aggregate.assert_called_once()
