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

Verify if the service is up and running. Also reports whether this deployment runs the accelerated local model, and (only when `LLAMA_N_THREADS` is set, e.g. on a CPU-constrained deployment) the available vs. recommended thread count.

```bash
curl -X GET http://localhost:8000/health
```

**Expected Response:**

```json
{
  "status": "ok",
  "service": "py-intelligence",
  "local_model_accelerated": true
}
```

On a CPU-constrained deployment (e.g. Rancher/K8s), the response also includes:

```json
{
  "status": "ok",
  "service": "py-intelligence",
  "local_model_accelerated": false,
  "local_threads": 3,
  "local_threads_recommended": 4
}
```

---

## 2. Analyze Content

The main endpoint for log analysis and troubleshooting. Coordinates optional RAG retrieval, problem analysis, troubleshooting steps, and solution suggestions. If `log_id` is set, the result is persisted in MongoDB and can be fetched again via `/api/v1/analyses/query`.

```bash
curl -X POST http://localhost:8000/api/v1/analyze \
     -H "Content-Type: application/json" \
     -d '{
           "content": "2026-07-16T10:12:04.221Z ERROR [http-nio-8080-exec-3] com.zaxxer.hikari.pool.HikariPool - HikariPool-1 - Connection is not available, request timed out after 30000ms.",
           "mode": "local",
           "use_rag": true,
           "context": "Production environment, cluster-west-1",
           "log_id": "00393766-d972-4473-b64a-c280858990c2"
         }'
```

**Expected Response:**

```json
{
  "model": "Qwen 2.5 Coder 3B",
  "problem_type": "Database Connection Timeout",
  "severity": "high",
  "summary": "HikariPool-1 connection timeout after 30000ms",
  "problem_summary": "The application is unable to establish a database connection within the specified timeout period.",
  "evidence": [
    "2026-07-16T10:12:04.221Z ERROR [http-nio-8080-exec-3] com.zaxxer.hikari.pool.HikariPool - HikariPool-1 - Connection is not available, request timed out after 30000ms."
  ],
  "troubleshoot": [
    "Check database server status and ensure it is running.",
    "Verify network connectivity between the application and the database server."
  ],
  "solutions": [
    "Increase the connection timeout in the HikariPool configuration.",
    "Check database connection settings and ensure the database is running and accessible."
  ],
  "sources": [],
  "confidence": "high"
}
```

---

## 3. Fetch Persisted Analyses

Look up previously persisted analyses for one or more log IDs (e.g. to restore AI Insights after a page reload). Log IDs with no stored analysis are omitted from the response.

```bash
curl -X POST http://localhost:8000/api/v1/analyses/query \
     -H "Content-Type: application/json" \
     -d '{
           "log_ids": ["00393766-d972-4473-b64a-c280858990c2"]
         }'
```

**Expected Response:**

```json
{
  "00393766-d972-4473-b64a-c280858990c2": {
    "model": "Qwen 2.5 Coder 3B",
    "problem_type": "Database Connection Timeout",
    "severity": "high",
    "summary": "HikariPool-1 connection timeout after 30000ms",
    "problem_summary": "The application is unable to establish a database connection within the specified timeout period.",
    "evidence": ["..."],
    "troubleshoot": ["..."],
    "solutions": ["..."],
    "sources": [],
    "confidence": "high"
  }
}
```

---

## 4. Delete a Persisted Analysis

Remove the persisted analysis for a single log. Called when the corresponding log is deleted.

```bash
curl -X DELETE http://localhost:8000/api/v1/analyses/00393766-d972-4473-b64a-c280858990c2
```

**Expected Response:**
*Status Code:* `204 No Content` (Empty response body)

---

## 5. Delete All Persisted Analyses

Remove all persisted analyses tied to a log_id. Called when all logs are cleared at once.

```bash
curl -X DELETE http://localhost:8000/api/v1/analyses
```

**Expected Response:**

```json
{
  "message": "All persisted analyses deleted successfully"
}
```

---

## 6. Add RAG Document

Add a new document to the retrieval-augmented generation store. This will also trigger an automatic embedding update.

```bash
curl -X POST http://localhost:8000/api/v1/rag/documents \
     -H "Content-Type: application/json" \
     -d '{
           "title": "spring-alerts NullPointerException on IncidentStatus.getStatus()",
           "content": "RulesEngine.evaluate() throws NullPointerException on incident.getStatus() when a RabbitMQ message references a logId that has not yet been persisted to system_logs by spring-logbook. Fix: null-check the incident lookup in RulesEngine before calling getStatus(), and treat a not-yet-found log as ACTIVE by default rather than throwing.",
           "tags": ["spring-alerts", "race-condition", "npe"]
         }'
```

**Expected Response:**

```json
{
  "id": "66468a5c9e2b1f0001d8e123",
  "title": "spring-alerts NullPointerException on IncidentStatus.getStatus()",
  "content": "RulesEngine.evaluate() throws NullPointerException on incident.getStatus() when a RabbitMQ message references a logId that has not yet been persisted to system_logs by spring-logbook. Fix: null-check the incident lookup in RulesEngine before calling getStatus(), and treat a not-yet-found log as ACTIVE by default rather than throwing.",
  "tags": [
    "spring-alerts",
    "race-condition",
    "npe"
  ]
}
```

---

## 7. RAG Semantic Search

Search for documents that are semantically similar to your query.

```bash
curl -X POST http://localhost:8000/api/v1/rag/search \
     -H "Content-Type: application/json" \
     -d '{
           "query": "spring-alerts null pointer exception",
           "limit": 3
         }'
```

**Expected Response:**

```json
{
  "results": [
    {
      "document_id": "66468a5c9e2b1f0001d8e123",
      "title": "spring-alerts NullPointerException on IncidentStatus.getStatus()",
      "score": 1.0,
      "snippet": "RulesEngine.evaluate() throws NullPointerException on incident.getStatus() when a RabbitMQ message references a logId that has not yet been persisted to system_logs by spring-logbook."
    }
  ],
  "count": 1
}
```

---

## 8. Delete RAG Document

Remove a document from the store using its unique ID.

```bash
curl -X DELETE http://localhost:8000/api/v1/rag/documents/66468a5c9e2b1f0001d8e123
```

**Expected Response:**
*Status Code:* `204 No Content` (Empty response body)

---

## 9. Delete all RAG Documents

Remove all documents from the RAG store. This will also trigger an automatic embedding update.

```bash
curl -X DELETE http://localhost:8000/api/v1/rag/delete_all
```

**Expected Response:**

```json
{
  "message": "All documents deleted successfully"
}
```
