import os
from sentence_transformers import SentenceTransformer
from app.utils.db_utils import DB

_model = None


def get_embedding(text: str) -> list[float]:
    """
    Generate a vector embedding for the given text using local SentenceTransformers.

    Args:
        text (str): The input text to be embedded.

    Returns:
        list[float]: A list of floats representing the text embedding.
    """
    global _model
    if _model is None:
        # nomic-embed-text-v1.5 produces 768-dim vectors, matching the nomic-embed-text dimension.
        _model = SentenceTransformer(
            "nomic-ai/nomic-embed-text-v1.5", trust_remote_code=True
        )

    # Generate the embedding
    embedding = _model.encode(text, convert_to_numpy=True)
    return embedding.tolist()


def create_all_embeddings(collection_name: str = None):
    """
    Batch process all documents in a collection to generate and store missing embeddings.

    Iterates through all documents that do not yet have an 'embedding' field,
    generates one using the embedding engine, and updates the document in MongoDB.

    Args:
        collection_name (str, optional): The name of the collection to process.
            Defaults to COLLECTION_NAME from environment variables.

    Returns:
        bool: True if the process completed successfully, False otherwise.
    """
    if collection_name is None:
        collection_name = os.getenv("COLLECTION_NAME", "injestions")

    db = DB()
    collection = db.db[collection_name]

    # Only fetch documents that don't have an embedding field
    query = {"embedding": {"$exists": False}}
    documents = list(collection.find(query))

    if not documents:
        print(
            f"No documents without embeddings found in collection '{collection_name}'"
        )
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
                {"_id": document["_id"]}, {"$set": {"embedding": embedding}}
            )
            count += 1
        except Exception as e:
            print(f"Error processing document {document['_id']}: {e}")
            continue

    print(f"Successfully processed {count} embeddings.")
    return True


def similarity_search(
    query: str, limit: int = 5, collection_name: str = None
) -> list[dict]:
    """
    Perform a vector similarity search in MongoDB using a text query.

    The function converts the input query into an embedding and uses MongoDB's
    $vectorSearch aggregation to find the most relevant documents based on
    cosine similarity.

    Args:
        query (str): The search query text.
        limit (int, optional): The maximum number of documents to return. Defaults to 5.
        collection_name (str, optional): The name of the collection to search.
            Defaults to COLLECTION_NAME from environment variables.

    Returns:
        list[dict]: A list of similar documents, with the 'embedding' field removed.
    """
    if collection_name is None:
        collection_name = os.getenv("COLLECTION_NAME", "injestions")

    db_instance = DB()
    collection = db_instance.db[collection_name]

    query_vector = get_embedding(query)

    results = list(
        collection.aggregate(
            [
                {
                    "$vectorSearch": {
                        "index": "vector_index",
                        "queryVector": query_vector,
                        "path": "embedding",
                        "numCandidates": limit * 2,
                        "limit": limit,
                        "similarity": "cosine",
                    }
                }
            ]
        )
    )

    # Remove the embedding field from results to keep them lightweight
    for doc in results:
        if "embedding" in doc:
            del doc["embedding"]

    return results


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
