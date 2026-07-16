<div align="center">
  <img src="docs/images/devpulse-logo.svg" alt="DevPulse" height="60" />
  <p><sub><b>INTELLIGENT LOGBOOK // SYSTEM_ONLINE</b></sub></p>
  <h3>Team SETOps</h3>

  <p>
    <a href="https://github.com/AET-DevOps26/team-setops/actions/workflows/ci-cd.yml">
      <img src="https://github.com/AET-DevOps26/team-setops/actions/workflows/ci-cd.yml/badge.svg?branch=main" alt="CI/CD Pipeline Status" />
    </a>
    <a href="https://github.com/AET-DevOps26/team-setops/issues">
      <img src="https://img.shields.io/github/issues/AET-DevOps26/team-setops?style=flat-square&color=blue" alt="GitHub Issues" />
    </a>
    <a href="https://github.com/AET-DevOps26/team-setops/pulls">
      <img src="https://img.shields.io/github/issues-pr/AET-DevOps26/team-setops?style=flat-square&color=orange" alt="GitHub Pull Requests" />
    </a>
    <a href="https://github.com/AET-DevOps26/team-setops/graphs/contributors">
      <img src="https://img.shields.io/github/contributors/AET-DevOps26/team-setops?style=flat-square&color=green" alt="GitHub Contributors" />
    </a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/Spring_Boot-6DB33F?style=flat-square&logo=spring-boot&logoColor=white" alt="Spring Boot" />
    <img src="https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white" alt="Python" />
    <img src="https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker" />
    <img src="https://img.shields.io/badge/Kubernetes-326CE5?style=flat-square&logo=kubernetes&logoColor=white" alt="Kubernetes" />
    <img src="https://img.shields.io/badge/PostgreSQL-316192?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL" />
    <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=flat-square&logo=mongodb&logoColor=white" alt="MongoDB" />
    <img src="https://img.shields.io/badge/RabbitMQ-FF6600?style=flat-square&logo=rabbitmq&logoColor=white" alt="RabbitMQ" />
  </p>
</div>

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
  - Place for Docker Compose, Kubernetes or Helm files, Terraform, Ansible, database setup, Prometheus, and Grafana.

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
├── infra/
│   ├── docker-compose.yml      # Local development (builds from source)
│   ├── docker-compose.prod.yml # Production (pulls GHCR images)
│   ├── k8s/                    # Kubernetes/Kustomize manifests (Rancher)
│   ├── terraform/              # IaC – Azure VM provisioning
│   ├── ansible/                # Configuration management – VM setup & app deploy
│   └── nginx/                  # Nginx gateway configuration
└── .github/workflows/
    ├── ci-cd.yml               # CI tests + Rancher K8s deployment
    └── deploy-azure.yml        # Azure VM deployment (Terraform + Ansible)
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

### 🔒 Pre-commit Hooks

