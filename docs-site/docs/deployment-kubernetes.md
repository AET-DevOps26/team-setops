---
sidebar_position: 5
---

# Kubernetes Deployment & CI/CD

The application is configured to run on a Kubernetes cluster (specifically, the AET Rancher cluster) inside the `devpulse-prod` namespace.

## CI/CD Workflow Overview

We use GitHub Actions to automate the entire testing, building, and deployment process:

1. **Pull Requests & Non-Main Branches:** The pipeline runs automated unit/integration tests for the Spring Boot microservices, Python intelligence service, and React frontend.
2. **Main Branch:** Once merged into `main`, the pipeline:
   - Builds Docker images for all services.
   - Pushes them to the **GitHub Container Registry (GHCR)** tagged with the unique Git commit SHA.
   - Uses `kustomize` to update the Kubernetes manifests with the new image tags.
   - Deploys the updated manifests directly to the cluster.

## Prerequisites (GitHub Repository Secrets)

For the CD deployment pipeline to succeed, you must add the following **Repository Secrets** under **Settings > Secrets and variables > Actions** in GitHub:

- **`KUBE_CONFIG_DATA`**: The raw text content of your `kubeconfig` file (granting namespace-level access to the cluster).
- **`POSTGRES_USER`**, **`POSTGRES_PASSWORD`**, and **`POSTGRES_URL`**: Database credentials.
- **`RABBITMQ_USER`**, **`RABBITMQ_PASSWORD`**, **`RABBITMQ_HOST`**, and **`RABBITMQ_PORT`**: Broker credentials.
- **`MONGODB_URI`**: URI to the MongoDB instance used by the alert service.
- **`GOOGLE_API_KEY`**: API key for GenAI analysis features.
- **`OPENAI_API_KEY`** and **`OPENAI_BASE_URL`**: Fallback GenAI provider, used when Gemini is unavailable.
- **`TELEGRAM_BOT_TOKEN`** and **`TELEGRAM_CHAT_ID`**: Destination for Grafana alerting notifications.
- **`PROMETHEUS_AUTH_USER`** and **`PROMETHEUS_AUTH_PASSWORD`**: Basic-auth credentials gating the `/prometheus` route on the gateway.

_The pipeline automatically Base64-encodes these values at runtime, so paste them as raw plain-text in GitHub._

## Local Verification & Deployment

If you have `kubectl` configured and connected to the cluster, you can perform tasks manually.

### Apply Manifests

Deploy the entire stack with a single command from the project root. This uses the standalone `kustomize` CLI (not `kubectl apply -k`, which doesn't support `--load-restrictor`) because the Prometheus/Grafana ConfigMaps are generated from files outside `infra/k8s/` on purpose. See `infra/k8s/kustomization.yaml`:

```bash
kustomize build infra/k8s/ --load-restrictor LoadRestrictionsNone | kubectl apply -f -
```

### Check Status

Verify that all pods, services, and workloads are running correctly:

```bash
kubectl get all -n devpulse-prod
```

### Accessing the Application

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
