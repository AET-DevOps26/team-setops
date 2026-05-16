import certifi
import pymongo
from dotenv import load_dotenv
import os
import datetime

load_dotenv()


class DB:
    """
    Database wrapper class for MongoDB, providing methods for connection management
    and CRUD operations on the RAG collection.
    """

    def __init__(self):
        mongodb_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
        db_name = os.getenv("DB_NAME", "devpulse")
        collection_name = os.getenv("COLLECTION_NAME", "rag_documents")

        self.client = pymongo.MongoClient(
            mongodb_uri, tlsCAFile=certifi.where() if "mongodb+srv" in mongodb_uri else None
        )
        self.db = self.client[db_name]
        self.collection = self.db[collection_name]

    def connect(self):
        """
        Verify the database connection by pinging the MongoDB deployment.
        """
        try:
            self.client.admin.command("ping")
            print("Pinged your deployment. Connection successful!")
        except Exception as e:
            print(f"Error connecting to MongoDB: {e}")

    def add_new_document(self, document: dict):
        """
        Validate and insert a new document into the MongoDB collection.

        Args:
            document (dict): The document data containing 'title' and 'content'.
                Tags and 'created_at' timestamp are added automatically if missing.

        Returns:
            bool: True if insertion was successful, False if validation failed or an error occurred.
        """
        # Validation
        required_fields = ["title", "content"]
        for field in required_fields:
            if field not in document or not str(document.get(field, "")).strip():
                print(f"Validation error: Missing or empty field '{field}'")
                return False

        # Formatting
        if "tags" not in document or not isinstance(document["tags"], list):
            document["tags"] = []

        if "created_at" not in document:
            document["created_at"] = datetime.datetime.now(datetime.UTC)

        try:
            self.collection.insert_one(document)
            return True
        except Exception as e:
            print(f"Error adding document: {e}")
            return False

    def delete_all_documents(self):
        """
        Delete all documents currently stored in the RAG collection.

        Returns:
            bool: True if the operation completed (even if the collection was already empty).
        """
        self.collection.delete_many({})
        return True


def main():
    db = DB()
    db.connect()
    # db.delete_all_documents()
    # Create four mock documents and add them all
    mock_docs = [
        {
            "title": "Redis Connection Timeout in py-intelligence",
            "content": (
                "The service py-intelligence is experiencing intermittent connection timeouts "
                "when connecting to the Redis cache. This usually happens during peak traffic hours. "
                "Suggested fix: increase the max_connections in the redis pool configuration."
            ),
            "tags": ["redis", "timeout", "bug"],
        },
        {
            "title": "Kubernetes ImagePullBackOff on Production",
            "content": (
                "New deployments to the production cluster are failing with ImagePullBackOff. "
                "Investigation shows that the CI pipeline is pushing images to the dev registry "
                "but the production cluster doesn't have pull permissions for that registry."
            ),
            "tags": ["kubernetes", "deployment", "critical"],
        },
        {
            "title": "Running Database Migrations with Alembic",
            "content": (
                "To run migrations in this repo, use 'alembic upgrade head'. Make sure your DB_URL "
                "environment variable is set correctly to your local or staging PostgreSQL "
                "instance before running the command."
            ),
            "tags": ["database", "migration", "guide"],
        },
        {
            "title": "Optimizing Jenkins Pipelines for Node.js",
            "content": (
                "Jenkins pipelines for Node.js services can be sped up by using the node_modules "
                "cache plugin and running 'npm install' only when package-lock.json changes. "
                "Also, consider parallelizing the test and lint stages."
            ),
            "tags": ["jenkins", "pipeline", "optimization"],
        },
    ]

    for doc in mock_docs:
        if db.add_new_document(doc):
            print(f"Document '{doc['title']}' added successfully")
        else:
            print(f"Failed to add document '{doc['title']}'")


if __name__ == "__main__":
    main()
