# DevPulse - Team SETOps

DevPulse is a DevOps logbook for collecting deployment logs, system alerts, and troubleshooting notes. The goal is to help a team quickly understand what happened during a failed deployment or incident by showing the raw information together with AI-generated summaries and suggested fixes.

## Components

- **Client:** `client/`
  - Dashboard UI for developers and operators.
  - Shows logs, alerts, notes, and AI-generated insights.

- **Server microservices:** `services/spring-*`
  - Java 25 / Spring Boot 4 services.
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
├── client/                # Client component
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

## Local Build and Test Commands

### 🛠 Prerequisites

To run this project locally, you must have the following installed:

- [Docker](https://docs.docker.com/get-docker/) (Docker Desktop recommended for Mac/Windows)
- [Docker Compose](https://docs.docker.com/compose/install/)

_(Note: You do not need Java, Python, or Node.js installed on your host machine to run the application, as everything runs inside the containers!)_

### Build

```bash
cd infra
docker-compose up --build
```

## Local Build and Test Commands for individual components

Run all commands from the repository root unless noted otherwise.

### Spring Alerts

```bash
cd services/spring-alerts
./gradlew :app:clean :app:test :app:build
./gradlew :app:bootRun
```

### Spring Ingestion

```bash
cd services/spring-ingestion
./gradlew :app:clean :app:test :app:build
./gradlew :app:bootRun
```

### Spring Logbook

```bash
cd services/spring-logbook
./gradlew :app:clean :app:test :app:build
./gradlew :app:bootRun
```

### Client

```bash
cd client
npm ci
npm run lint
npm run test -- --run
npm run build
npm run dev
```

### CI-Oriented One-Shot Test Commands

Use these for non-watch runs in CI:

```bash
# Spring services (run per service directory)
./gradlew :app:test

# Client
npm run test -- --run
```

## 🚀 Kubernetes Deployment & CI/CD Pipeline

The application is configured to run on a Kubernetes cluster (specifically, the AET Rancher cluster) inside the `devpulse-prod` namespace.

### CI/CD Workflow Overview

We use GitHub Actions to automate the entire testing, building, and deployment process:

1. **Pull Requests & Non-Main Branches:** The pipeline runs automated unit/integration tests for the Spring Boot microservices, Python intelligence service, and React frontend.
2. **Main Branch:** Once merged into `main`, the pipeline:
   - Builds Docker images for all services.
   - Pushes them to the **GitHub Container Registry (GHCR)** tagged with the unique Git commit SHA.
   - Uses `kustomize` to update the Kubernetes manifests with the new image tags.
   - Deploys the updated manifests directly to the cluster.

### Prerequisites (GitHub Repository Secrets)

For the CD deployment pipeline to succeed, you must add the following **Repository Secrets** under **Settings > Secrets and variables > Actions** in GitHub:

- **`KUBE_CONFIG_DATA`**: The raw text content of your `kubeconfig` file (granting namespace-level access to the cluster).
- **`POSTGRES_USER`**, **`POSTGRES_PASSWORD`**, and **`POSTGRES_DB`**: Database credentials.
- **`RABBITMQ_USER`** and **`RABBITMQ_PASSWORD`**: Broker credentials.
- **`MONGODB_URI`**: URI to the MongoDB instance used by the alert service.
- **`GOOGLE_API_KEY`**: API key for GenAI analysis features.

_Note: The pipeline automatically Base64-encodes these values at runtime, so paste them as raw plain-text in GitHub._

### Local Verification & Deployment

If you have `kubectl` configured and connected to the cluster, you can perform tasks manually:

#### Apply Manifests

Deploy the entire stack with a single command from the project root:

```bash
kubectl apply -k infra/k8s/
```

#### Check Status

Verify that all pods, services, and workloads are running correctly:

```bash
kubectl get all -n devpulse-prod
```

#### Accessing the Application

- **Via URL:** [https://team-setops.stud.k8s.aet.cit.tum.de/](https://team-setops.stud.k8s.aet.cit.tum.de/) is routed through the shared student cluster's ingress-nginx controller.
- **Via Gateway NodePort:** The gateway service is exposed externally on a dynamically assigned port on every cluster node. To find the port, run:
  ```bash
  kubectl get service gateway -n devpulse-prod
  ```
  Look for the port mapped to `80:` under the `PORT(S)` column (e.g. `80:31234/TCP`). You can then access the app at `http://<node-ip-address>:<assigned-nodeport>`.
- **Via Local Port-Forwarding:** If you are behind a firewall or want to test locally:
  ```bash
  kubectl port-forward service/gateway 8080:80 -n devpulse-prod
  ```
  Then open [http://localhost:8080](http://localhost:8080) in your browser.

## Monitoring (Local)

Running `docker-compose up` also starts Prometheus and Grafana, both reachable through the gateway:

* **Grafana:** [http://localhost:8080/grafana/](http://localhost:8080/grafana/) — default login `admin` / `admin`. Dashboards and alerting rules are auto-provisioned.
* **Prometheus:** [http://localhost:8080/prometheus/](http://localhost:8080/prometheus/) — gated by HTTP basic auth (dev-only, not used in production/K8s). Default login is `admin` / `devpulse`; override via `PROMETHEUS_AUTH_USER`/`PROMETHEUS_AUTH_PASSWORD` in `infra/.env`. The credential file itself is generated at container startup, not committed.

*Note: the Azure VM sizing dashboard queries cAdvisor/kube-state-metrics, which the local Prometheus doesn't scrape — it stays empty locally by design and is meant to be imported into the shared cluster Grafana.*

## API Documentation (Swagger UI)

Interactive API documentation (Swagger UI) is automatically generated and accessible at runtime for each microservice. When running the services locally, you can view the API references at the following URLs:

- **Py-Intelligence (FastAPI):** [http://localhost:8001/docs](http://localhost:8001/docs)
- **Spring Ingestion:** `http://localhost:<PORT>/swagger-ui.html`
- **Spring Alerts:** `http://localhost:<PORT>/swagger-ui.html`
- **Spring Logbook:** `http://localhost:<PORT>/swagger-ui.html`

_(Note: Replace `<PORT>` with the respective mapped ports defined in your docker-compose or Spring application properties)._

## Team & Responsibilities

- Muhammed Emre Bayraktaroglu
   - GitHub username - memreo
   - TUMOnline - ge95jes
   - Matriculation number - 03753187
   - Primary subsystem owned - GenAI

- Sehmuel Wagner
   - GitHub username - sachmii
   - TUMOnline - ge84qiy
   - Matriculation number - 03772842
   - Primary subsystem owned - Client

- Taha Huzefa Hundekari
   - GitHub username - tahahundekari
   - TUMOnline - ge47mut
   - Matriculation number - 03757146
   - Primary subsystem owned - Server
