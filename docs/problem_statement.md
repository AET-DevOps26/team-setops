# 📝 Problem Statement

⚠️ **Deadline for submission:** 08.05.2026  
❗️ Please complete this document carefully. It will help you structure your ideas early and plan your development efficiently. ❗️

---

## 1. Problem Statement

Modern DevOps teams deal with a constant stream of information during deployments and incidents: CI/CD job output, application logs, Kubernetes events, monitoring alerts, and ad-hoc troubleshooting notes. When something fails, the relevant context is often fragmented across tools and channels (CI, Slack, ticketing, dashboards), and the team loses time reconstructing “what happened” before they can even start fixing the issue.

**DevPulse** addresses this by acting as an **AI-powered DevOps logbook**: a single place to ingest and persist deployment/incident signals, mainly errors or incidents during deployments, and to generate **actionable AI insights** (summaries, suspected root causes, and next steps). The goal is to shorten mean time to understanding (MTTU) and support consistent incident handovers by combining raw evidence with structured, searchable, team-owned knowledge.

### Include:

- **Main functionality**
  - Collect and persist **deployment logs, system alerts, and troubleshooting notes** in one timeline.
  - Provide a dashboard to glance over the incidents and related artifacts.
  - Enable one-click **AI analysis** for a selected log/incident:
    - Summarize logs into a status update.
    - Extract suspected root causes and “what to try next”.
    - Optionally retrieve similar past fixes (RAG) as “organizational memory”.
  - Support **user-defined AI execution**: switch between cloud inference and local inference, to reduce the latency (network-induced delays), cost of operations (API costs) and the exposure of sensitive data to external providers.

- **Target users**
  - **DevOps / SRE / Platform engineers** operating CI/CD pipelines and production infrastructure.
  - **Software engineers** on-call or responsible for incidents and fixes.
  - **Team leads** needing an overview of recurring deployment issues and operational risks.
  - Key pain points DevPulse targets:
    - Slow context gathering after a failure (“where is the relevant log?”).
    - High noise in logs/alerts; complex exception chains and stack traces.
    - Knowledge loss between incidents; fixes live in chat history, not in a reusable form.
    - Sensitive data concerns or operational costs that limit using cloud-based AI.

- **GenAI Integration**
  - DevPulse integrates GenAI via a dedicated **Python FastAPI microservice** (“Intelligence Service”) that receives log/alert content from the backend and returns structured insights.
  - User-facing AI features:
    - **Log summarization**: turn verbose logs, stack traces and alerts into short incident summaries.
    - **Troubleshooting assistant**: propose likely root causes and steps to resolve the issue.
    - **Provider strategy (privacy toggle)**: route requests to cloud models (still in progress) or local models (using a small and efficient model) based on a user/team setting.
    - **Optional RAG**: retrieve and contexualize with team-specific past fixes (e.g., runbooks, previous incident notes) to accelerate problem resolution.

- **Usage Scenarios**
  - Scenario A: Manual troubleshooting after a failed deployment
    1. A developer opens the DevPulse dashboard and sees a new failed deployment entry in the timeline.
    2. The developer ingests the log in frontend
    3. The backend stores the log/metadata
    4. The user requests AI analysis.
    5. The backend fetches the stored log/metadata and sends it to the **Intelligence Service** with the requested task.
    6. The Intelligence Service returns:
       - a short summary,
       - suspected root cause candidates,
       - proposed next steps (and optional similar past fixes if RAG is enabled).
    7. The dashboard shows the insights side-by-side with the raw logs, enabling quick action and consistent handover notes.

  - Scenario B: Automated incident capture from CI/CD or runtime systems
    1. A CI job, Kubernetes component, or monitoring integration posts failures to DevPulse using API endpoints.
    2. DevPulse persists the event, associates it with a context (job id, pipeline id, etc.), and updates the timeline in the dashboard.
    3. Users can trigger AI analysis for the incidents from the dashboard, which will provide a summary and troubleshooting steps.

---

## 📅 Important Notes

- This document **must be stored in your team’s GitHub repository**
- It should be **maintained and updated** as your project evolves
