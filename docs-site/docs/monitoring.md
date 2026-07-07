---
sidebar_position: 7
---

# Monitoring

Prometheus and Grafana run both locally (docker-compose) and in the cluster (`infra/k8s/prometheus.yaml`, `infra/k8s/grafana.yaml`), with the same dashboards, alerting rules, and Telegram integration. In K8s, config is mounted from ConfigMaps instead of bind-mounted files.

## Local (docker-compose)

- **Grafana:** [http://localhost:8080/grafana/](http://localhost:8080/grafana/) — default login `admin` / `admin`. Dashboards and alerting rules are auto-provisioned.
- **Prometheus:** [http://localhost:8080/prometheus/](http://localhost:8080/prometheus/) — gated by HTTP basic auth. Default login is `admin` / `devpulse`; override via `PROMETHEUS_AUTH_USER`/`PROMETHEUS_AUTH_PASSWORD` in `infra/.env`. The credential file itself is generated at container startup, never committed.

## Kubernetes

- **Grafana:** [https://team-setops.stud.k8s.aet.cit.tum.de/grafana/](https://team-setops.stud.k8s.aet.cit.tum.de/grafana/)
- **Prometheus:** [https://team-setops.stud.k8s.aet.cit.tum.de/prometheus/](https://team-setops.stud.k8s.aet.cit.tum.de/prometheus/), same basic-auth gate, credentials come from the `PROMETHEUS_AUTH_USER`/`PROMETHEUS_AUTH_PASSWORD` GitHub Actions secrets via the `devpulse-secrets` K8s Secret.

_The Azure VM sizing dashboard estimates RAM from our own app-level metrics (JVM memory, py-intelligence resident memory), so it works in both local and in-cluster Grafana._
