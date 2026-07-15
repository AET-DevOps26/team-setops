```mermaid
graph TD
    classDef client fill:#3498db,stroke:#2980b9,color:#fff
    classDef gateway fill:#2ecc71,stroke:#27ae60,color:#fff
    classDef spring fill:#68A063,stroke:#3b5f38,color:#fff
    classDef python fill:#f1c40f,stroke:#f39c12,color:#333
    classDef infra fill:#95a5a6,stroke:#7f8c8d,color:#fff
    classDef monitor fill:#e67e22,stroke:#d35400,color:#fff

    subgraph "Client Tier"
        UI[React Client]:::client
    end

    subgraph "API Gateway"
        Gateway[Nginx Gateway]:::gateway
    end

    subgraph "Spring Boot Microservices"
        Ingestion[spring-ingestion]:::spring
        Logbook[spring-logbook]:::spring
        Alerts[spring-alerts]:::spring
    end

    subgraph "GenAI Subsystem"
        PyIntel[py-intelligence]:::python
        LLM[["Local Qwen / Gemini / OpenAI"]]:::python
    end

    subgraph "Infrastructure & Data Tier"
        RMQ(["RabbitMQ"]):::infra
        PG[("PostgreSQL")]:::infra
        Mongo[("MongoDB Atlas")]:::infra
    end

    subgraph "Observability"
        Prom[Prometheus]:::monitor
        Graf[Grafana]:::monitor
    end

    UI -->|HTTP 8080| Gateway

    Gateway -->|POST /api/v1/logs| Ingestion
    Gateway -->|GET /api/v1/logs| Logbook
    Gateway -->|/api/v1/incidents| Alerts
    Gateway -->|/api/v1/analyze, /api/v1/analyses, /api/v1/rag| PyIntel
    Gateway -->|/prometheus| Prom
    Gateway -->|/grafana| Graf

    Ingestion -->|publish log/alert event| RMQ
    RMQ -->|consume & store| Logbook
    RMQ -->|consume & evaluate rules| Alerts

    Logbook -->|read / write logs| PG
    Alerts -->|read / write incidents| PG

    PyIntel -->|RAG docs, persisted analyses| Mongo
    PyIntel -->|inference| LLM

    Prom -.->|scrape /actuator/prometheus, /metrics| Ingestion
    Prom -.-> Logbook
    Prom -.-> Alerts
    Prom -.-> PyIntel
    Graf -->|query| Prom
```