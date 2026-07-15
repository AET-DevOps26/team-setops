---
sidebar_position: 4
---

# Use Case Diagram

Actors: a **User** (DevOps/SRE engineer, on-call developer, or team lead — all interact through the same dashboard) and the **GenAI Intelligence Service**.

<img src="/img/diagrams/use_case_model.svg" alt="Use case diagram" style={{filter: 'invert(1)'}} />

## Manual troubleshooting after a failed deployment

1. A developer opens the DevPulse dashboard and sees a new failed deployment entry in the timeline.
2. The developer ingests the log in the client.
3. The backend stores the log/metadata.
4. The user requests AI analysis.
5. The backend fetches the stored log/metadata and sends it to the Intelligence Service with the requested task.
6. The Intelligence Service returns a short summary, suspected root cause candidates, and proposed next steps (plus similar past fixes if RAG is enabled).
7. The dashboard shows the insights side-by-side with the raw logs, enabling quick action and consistent handover notes.

## Resolving an issue

Once an incident is understood, the user marks it resolved, either as a quick status change or by submitting the actual fix as a new RAG document — feeding future analyses of similar issues.
