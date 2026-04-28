# DevPulse - Team SETOps

DevPulse is a DevOps logbook for collecting deployment logs, system alerts, and troubleshooting notes. The goal is to help a team quickly understand what happened during a failed deployment or incident by showing the raw information together with AI-generated summaries and suggested fixes.

## Components

- **Frontend:** `client/`
  - Dashboard UI for developers and operators.
  - Shows logs, alerts, notes, and AI-generated insights.

- **Backend microservices:** `services/spring-*`
  - Java 21 / Spring Boot 3 services.
  - The server side is split into at least three microservices with separate responsibilities.
  - Exposes REST APIs and coordinates persistent storage and GenAI analysis.

- **GenAI:** `services/py-intelligence/`
  - Separate Python service.
  - Produces summaries, troubleshooting hints, and possible next steps from log content.

- **Infrastructure:** `infra/`
  - Place for Docker Compose, Kubernetes or Helm files, database setup, Prometheus, and Grafana.

## Repository Layout

```text
repo/
├── api/                   # Single source of truth
│   ├── openapi.yaml       # Versioned spec (v1, v2...)
│   └── scripts/           # Helper scripts for code generation
├── services/
│   ├── spring-ingestion/  # Spring Boot service for receiving logs/events
│   ├── spring-logbook/    # Spring Boot service for stored logs and notes
│   ├── spring-alerts/     # Spring Boot service for alerts/incident state
│   └── py-intelligence/   # Python GenAI service
├── client/                # client component
├── infra/                 # Docker Compose, Kubernetes, database, monitoring
└── .github/workflows/     # CI pipelines
```

## Basic Flow

`client` sends requests to the Spring Boot backend services. The backend services manage logs, notes, alerts, and persistent storage. When AI analysis is needed, the backend calls `py-intelligence` through a defined JSON/HTTP interface. The OpenAPI file in `api/` is the shared API contract.

## Branch Naming

Use this format for feature and bugfix branches:

```text
(feat|fix)/(issue_id)/(name_of_issue)
```

Examples:

```text
feat/12/add-log-ingestion
fix/18/handle-empty-ai-response
```
