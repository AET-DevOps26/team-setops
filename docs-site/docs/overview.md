---
sidebar_position: 1
---

# Overview

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
  - Docker Compose, Kubernetes/Kustomize manifests, Terraform, Ansible, Prometheus, and Grafana.

## Basic Flow

`client` sends requests to the Spring Boot backend services. The backend services manage logs, notes, alerts, and persistent storage. When AI analysis is needed, the backend calls `py-intelligence` through a defined JSON/HTTP interface. The OpenAPI file in `api/` is the shared API contract.
