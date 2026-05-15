import certifi
import pymongo
from fastapi import HTTPException
from dotenv import load_dotenv
import os
import datetime


load_dotenv()

class DB: 
    """
    Database wrapper class for MongoDB
    """
    def __init__(self):
        self.client = pymongo.MongoClient(os.getenv("MONGODB_URI"), tlsCAFile=certifi.where())
        self.db = self.client[os.getenv("DB_NAME")]
        self.collection = self.db[os.getenv("COLLECTION_NAME")]
          
    def connect(self):
        try:
            self.client.admin.command('ping')
            print("Pinged your deployment. Connection successful!")
        except Exception as e:
            print(f"Error connecting to MongoDB: {e}")

    def create_all_embeddings(self):
        """
        Creates embeddings for all documents in the collection.

        Returns: 
            bool: True if successful, False otherwise
        """
        return False

    def add_new_document(self, document: dict):
        """
        Adds a new document to the collection.

        Args: 
            document[dict]: The document to add

        Returns: 
            bool: True if successful, False otherwise
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
        Deletes all documents from the collection.

        Returns: 
            bool: True if successful, False otherwise
        """
        self.collection.delete_many({})
        return True

def similarity_search(
    query: str,
    limit: int = 5,
    collection_name: str="rag"
) -> list[dict]:
    """
    Perform a similiarity search in the MongoDB collection given a query.

    Args: 
        query[str]: The search query
        limit[int]: Default is 5. Number of documents to return
        collection_name[str]: Default is "rag". The name of the collection to search

    Returns: 
        list[dict]: A list of similar documents
        
    """


    try:
        client = pymongo.MongoClient(os.getenv("MONGODB_URI"), tlsCAFile=certifi.where())
        db = client[os.getenv("DB_NAME")]
        collection = db[collection_name]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database connection failed: {str(e)}") from e

    query = {
    'text': query
}

    results = collection.aggregate([
    {
        '$vectorSearch': {
        'queryVector': query,
        'path': 'embedding',
        'numCandidates': limit * 2,  # or a fixed number > limit
        'limit': limit,
        'similarity': 'cosine'
        }
    }
    ])

    for doc in results:
        print(doc)
    return results


def main():
    db = DB()
    db.connect()
    # db.delete_all_documents()
    # add mock document 
    doc = {
        "title": "NALUS",
        "content": "Nalus war hier.",
        "tags": ["nalus", "nali"]
    }

    if db.add_new_document(doc):
        print("Mock document added successfully")
    else:
        print("Failed to add mock document")
    

    
if __name__ == "__main__":
    main()
