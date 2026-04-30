# Project Specification

## Objective

The project requires teams to design, implement, and operate a complete software system that reflects a realistic DevOps workflow. The goal is to demonstrate how a system is structured, integrated, deployed, and maintained in a reproducible and observable way. Development, deployment, and operation must therefore be treated as a single engineering problem rather than as separate phases.

At the technical level, the project must result in a web application that includes:

- Client side
- Server side
- Persistent storage
- Separate Generative AI component

The system must be:

- Containerised
- Runnable locally
- Automatically tested and deployed via GitHub Actions
- Deployable to Kubernetes
- Observable via Prometheus and Grafana

The application domain is flexible, but all technical and process requirements must be satisfied.

**Deadline:** To be announced (EOD – 23:59 Munich time)

### Overview

| Aspect                   | Requirement                                                    |
| ------------------------ | -------------------------------------------------------------- |
| Project type             | Complete DevOps-oriented software system                       |
| Main focus               | Integrated development, deployment, operation, observability   |
| Required system elements | Client, server, database, GenAI, CI/CD, Kubernetes, monitoring |
| Application domain       | Flexible, all technical requirements mandatory                 |

---

## Team Organisation

- Teams consist of **3 students**
- Each student owns a **primary subsystem** (client, server, GenAI)
- Collaboration across subsystems is required

### Requirements

| Aspect                | Requirement                                            |
| --------------------- | ------------------------------------------------------ |
| Team size             | 3 students                                             |
| Registration          | GitHub username, TUMonline login, matriculation number |
| Ownership             | One primary subsystem per student                      |
| Collaboration         | Cross-subsystem collaboration required                 |
| Contribution tracking | Commits, PRs, reviews, infrastructure work             |
| Communication         | Only official Artemis channels                         |

---

## Development Workflow

- Use a **GitHub mono-repository**
- All work via **feature branches + pull requests**
- No direct commits to `main`

### Process

1. Create feature branch
2. Implement changes
3. Run CI checks
4. Open PR
5. Peer review
6. Merge to `main`
7. Automatic deployment

### Requirements

| Aspect        | Requirement          |
| ------------- | -------------------- |
| Repository    | Mono-repo            |
| Branching     | Feature branches     |
| Pull Requests | Mandatory            |
| Code review   | Required             |
| CI checks     | On every PR          |
| CD            | Auto deploy on merge |

---

## System Architecture

### Components

- Client (UI)
- Server (REST APIs)
- Database (persistent storage)
- GenAI Service (separate microservice)

### Requirements

| Component | Technology            | Notes                             |
| --------- | --------------------- | --------------------------------- |
| Client    | React / Angular / Vue | Responsive UI, REST communication |
| Server    | Spring Boot           | ≥ 3 microservices, REST APIs      |
| Database  | MySQL / PostgreSQL    | Docker-based, documented schema   |

---

## GenAI Component

- Implemented in **Python**
- Runs as independent microservice
- Connected via defined API

### Requirements

| Aspect        | Requirement                                 |
| ------------- | ------------------------------------------- |
| Language      | Python                                      |
| Deployment    | Containerised microservice                  |
| Functionality | Real user-facing feature                    |
| Model support | Cloud (OpenAI API) + local (GPT4All, LLaMA) |
| Bonus         | RAG with Weaviate                           |

---

## Environment & Deployment

- Full **Docker-based setup**
- Must run locally via `docker-compose`
- Max **3 commands to start system**

### Requirements

| Aspect           | Requirement                     |
| ---------------- | ------------------------------- |
| Containerisation | All components have Dockerfiles |
| Local setup      | docker-compose                  |
| Setup simplicity | ≤ 3 commands                    |
| Kubernetes       | Helm or YAML                    |
| Environments     | Rancher + Azure                 |

---

## CI/CD

- Implemented using **GitHub Actions**

### Requirements

| Aspect | Requirement                |
| ------ | -------------------------- |
| CI     | Build, test, lint          |
| CD     | Auto deploy to Kubernetes  |
| Config | Use secrets, no hardcoding |

---

## Observability

- Use **Prometheus + Grafana**

### Requirements

| Tool       | Requirement                        |
| ---------- | ---------------------------------- |
| Prometheus | Metrics: requests, latency, errors |
| Grafana    | Dashboards (.json export required) |
| Alerts     | At least one meaningful alert      |

---

## Testing

### Requirements

| Aspect       | Requirement    |
| ------------ | -------------- |
| Unit Tests   | Server + GenAI |
| Client Tests | Core workflows |
| CI Testing   | Mandatory      |

---

## Engineering Artefacts

- UML diagrams required:
  - Subsystem Decomposition
  - Use Case Diagram
  - Analysis Object Model

### Requirements

| Aspect       | Requirement            |
| ------------ | ---------------------- |
| Architecture | High-level description |
| Diagrams     | UML required           |
| API docs     | OpenAPI / Swagger      |

---

## Deliverables

| Deliverable   | Description           |
| ------------- | --------------------- |
| Source Code   | Client, server, GenAI |
| Docker Setup  | Dockerfiles + compose |
| Kubernetes    | Helm/YAML             |
| Monitoring    | Prometheus + Grafana  |
| Testing       | Test suite            |
| Documentation | README.md             |

---

## Common Pitfalls

### Key Principles

- **Reliability > Features**
- **System = pipeline**  
  `code → test → build → deploy → observe → improve`
- **Reproducibility matters**
- **Monitoring must be meaningful**

### Frequent Failures

- Treating project as checklist
- Late integration
- Weak CI/CD
- GenAI as decoration
- Delayed documentation

---

## Team Culture

### Guidelines

- Communicate early
- Define clear responsibilities
- Use strengths within the team
- Support each other

### Recommended Tools

- RACI Matrix: https://www.atlassian.com/work-management/project-management/raci-chart

---

## Documentation Best Practice

- Document **while coding**
- Keep setup reproducible
- Ensure system is runnable by others

Reference:
https://www.aleksandrhovhannisyan.com/blog/writing-better-documentation/
