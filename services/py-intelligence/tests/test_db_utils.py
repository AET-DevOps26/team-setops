import pytest
import datetime
from unittest.mock import patch, ANY
from app.utils.db_utils import DB


@pytest.fixture
def mock_db_config():
    """
    Fixture to mock environment variables for database configuration.
    """
    with patch.dict(
        "os.environ",
        {
            "MONGODB_URI": "mongodb://localhost:27017",
            "DB_NAME": "test_db",
            "COLLECTION_NAME": "test_collection",
        },
    ):
        yield


@pytest.fixture
def db_instance(mock_db_config):
    """
    Fixture to provide a DB instance with a mocked MongoClient.
    """
    with patch("pymongo.MongoClient") as mock_client:
        db = DB()
        yield db, mock_client


def test_db_init(db_instance):
    """
    Test that the DB class initializes the MongoClient with correct parameters.
    """
    db, mock_client = db_instance
    assert db.client == mock_client.return_value
    mock_client.assert_called_once_with("mongodb://localhost:27017", tlsCAFile=ANY)


def test_db_connect_success(db_instance):
    """
    Test that the connect method successfully pings the database.
    """
    db, mock_client = db_instance
    mock_client.return_value.admin.command.return_value = {"ok": 1.0}

    # This should not raise an exception
    db.connect()
    mock_client.return_value.admin.command.assert_called_once_with("ping")


def test_db_connect_failure(db_instance):
    """
    Test that the connect method handles connection failures gracefully.
    """
    db, mock_client = db_instance
    mock_client.return_value.admin.command.side_effect = Exception("Connection failed")

    # Should handle exception internally and print error
    db.connect()
    mock_client.return_value.admin.command.assert_called_once_with("ping")


def test_add_new_document_success(db_instance):
    """
    Test adding a valid document to the database.
    """
    db, mock_client = db_instance
    doc = {"title": "Test Title", "content": "Test Content", "tags": ["test"]}

    success = db.add_new_document(doc)

    assert success is True
    assert "created_at" in doc
    assert isinstance(doc["created_at"], datetime.datetime)
    db.collection.insert_one.assert_called_once_with(doc)


def test_add_new_document_missing_fields(db_instance):
    """
    Test that adding a document with missing required fields fails.
    """
    db, mock_client = db_instance

    # Missing content
    assert db.add_new_document({"title": "Only Title"}) is False

    # Empty title
    assert db.add_new_document({"title": " ", "content": "Content"}) is False

    db.collection.insert_one.assert_not_called()


def test_add_new_document_formatting(db_instance):
    """
    Test that documents are correctly formatted (tags and timestamp added).
    """
    db, mock_client = db_instance
    doc = {"title": "Title", "content": "Content"}  # No tags

    db.add_new_document(doc)

    assert doc["tags"] == []
    assert "created_at" in doc


def test_delete_all_documents(db_instance):
    """
    Test that the delete_all_documents method clears the collection.
    """
    db, mock_client = db_instance

    success = db.delete_all_documents()

    assert success is True
    db.collection.delete_many.assert_called_once_with({})