This repository uses [pre-commit](https://pre-commit.com/) to run automated checks (linting, formatting, YAML validation, etc.) before every commit. Set it up once after cloning:

```bash
pip install pre-commit
pre-commit install
```

After this, hooks run automatically on `git commit`. To run all hooks against the entire codebase manually:

```bash
pre-commit run --all-files
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
- **`POSTGRES_USER`**, **`POSTGRES_PASSWORD`**, and **`POSTGRES_URL`**: Database credentials.
- **`RABBITMQ_USER`**, **`RABBITMQ_PASSWORD`**, **`RABBITMQ_HOST`**, and **`RABBITMQ_PORT`**: Broker credentials.
- **`MONGODB_URI`**: URI to the MongoDB instance used by the alert service.
- **`GOOGLE_API_KEY`**: API key for GenAI analysis features.
- **`OPENAI_API_KEY`** and **`OPENAI_BASE_URL`**: Fallback GenAI provider, used when Gemini is unavailable.
- **`TELEGRAM_BOT_TOKEN`** and **`TELEGRAM_CHAT_ID`**: Destination for Grafana alerting notifications.
- **`PROMETHEUS_AUTH_USER`** and **`PROMETHEUS_AUTH_PASSWORD`**: Basic-auth credentials gating the `/prometheus` route on the gateway.

_Note: The pipeline automatically Base64-encodes these values at runtime, so paste them as raw plain-text in GitHub._

### Local Verification & Deployment

If you have `kubectl` configured and connected to the cluster, you can perform tasks manually:

#### Apply Manifests

Deploy the entire stack with a single command from the project root. Note this uses the standalone `kustomize` CLI (not `kubectl apply -k`, which doesn't support `--load-restrictor`) because the Prometheus/Grafana ConfigMaps are generated from files outside `infra/k8s/` on purpose. See `infra/k8s/kustomization.yaml`:

```bash
kustomize build infra/k8s/ --load-restrictor LoadRestrictionsNone | kubectl apply -f -
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

---

## ☁️ Azure Deployment (Terraform + Ansible)

In addition to the Rancher Kubernetes cluster, the application is also deployable to **Microsoft Azure** using **Terraform** (Infrastructure as Code) and **Ansible** (Configuration Management). This provides a second, independent deployment environment.

### How It Works

1. **Terraform** (`infra/terraform/`) provisions the Azure infrastructure:
   - A Resource Group, Virtual Network, Subnet, and Public IP in the `polandcentral` region.
   - A Network Security Group allowing SSH (port 22), HTTP (port 80), and HTTPS (port 443).
   - An Ubuntu 24.04 LTS Virtual Machine (`Standard_DS2_v3`).
   - After provisioning, Terraform automatically generates the Ansible inventory file with the VM's public IP.

2. **Ansible** (`infra/ansible/`) configures the VM:
   - Installs Docker and Docker Compose from official repositories.
   - Copies the production `docker-compose.prod.yml` and Nginx configuration to the VM.
   - Starts the full application stack using the pre-built GHCR Docker images.

3. **GitHub Actions** (`deploy-azure.yml`) orchestrates this end-to-end on every push to `main`.

### Prerequisites (Additional GitHub Repository Secrets)

The Azure deployment pipeline requires the following **additional** secrets:

| Secret                | Description                                     |
| :-------------------- | :---------------------------------------------- |
| `ARM_CLIENT_ID`       | Azure Service Principal `appId`                 |
| `ARM_CLIENT_SECRET`   | Azure Service Principal `password`              |
| `ARM_SUBSCRIPTION_ID` | Azure Subscription ID                           |
| `ARM_TENANT_ID`       | Azure Active Directory `tenant` ID              |
| `SSH_PRIVATE_KEY`     | Private SSH key for Ansible to access the VM    |
| `SSH_PUBLIC_KEY`      | Public SSH key injected into the VM at creation |

To create the Service Principal, run locally:

```bash
az ad sp create-for-rbac --name "github-actions-team-setops" --role contributor --scopes /subscriptions/<YOUR_SUBSCRIPTION_ID>
```

### Manual Deployment

To deploy to Azure manually from your local machine (requires Azure CLI and Ansible):

```bash
# 1. Provision the VM
cd infra/terraform
terraform init
terraform apply -auto-approve

# 2. Configure and deploy the application
cd ../ansible
ansible-playbook playbook.yml
```

### Accessing the Application on Azure

Once deployed, the application is accessible via a nice, fully qualified domain name (FQDN). You can find the exact URL from the Terraform output:

```bash
cd infra/terraform
terraform output vm_fqdn
```

Then open `http://<vm_fqdn>` in your browser. (The raw IP is also available via `terraform output vm_public_ip`).

---

## Monitoring

Prometheus and Grafana run both locally (docker-compose) and in the cluster (`infra/k8s/prometheus.yaml`, `infra/k8s/grafana.yaml`), with the same dashboards, alerting rules, and Telegram integration. In K8s, config is mounted from ConfigMaps instead of bind-mounted files.

**Local (docker-compose):**
* **Grafana:** [http://localhost:8080/grafana/](http://localhost:8080/grafana/) — default login `admin` / `admin`. Dashboards and alerting rules are auto-provisioned.
* **Prometheus:** [http://localhost:8080/prometheus/](http://localhost:8080/prometheus/) — gated by HTTP basic auth. Default login is `admin` / `devpulse`; override via `PROMETHEUS_AUTH_USER`/`PROMETHEUS_AUTH_PASSWORD` in `infra/.env`. The credential file itself is generated at container startup, never committed.

**Kubernetes:**
* **Grafana:** [https://team-setops.stud.k8s.aet.cit.tum.de/grafana/](https://team-setops.stud.k8s.aet.cit.tum.de/grafana/)
* **Prometheus:** [https://team-setops.stud.k8s.aet.cit.tum.de/prometheus/](https://team-setops.stud.k8s.aet.cit.tum.de/prometheus/), same basic-auth gate, credentials come from the `PROMETHEUS_AUTH_USER`/`PROMETHEUS_AUTH_PASSWORD` GitHub Actions secrets via the `devpulse-secrets` K8s Secret.

*Note: the Azure VM sizing dashboard estimates RAM from our own app-level metrics (JVM memory, py-intelligence resident memory), so it works in both local and in-cluster Grafana.*

## API Documentation (Swagger UI)

Interactive API documentation (Swagger UI) is automatically generated and accessible at runtime for each microservice. When running the services locally via `docker-compose`, you can view the API references at the following URLs:

- **Py-Intelligence (FastAPI):** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Spring Ingestion:** [http://localhost:8081/swagger-ui.html](http://localhost:8081/swagger-ui.html)
- **Spring Logbook:** [http://localhost:8082/swagger-ui.html](http://localhost:8082/swagger-ui.html)
- **Spring Alerts:** [http://localhost:8083/swagger-ui.html](http://localhost:8083/swagger-ui.html)


## Team & Responsibilities

- Muhammed Emre Bayraktaroglu
   - GitHub username - memreo
   - TUMOnline - ge95jes
   - Primary subsystem owned - GenAI

- Sehmuel Wagner
   - GitHub username - sachmii
   - TUMOnline - ge84qiy
   - Primary subsystem owned - Client

- Taha Huzefa Hundekari
   - GitHub username - tahahundekari
   - TUMOnline - ge47mut
   - Primary subsystem owned - Server
