---
sidebar_position: 4
---

# API Documentation

`api/openapi.yaml` is the single source of truth for the API contract. `api/scripts/gen-all.sh` regenerates `client/src/api.ts` from it, enforced by the `openapi-sync-check` CI job.

## Swagger UI

Interactive API documentation (Swagger UI) is automatically generated and accessible at runtime for each microservice. When running the services locally, you can view the API references at the following URLs:

- **Py-Intelligence (FastAPI):** [http://localhost:8001/docs](http://localhost:8001/docs)
- **Spring Ingestion:** `http://localhost:<PORT>/swagger-ui.html`
- **Spring Alerts:** `http://localhost:<PORT>/swagger-ui.html`
- **Spring Logbook:** `http://localhost:<PORT>/swagger-ui.html`

_(Replace `<PORT>` with the respective mapped ports defined in your docker-compose or Spring application properties.)_
