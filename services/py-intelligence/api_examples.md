# DevPulse Intelligence Service - API Examples

This document provides example `curl` requests for interacting with the `py-intelligence` service API.

## Starting the Service

Run the following command from the `services/py-intelligence` directory to start the server:

```bash
uvicorn app.apis:app --reload
```

## Base URL

The default local development URL is: `http://localhost:8000`

---

## 1. Health Check

Verify if the service is up and running.

```bash
curl -X GET http://localhost:8000/health
```

**Expected Response:**

```json
{
  "status": "ok",
  "service": "py-intelligence"
}
```

---

## 2. Analyze Content

The main endpoint for log analysis and troubleshooting.

```bash
curl -X POST http://0.0.0.0:8000/api/v1/analyze \
     -H "Content-Type: application/json" \
     -d '{
           "content": "Deployment failed: database connection timeout",
           "mode": "local",
           "use_rag": true,
           "context": "Production environment, cluster-west-1"
         }'
```

> [!NOTE]
> This endpoint is currently a contract-only placeholder and will return a `501 Not Implemented` status.

---

## 3. Add RAG Document

Add a new document to the retrieval-augmented generation store. This will also trigger an automatic embedding update.

```bash
curl -X POST http://0.0.0.0:8000/api/v1/rag/documents \
     -H "Content-Type: application/json" \
     -d '{
           "title": "Redis Connection Pool Fix",
           "content": "To resolve Redis timeouts, increase the max_connections in the configuration file to 100.",
           "tags": ["redis", "timeout", "guide"]
         }'
```

**Expected Response:**

```json
{
  "id": "66468a5c9e2b1f0001d8e123",
  "title": "Redis Connection Pool Fix",
  "content": "To resolve Redis timeouts, increase the max_connections in the configuration file to 100.",
  "tags": [
    "redis",
    "timeout",
    "guide"
  ]
}
```

---

## 4. RAG Semantic Search

Search for documents that are semantically similar to your query.

```bash
curl -X POST http://0.0.0.0:8000/api/v1/rag/search \
     -H "Content-Type: application/json" \
     -d '{
           "query": "how to fix redis timeouts?",
           "limit": 3
         }'
```

**Expected Response:**

```json
{
  "results": [
    {
      "document_id": "66468a5c9e2b1f0001d8e123",
      "title": "Redis Connection Pool Fix",
      "score": 1.0,
      "snippet": "To resolve Redis timeouts, increase the max_connections in the configuration file to 100."
    }
  ],
  "count": 1
}
```

---

## 5. Delete RAG Document

Remove a document from the store using its unique ID.

```bash
curl -X DELETE http://0.0.0.0:8000/api/v1/rag/documents/66468a5c9e2b1f0001d8e123
```

**Expected Response:**
*Status Code:* `204 No Content` (Empty response body)

---

## 6. Delete all RAG Documents

Remove all documents from the RAG store. This will also trigger an automatic embedding update.

```bash
curl -X DELETE http://0.0.0.0:8000/api/v1/rag/delete_all
```

**Expected Response:**

```json
{
  "message": "All documents deleted successfully"
}
```
