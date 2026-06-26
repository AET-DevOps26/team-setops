# 🏗️ Initial System Structure & Backlog

❗️ Please complete this document carefully. It will help you structure your ideas early and plan your development efficiently. ❗️

---

## 1. Initial System Structure

Describe how you plan to divide the system technically.

---

### Required Components

- **Server**
  - Spring Boot REST API
  - Handles business logic and communication with other services

- **Client**
  - React / Angular / Vue.js client
  - Provides user interface and interacts with backend via REST

- **GenAI Service**
  - Python-based microservice (e.g., using LangChain)
  - Provides AI-powered functionality via defined API

- **Database**
  - Example: PostgreSQL, MongoDB
  - Handles persistent data storage

---

## 📊 UML Diagrams

You must include the following diagrams:

### 1. Analysis Object Model

- UML **class diagram**
- Shows core entities and relationships

### 2. Use Case Diagram

- Shows **actors** and **system interactions**
- Focus on user goals and system behavior

### 3. Top-Level Architecture

- UML **component diagram**
- Visualizes system structure and service interactions

💡 You can use tools like **Apollon** to create these diagrams.

---

## 2. First Product Backlog

Prepare an initial backlog as a Markdown table or GitHub Project.

### Example Structure

| ID  | Title               | Description                     | Priority | Assignee |
| --- | ------------------- | ------------------------------- | -------- | -------- |
| 1   | User Authentication | Implement login & registration  | High     |          |
| 2   | API Setup           | Create base Spring Boot project | High     |          |
| 3   | GenAI Endpoint      | Add summarization endpoint      | Medium   |          |
| 4   | UI Layout           | Create main client layout     | Medium   |          |

- Each item should represent a **feature or task**
- Keep descriptions **clear and concise**
- Update backlog continuously as the project evolves

---

# 🏛️ Spring Microservices Architecture

The core backend of DevPulse is composed of three decoupled Spring Boot microservices: `spring-ingestion`, `spring-logbook`, and `spring-alerts`. These services follow an **event-driven architecture**, utilizing RabbitMQ for asynchronous communication and PostgreSQL for independent data persistence. 

Data correlation across these isolated services is achieved via a shared, globally unique `logId` (UUID) generated at the point of entry.

---

## 1. Spring Ingestion (`spring-ingestion`)

**Primary Responsibility:** Acts as the synchronous "front door" for all incoming telemetry, logs, and system events. It validates the incoming payloads, assigns a correlation ID, and delegates the processing to the message broker.

**Internal Structure & Flow:**
* **`LogController`**: Exposes the `POST /api/v1/logs` REST endpoint. It immediately returns a `202 Accepted` status to the client, ensuring the API Gateway and Client are not blocked by downstream database writes or complex rule evaluations.
* **`EventPublisherService`**: Takes the validated `IncomingLogEventDto`, generates a unique `UUID` for the event, and publishes it to the `devpulse.exchange` RabbitMQ exchange using specific routing keys (e.g., `log.deployment.received`).

**Design Choice:** By offloading the actual processing to RabbitMQ, the ingestion service remains highly available and can absorb massive spikes in log traffic without overwhelming the database.

---

## 2. Spring Logbook (`spring-logbook`)

**Primary Responsibility:** Manages the persistent, historical timeline of all system events. It acts as the system of record for raw logs.

**Internal Structure & Flow:**
* **`LogListener`**: An AMQP consumer that listens to the `devpulse.logs.deployment.queue`. When a message arrives, it maps the payload to the internal domain model.
* **`LogService` & `LogRepository`**: Handles the business logic and database transactions. It uses Spring Data JPA to save the `Log` entity into the `system_logs` PostgreSQL table.
* **`LogController`**: Exposes read-only REST endpoints (`GET /api/v1/logs` and `/search`) for the React frontend to fetch the chronological deployment history. 

**Design Choice:** The `spring-logbook` is entirely unaware of alerts or incidents. Its sole focus is fast, reliable insertion of logs and serving query requests for the UI timeline.

---

## 3. Spring Alerts (`spring-alerts`)

**Primary Responsibility:** Processes incoming events in near real-time against a set of rules to detect anomalies, threshold breaches, or severe errors, and tracks the lifecycle of the resulting incidents.

**Internal Structure & Flow:**
* **`SystemAlertListener`**: An AMQP consumer listening to the `devpulse.alerts.system.queue`. It acts as the trigger point for the rules engine.
* **`RulesEngineService` (Strategy Pattern)**: 
  * The core intelligence of the service. It iterates over a collection of `AlertStrategy` implementations (e.g., `MetricThresholdStrategy` for CPU/Memory spikes, `SeverityStrategy` for fatal application errors).
  * If any strategy flags the log as actionable, the engine generates an `IncidentStatus` entity.
* **`IncidentStatusRepository`**: Saves the incident to the `incident_status` PostgreSQL table, defaulting to an `ACTIVE` state. The primary key matches the incoming event's UUID.
* **`IncidentController`**: Exposes `GET` endpoints to list active incidents and `PATCH /api/v1/incidents/{logId}/status` endpoints for developers to acknowledge or resolve incidents from the UI.

**Design Choice:** Utilizing the **Strategy Pattern** for the rules engine allows new alert conditions (e.g., "Network Timeout Strategy" or "Security Breach Strategy") to be added in the future without modifying the core `RulesEngineService` logic, adhering perfectly to the Open/Closed Principle.

---

## 🔗 Cross-Service Data Correlation

While `spring-logbook` and `spring-alerts` share the same physical PostgreSQL database instance (`appdb`), they do not share tables or enforce hard Foreign Key constraints. 

If a developer wants to view the raw log details of an `ACTIVE` incident, the React Client reads the `logId` from the `incident_status` table (via `spring-alerts`) and subsequently queries the `system_logs` table (via `spring-logbook`) using that same `logId`. This keeps the microservices completely domain-isolated.

---

## 📅 Important Notes

- This document **must be stored in your team’s GitHub repository**
- It should be **updated regularly** as your system design evolves
