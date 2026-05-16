import os
import ollama
from db_utils import DB

def get_embedding(text: str) -> list[float]:
    """
    Get the embedding for a given text using Ollama.
    """
    response = ollama.embed(model="nomic-embed-text", input=text)
    return response['embeddings'][0]

def create_all_embeddings(collection_name: str = None):
    """
    Creates embeddings for all documents in the collection that don't have one yet.
    """
    if collection_name is None:
        collection_name = os.getenv("COLLECTION_NAME", "injestions")

    db = DB()
    collection = db.db[collection_name]
    
    # Only fetch documents that don't have an embedding field
    query = {"embedding": {"$exists": False}}
    documents = list(collection.find(query))
    
    if not documents:
        print(f"No documents without embeddings found in collection '{collection_name}'")
        return True

    print(f"Found {len(documents)} documents to embed in '{collection_name}'")
    
    count = 0
    for document in documents:
        try:
            print(f"Creating embedding for document: {document['_id']}")
            content = document.get("content")
            if not content:
                continue
                
            embedding = get_embedding(content)
            collection.update_one(
                {"_id": document["_id"]}, 
                {"$set": {"embedding": embedding}}
            )
            count += 1
        except Exception as e:
            print(f"Error processing document {document['_id']}: {e}")
            continue
            
    print(f"Successfully processed {count} embeddings.")
    return True

def similarity_search(
    query: str,
    limit: int = 5,
    collection_name: str = None
) -> list[dict]:
    """
    Perform a similarity search in the MongoDB collection given a query.
    """
    if collection_name is None:
        collection_name = os.getenv("COLLECTION_NAME", "injestions")

    db_instance = DB()
    collection = db_instance.db[collection_name]
    
    query_vector = get_embedding(query)

    results = collection.aggregate([
        {
            '$vectorSearch': {
                'index': "vector_index",
                'queryVector': query_vector,
                'path': 'embedding',
                'numCandidates': limit * 2,
                'limit': limit,
                'similarity': 'cosine'
            }
        }
    ])

    return list(results)

if __name__ == "__main__":
    print("Creating embeddings...")
    if create_all_embeddings():
        print("Embeddings created successfully")
    else:
        print("Failed to create embeddings")

    sim_results = similarity_search("How do I run migrations?", limit=3)
    print("The result for the query: ")
    for doc in sim_results:
        print(doc["title"])
        
    