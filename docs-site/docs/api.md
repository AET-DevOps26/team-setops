---
sidebar_position: 8
---

# API Documentation

`api/openapi.yaml` is the single source of truth for the API contract. `api/scripts/gen-all.sh` regenerates `client/src/api.ts` from it, enforced by the `openapi-sync-check` CI job.

## Swagger UI

Interactive API documentation (Swagger UI) is automatically generated and accessible at runtime for each microservice. When running the services locally, you can view the API references at the following URLs:

- **Py-Intelligence (FastAPI):** [http://localhost:8001/docs](http://localhost:8001/docs)
- **Spring Ingestion:** `http://localhost:8081/swagger-ui.html`
- **Spring Logbook:** `http://localhost:8082/swagger-ui.html`
- **Spring Alerts:** `http://localhost:8083/swagger-ui.html`

## Gateway Routing

All client requests go to the Nginx gateway at `http://localhost:8080` (local) or the cluster ingress. The gateway routes by path and, for `/api/v1/logs`, also by method:

| Path | Method | Routed to |
| :--- | :--- | :--- |
| `/` | ALL | `client:3000` |
| `/api/v1/logs` | `POST` | `spring-ingestion:8080` |
| `/api/v1/logs` | `GET`, `DELETE` | `spring-logbook:8080` |
| `/api/v1/alerts/system` | ALL | `spring-ingestion:8080` |
| `/api/v1/alerts` | ALL | `spring-alerts:8080` |
| `/api/v1/incidents` | `GET`, `PATCH` | `spring-alerts:8080` |
| `/api/v1/logbook` | ALL | `spring-logbook:8080` |
| `/api/v1/analyze` | `POST` | `py-intelligence:8000` |
| `/api/v1/analyses` | `POST`, `DELETE` | `py-intelligence:8000` |
| `/api/v1/rag/*` | ALL | `py-intelligence:8000` |
| `/health` | `GET` | `py-intelligence:8000` |
| `/prometheus` | `GET` | `prometheus:9090` (basic auth) |
| `/grafana` | `GET` | `grafana:3000` |

## Local Testing

Start the stack, then exercise each route through the gateway:

```bash
cd infra
docker-compose up -d --build
```

```bash
# Ingest a log
curl -X POST http://localhost:8080/api/v1/logs \
     -H "Content-Type: application/json" \
     -d '{
           "serviceName": "payment-service",
           "type": "DEPLOYMENT_LOG",
           "severity": "ERROR",
           "logContent": "Out of memory error in payment processor",
           "timestamp": "2026-06-09T16:00:00Z"
         }'
# Expect 202 Accepted

# Fetch the log timeline
curl http://localhost:8080/api/v1/logs
# Expect 200 OK with a JSON list

# Fetch active incidents
curl "http://localhost:8080/api/v1/incidents?status=ACTIVE"
# Expect 200 OK with a JSON list

# Trigger AI analysis
curl -X POST http://localhost:8080/api/v1/analyze \
     -H "Content-Type: application/json" \
     -d '{
           "content": "Deployment failed: database connection timeout",
           "mode": "local",
           "use_rag": false
         }'
# Expect 200 OK with a structured analysis
```
