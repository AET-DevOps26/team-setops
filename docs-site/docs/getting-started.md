---
sidebar_position: 9
---

# Getting Started

## Prerequisites

To run this project locally, you must have the following installed:

- [Docker](https://docs.docker.com/get-docker/) (Docker Desktop recommended for Mac/Windows)
- [Docker Compose](https://docs.docker.com/compose/install/)

_(Note: You do not need Java, Python, or Node.js installed on your host machine to run the application via Docker Compose — everything runs inside the containers. You do need Python (for pre-commit) and Node.js (for the client's own lint/test/build) for the workflows further down this page.)_

## Build

```bash
cd infra
docker-compose up --build
```

## Pre-commit Hooks

This repository uses [pre-commit](https://pre-commit.com/) to run automated checks (linting, formatting, YAML validation, etc.) before every commit. Set it up once after cloning:

```bash
pip install pre-commit
pre-commit install
```

After this, hooks run automatically on `git commit`. To run all hooks against the entire codebase manually:

```bash
pre-commit run --all-files
```

## Local Build and Test Commands per Component

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
# Spring services — cd into each service directory first, e.g.:
cd services/spring-alerts && ./gradlew :app:test

# Client
cd client && npm run test -- --run
```
