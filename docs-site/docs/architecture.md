---
sidebar_position: 2
---

# Architecture

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
