# DevPulse — Requirements Gap Analysis (Updated)

> Compared against [project_details.md](file:///Users/semiwag/VSCode/uni/DevOps/team-setops/docs/project_details.md) and the full project grading criteria / tutor tips.
>
> ✅ = Done  &nbsp; ⚠️ = Partially done  &nbsp; ❌ = Missing
>
> *Last updated: 2026-07-02*

---

## 1. System Architecture

| # | Requirement | Status | Evidence / Notes |
|---|------------|--------|------------------|
| 1.1 | **Client (React/Angular/Vue)** | ✅ | React + Vite in [client/](file:///Users/semiwag/VSCode/uni/DevOps/team-setops/client) |
| 1.2 | **Responsive UI, REST communication** | ✅ | Components in [src/components/](file:///Users/semiwag/VSCode/uni/DevOps/team-setops/client/src/components), REST calls to gateway |
| 1.3 | **Server — Spring Boot** | ✅ | Three Spring Boot services: `spring-ingestion`, `spring-logbook`, `spring-alerts` |
| 1.4 | **≥ 3 microservices, distinct responsibilities** | ✅ | Ingestion (event entry point), Logbook (persistence/read), Alerts (rules engine/incidents) — well separated |
| 1.5 | **REST APIs + OpenAPI/Swagger** | ✅ | [openapi.yaml](file:///Users/semiwag/VSCode/uni/DevOps/team-setops/api/openapi.yaml) as source of truth, `springdoc-openapi` in all 3 services exposes Swagger UI |
| 1.6 | **Database — PostgreSQL via Docker** | ✅ | PostgreSQL 15 in [docker-compose.yml](file:///Users/semiwag/VSCode/uni/DevOps/team-setops/infra/docker-compose.yml), PV in K8s [postgres.yaml](file:///Users/semiwag/VSCode/uni/DevOps/team-setops/infra/k8s/postgres.yaml) |
| 1.7 | **Documented database schema** | ✅ | [database_schema.md](file:///Users/semiwag/VSCode/uni/DevOps/team-setops/docs/database_schema.md) documents both tables, ownership, and cross-service correlation design |

---

## 2. GenAI Component

| # | Requirement | Status | Evidence / Notes |
|---|------------|--------|------------------|
| 2.1 | **Python language** | ✅ | [py-intelligence/](file:///Users/semiwag/VSCode/uni/DevOps/team-setops/services/py-intelligence) — FastAPI app |
| 2.2 | **Containerised microservice** | ✅ | [Dockerfile](file:///Users/semiwag/VSCode/uni/DevOps/team-setops/services/py-intelligence/Dockerfile) present |
| 2.3 | **Real user-facing feature** | ✅ | Log analysis with structured output (problem type, severity, solutions) — accessible from the React dashboard |
| 2.4 | **Cloud model support (OpenAI API)** | ✅ | `GOOGLE_API_KEY` env var + cloud mode in code |
| 2.5 | **Local model support (GPT4All, LLaMA)** | ✅ | Uses `llama-cpp-python` with Qwen2.5-Coder-3B-Instruct GGUF model |
| 2.6 | **Bonus: RAG with Weaviate** | ⚠️ | RAG is implemented (MongoDB + custom embeddings), but **not using Weaviate** as recommended. Uses MongoDB as vector store instead. Still a valid RAG implementation but doesn't hit the exact bonus. |

---

## 3. Environment & Deployment

| # | Requirement | Status | Evidence / Notes |
|---|------------|--------|------------------|
| 3.1 | **All components have Dockerfiles** | ✅ | Dockerfiles for all 5 components (3 Spring + py-intelligence + client) |
| 3.2 | **docker-compose for local setup** | ✅ | [docker-compose.yml](file:///Users/semiwag/VSCode/uni/DevOps/team-setops/infra/docker-compose.yml) |
| 3.3 | **≤ 3 commands to start** | ✅ | `cd infra && docker-compose up --build` (2 commands, documented in README) |
| 3.4 | **Sane defaults / no reverse-engineering** | ✅ | Defaults provided; no hardcoded credentials remain in `docker-compose.yml`. |
| 3.5 | **Kubernetes — Helm or YAML** | ✅ | Full Kustomize-based manifests in [infra/k8s/](file:///Users/semiwag/VSCode/uni/DevOps/team-setops/infra/k8s) with Deployments, Services, Secrets template, Ingress, and readiness/liveness probes |
| 3.6 | **Environment: Rancher** | ✅ | Deployed to `devpulse-prod` namespace on AET Rancher cluster, accessible at [team-setops.stud.k8s.aet.cit.tum.de](https://team-setops.stud.k8s.aet.cit.tum.de/) |
| 3.7 | **Environment: Azure** | ✅ | Terraform IaC in [infra/terraform/](file:///Users/semiwag/VSCode/uni/DevOps/team-setops/infra/terraform) + Ansible in [infra/ansible/](file:///Users/semiwag/VSCode/uni/DevOps/team-setops/infra/ansible) + [deploy-azure.yml](file:///Users/semiwag/VSCode/uni/DevOps/team-setops/.github/workflows/deploy-azure.yml) workflow + production compose [docker-compose.prod.yml](file:///Users/semiwag/VSCode/uni/DevOps/team-setops/infra/docker-compose.prod.yml) |
| 3.8 | **Externalised config (secrets, env vars)** | ✅ | GitHub secrets used in CI (`${{ secrets.* }}`), and local `docker-compose.yml` uses externalized `${VAR:-default}` syntax consistently. |

---

## 4. CI/CD

| # | Requirement | Status | Evidence / Notes |
|---|------------|--------|------------------|
| 4.1 | **GitHub Actions** | ✅ | [ci-cd.yml](file:///Users/semiwag/VSCode/uni/DevOps/team-setops/.github/workflows/ci-cd.yml) + [deploy-azure.yml](file:///Users/semiwag/VSCode/uni/DevOps/team-setops/.github/workflows/deploy-azure.yml) |
| 4.2 | **CI — Build all services** | ✅ | Gradle build for Spring services, `npm run build` for client, Docker build for all images |
| 4.3 | **CI — Test all services** | ✅ | `pytest` for Python, Gradle `:app:test`, `npm run test` for client |
| 4.4 | **CI — Lint / static analysis** | ✅ | `black --check` + `flake8` for Python, `npm run lint` for client |
| 4.5 | **CD — Auto deploy to K8s on merge to main** | ✅ | `deploy` job in `ci-cd.yml` runs `kubectl apply -k infra/k8s/` after building and pushing images to GHCR, gated by `if: github.ref == 'refs/heads/main'` |
| 4.6 | **CD — Auto deploy to Azure on merge to main** | ✅ | `deploy-azure.yml` runs Terraform + Ansible on push to `main` |
| 4.7 | **Config — Secrets, no hardcoding** | ✅ | Secrets used correctly in CI/CD and K8s. Local docker-compose uses externalized variables consistently. |
| 4.8 | **Docker images tagged with commit SHA** | ✅ | `ghcr.io/$REPO/$IMAGE:${{ github.sha }}` in `ci-cd.yml` |

---

## 5. Observability

| # | Requirement | Status | Evidence / Notes |
|---|------------|--------|------------------|
| 5.1 | **Prometheus — metrics (requests, latency, errors)** | ❌ | **No Prometheus server configured.** No `prometheus.yml`. No Spring Boot Actuator or Micrometer dependency in any `build.gradle.kts`. No `/metrics` endpoints exposed. |
| 5.2 | **Grafana — dashboards (.json export required)** | ❌ | **No Grafana container.** No dashboard JSON files anywhere in the repo. |
| 5.3 | **Alerts — at least one meaningful alert** | ❌ | **No alerting rules defined.** No Alertmanager, no PrometheusRule, no Grafana alert provisioning. |

> [!CAUTION]
> **Observability is entirely missing.** This is a critical deliverable and is explicitly evaluated under "Runtime and Observability" in the grading rubric. The tutors' tips emphasise that dashboards "must be linked to system behaviour" and that just "installing monitoring" is not enough. You need:
> 1. Add `spring-boot-starter-actuator` + `micrometer-registry-prometheus` to all 3 Spring Boot services
> 2. Expose `/actuator/prometheus` endpoints
> 3. Add Prometheus container + `prometheus.yml` scrape config to docker-compose and K8s
> 4. Add Grafana container with provisioned dashboards showing request count, latency, error rate
> 5. Export at least one Grafana dashboard as `.json` and commit it to the repo
> 6. Configure at least one meaningful alert rule (e.g., service down, high error rate, slow response time)

---

## 6. Testing

| # | Requirement | Status | Evidence / Notes |
|---|------------|--------|------------------|
| 6.1 | **Server unit tests — critical logic** | ✅ | 12 test files across 3 Spring services: controllers, listeners, rules engine, strategies |
| 6.2 | **GenAI unit tests** | ✅ | 3 test files in [py-intelligence/tests/](file:///Users/semiwag/VSCode/uni/DevOps/team-setops/services/py-intelligence/tests) |
| 6.3 | **Client tests — core workflows** | ✅ | 6 test files covering App, IngestModal, InsightsPanel, LogList, PrivacyToggle, ResolveModal |
| 6.4 | **CI testing — all tests run in pipeline** | ✅ | All tests run automatically in `ci-cd.yml` |

---

## 7. Engineering Artefacts / Documentation

| # | Requirement | Status | Evidence / Notes |
|---|------------|--------|------------------|
| 7.1 | **UML: Subsystem Decomposition** | ✅ | [subsystem_diagram.md](file:///Users/semiwag/VSCode/uni/DevOps/team-setops/docs/subsystem_diagram.md) (mermaid) |
| 7.2 | **UML: Use Case Diagram** | ✅ | [use_case_model.svg](file:///Users/semiwag/VSCode/uni/DevOps/team-setops/docs/use_case_model.svg) |
| 7.3 | **UML: Analysis Object Model** | ⚠️ | Per-service class diagrams exist ([spring-alerts-class-diagram.svg](file:///Users/semiwag/VSCode/uni/DevOps/team-setops/docs/spring-alerts-class-diagram.svg), etc.) but no unified analysis object model showing cross-service domain entities and relationships. |
| 7.4 | **Architecture — high-level description** | ✅ | [README.md](file:///Users/semiwag/VSCode/uni/DevOps/team-setops/README.md) + [system_overview.md](file:///Users/semiwag/VSCode/uni/DevOps/team-setops/docs/system_overview.md) + [api_gateway.md](file:///Users/semiwag/VSCode/uni/DevOps/team-setops/docs/api_gateway.md) |
| 7.5 | **API docs — OpenAPI/Swagger UI** | ✅ | [openapi.yaml](file:///Users/semiwag/VSCode/uni/DevOps/team-setops/api/openapi.yaml) + `springdoc-openapi` in all services |
| 7.6 | **README with setup, architecture, API, CI/CD, monitoring, responsibilities** | ⚠️ | README is comprehensive but **missing: student responsibilities section** (who owns what subsystem) and **monitoring instructions** (because monitoring is not yet implemented). |
| 7.7 | **Documented DB schema** | ✅ | [database_schema.md](file:///Users/semiwag/VSCode/uni/DevOps/team-setops/docs/database_schema.md) |

---

## 8. Development Workflow

| # | Requirement | Status | Evidence / Notes |
|---|------------|--------|------------------|
| 8.1 | **Mono-repo** | ✅ | Single GitHub repository with all components |
| 8.2 | **Feature branches** | ✅ | Branch naming convention documented in README |
| 8.3 | **Pull requests mandatory** | ✅ | [PR template](file:///Users/semiwag/VSCode/uni/DevOps/team-setops/.github/pull_request_template.md) exists |
| 8.4 | **Code review / peer approval** | ⚠️ | PR template exists, but **unclear if branch protection rules enforce required reviews** before merging to `main`. |
| 8.5 | **CI checks on every PR** | ✅ | CI triggers on `pull_request` to `main` |
| 8.6 | **Auto deploy on merge to main** | ✅ | `deploy` job in `ci-cd.yml` (Rancher) + `deploy-azure.yml` (Azure) |

---

## 9. Tutor Best Practices Checklist

These are recommendations from the tutor tips that are not strict requirements but affect grading quality.

| # | Recommendation | Status | Notes |
|---|---------------|--------|-------|
| 9.1 | **API-first with code generation** | ✅ | `gen-all.sh` script exists, `openapi-sync-check` job validates generated clients |
| 9.2 | **Docker image tagging with commit SHA** | ✅ | Images tagged with `${{ github.sha }}` |
| 9.3 | **Unified error schema across APIs** | ⚠️ | Not verified — `openapi.yaml` should define a consistent `{code, message, details}` error schema across all endpoints |
| 9.4 | **Pre-commit hooks** | ❌ | No `.pre-commit-config.yaml` found. Tutors recommend using pre-commit to lint OpenAPI spec automatically. |
| 9.5 | **devcontainer.json** | ❌ | No dev container configuration. Recommended by tutors for zero-setup development. |
| 9.6 | **Spring Boot Actuator + Prometheus** | ❌ | No actuator or micrometer dependencies in any `build.gradle.kts` |
| 9.7 | **Consistent label-based K8s discovery** | ⚠️ | K8s manifests use `app.kubernetes.io/part-of: devpulse` labels but no `monitoring: "true"` labels for Prometheus discovery |
| 9.8 | **Application version metric** | ❌ | No custom version metric exposed |
| 9.9 | **Persistent Volumes for monitoring** | ❌ | N/A — monitoring not yet deployed |
| 9.10 | **Deployed instance accessible via URL** | ✅ | Rancher: [team-setops.stud.k8s.aet.cit.tum.de](https://team-setops.stud.k8s.aet.cit.tum.de/), Azure: `team-setops-devpulse.polandcentral.cloudapp.azure.com` |

---

## Summary: What's Missing

### 🔴 Critical (Major deliverables, graded heavily)

| Item | Effort | Details |
|------|--------|---------|
| **Prometheus + Grafana stack** | Medium | Add Actuator + Micrometer deps, Prometheus container, Grafana container, wire scrape configs. Must cover request count, latency, and error rate. |
| **Grafana dashboard .json export** | Low | Export after creating dashboards, commit to repo. |
| **At least 1 meaningful alert rule** | Low | Define in Prometheus alerting rules or Grafana alerts (e.g. service down, high error rate). |
| **README: monitoring instructions** | Low | Add section once monitoring is implemented. |

### 🟡 Important (Explicitly required, smaller scope)

| Item | Effort | Details |
|------|--------|---------|
| **Hardcoded credentials in docker-compose** | Low | Resolved in PR #111. `docker-compose.yml` uses externalised variables consistently. |
| **README: student responsibilities** | Low | Add a section listing which team member owns which subsystem (client, server, GenAI). Required in deliverables. |
| **Branch protection / required reviews** | Low | Enable in GitHub repo settings to enforce peer review before merge. |
| **Unified Analysis Object Model** | Low | Consolidate per-service class diagrams into one cross-service domain model. |

### 🟢 Nice-to-have (Bonus / polish)

| Item | Effort | Details |
|------|--------|---------|
| **Weaviate for RAG** | Medium | Current MongoDB-based RAG works, but Weaviate was explicitly named for the bonus. |
| **Pre-commit hooks** | Low | Add `.pre-commit-config.yaml` with OpenAPI linting. |
| **devcontainer.json** | Low | Enable zero-setup dev environment. |
| **Application version metric** | Low | Expose deployed version as a Prometheus metric for dashboard correlation. |
| **Unified error schema** | Low | Ensure all API error responses follow `{code, message, details}` format. |
