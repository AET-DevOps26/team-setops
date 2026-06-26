# 🌐 API Gateway Documentation

In DevPulse, an **Nginx-based API Gateway** acts as the single entry point (reverse proxy) for all client requests, routing traffic to the correct microservice based on the URL path and HTTP method. 

This document describes the routing topology, service mappings, and local testing procedures.

---

## 🗺️ Routing Architecture

```mermaid
graph TD
    Client[React Client] -->|Port 8080| Gateway[Nginx API Gateway]
    
    Gateway -->|/| ClientDev[React Dev Server - port 3000]
    Gateway -->|POST /api/v1/logs| Ingestion[spring-ingestion - port 8080]
    Gateway -->|GET /api/v1/logs| Logbook[spring-logbook - port 8080]
    Gateway -->|/api/v1/incidents| Alerts[spring-alerts - port 8080]
    Gateway -->|/api/v1/analyze| Intel[py-intelligence - port 8000]
    Gateway -->|/api/v1/rag/*| Intel[py-intelligence - port 8000]
    Gateway -->|/health| Intel[py-intelligence - port 8000]
```

---

## 📊 Gateway Route Mappings

All client requests should be directed to the gateway at **`http://localhost:8080`**. Nginx processes the requests and routes them internally:

| Path Pattern | HTTP Method | Internal Service URL | Description |
| :--- | :--- | :--- | :--- |
| **`/`** *(and static assets)* | `ALL` | `http://client:3000` | Fronts the React/Vite development server (proxies WebSockets for HMR). |
| **`/api/v1/logs`** | `POST` | `http://spring-ingestion:8080` | Endpoint to ingest raw developer/CI logs. |
| **`/api/v1/logs`** | `GET` | `http://spring-logbook:8080` | Endpoint to retrieve log records and deployment history. |
| **`/api/v1/incidents`** | `GET`, `PATCH`| `http://spring-alerts:8080` | Endpoint to fetch incident lists and update status states. |
| **`/api/v1/analyze`** | `POST` | `http://py-intelligence:8000` | Coordinates LLM summaries and troubleshooting guides. |
| **`/api/v1/rag/**`** | `ALL` | `http://py-intelligence:8000` | Manages RAG document indexing and semantic retrieval. |
| **`/health`** | `GET` | `http://py-intelligence:8000` | AI service liveness and health endpoint. |

---

## 🧪 Local Testing

Start the complete stack via Docker Compose:
```bash
cd infra
docker-compose up -d --build
```

### 1. Test Ingestion Service Routing (POST Logs)
Post a dummy log event payload to the gateway:
```bash
curl -X POST http://localhost:8080/api/v1/logs \
     -H "Content-Type: application/json" \
     -d '{
           "serviceName": "payment-service",
           "type": "DEPLOYMENT_LOG",
           "severity": "ERROR",
           "logContent": "Out of memory error in payment processor",
           "timestamp": "2026-06-09T16:00:00Z"
         }'
```
* **Expected Result:** HTTP status code `202 Accepted` returned from `spring-ingestion`.

### 2. Test Logbook Service Routing (GET Logs)
Fetch the deployment history timeline:
```bash
curl -X GET http://localhost:8080/api/v1/logs
```
* **Expected Result:** HTTP status code `200 OK` returning a JSON list of historical deployment logs from `spring-logbook`.

### 3. Test Alerts Service Routing (GET Incidents)
Fetch the current incident statuses:
```bash
curl -X GET "http://localhost:8080/api/v1/incidents?status=ACTIVE"
```
* **Expected Result:** HTTP status code `200 OK` returning a JSON list of active incidents from `spring-alerts`.

### 4. Test Intelligence Service Routing
Trigger log analysis via the gateway:
```bash
curl -X POST http://localhost:8080/api/v1/analyze \
     -H "Content-Type: application/json" \
     -d '{
           "content": "Deployment failed: database connection timeout",
           "mode": "local",
           "use_rag": false
         }'
```
* **Expected Result:** HTTP status code `200 OK` with structured JSON analysis of the database connectivity issue.