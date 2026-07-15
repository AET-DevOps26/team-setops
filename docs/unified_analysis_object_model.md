# Unified Analysis Object Model (AOM)

This document provides a unified view of the core domain objects, entities, and data transfer objects (DTOs) used across all DevPulse microservices (`spring-ingestion`, `spring-logbook`, `spring-alerts`, and `py-intelligence`).

```mermaid
classDiagram
    %% Core Database Entities
    class Log {
        <<Entity>>
        +UUID logId
        +String serviceName
        +String type
        +String severity
        +String logContent
        +Instant timestamp
    }

    class IncidentStatus {
        <<Entity>>
        +UUID logId
        +AlertStatus status
    }

    class AlertStatus {
        <<Enumeration>>
        ACTIVE
        INVESTIGATING
        RESOLVED
        IGNORED
    }

    %% DTOs (Inter-Service RabbitMQ Communication)
    class IncomingLogEventDto {
        <<DTO>>
        +String serviceName
        +String type
        +String severity
        +String logContent
        +Instant timestamp
    }

    class OutgoingLogEventDto {
        <<DTO>>
        +UUID logId
        +LogPayloadDto payload
    }

    class LogPayloadDto {
        <<DTO>>
        +String serviceName
        +String type
        +String severity
        +String logContent
        +Instant timestamp
    }

    class StatusUpdateDto {
        <<DTO>>
        +AlertStatus status
    }

    %% GenAI API Objects (REST via OpenAPI)
    class AnalyzeRequest {
        <<DTO>>
        +String content
        +String mode
        +boolean use_rag
        +String context
    }

    class AnalyzeResponse {
        <<DTO>>
        +String problem_type
        +String severity
        +String summary
        +String problem_summary
        +List~String~ evidence
        +List~String~ troubleshoot
        +List~String~ solutions
        +String confidence
    }

    %% Relationships and Data Flow
    Log "1" -- "0..1" IncidentStatus : maps to
    IncidentStatus --> AlertStatus : uses
    
    IncomingLogEventDto ..> OutgoingLogEventDto : processed into (Ingestion)
    OutgoingLogEventDto --> LogPayloadDto : contains
    OutgoingLogEventDto ..> Log : persisted as (Logbook)
    OutgoingLogEventDto ..> IncidentStatus : evaluated for (Alerts)
    
    StatusUpdateDto ..> IncidentStatus : updates
    
    Log "1" .. "0..1" AnalyzeResponse : is analyzed into (Py-Intelligence)
    AnalyzeRequest --> AnalyzeResponse : generates
```

### Domain Component Mapping
- **`Log`**: Persisted by `spring-logbook` in PostgreSQL.
- **`IncidentStatus`**: Persisted by `spring-alerts` in PostgreSQL.
- **`AlertStatus`**: Shared enumeration representing the lifecycle of an incident.
- **`EventDto` & `PayloadDto`**: Data models used for asynchronous message brokering over RabbitMQ.
- **`Analyze`**: REST payload models defined in OpenAPI, used for synchronous communication with the `py-intelligence` Python microservice.
