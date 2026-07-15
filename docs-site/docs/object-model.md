---
sidebar_position: 5
---

# Analysis Object Model

Core domain entities and relationships, one diagram per backend service. The three Spring services were modeled with a UML tool; `py-intelligence` is expressed as Mermaid since it's generated directly from the current code.

## spring-logbook

Owns the `system_logs` table: consumes ingestion events off RabbitMQ, persists them, and serves the deployment history timeline.

![spring-logbook class diagram](/img/diagrams/spring-logbook-class-diagram.svg)

## spring-alerts

Owns the `incident_status` table. Uses a Strategy pattern (`AlertStrategy` implementations like `MetricThresholdStrategy`) so new alert conditions can be added without touching the core rules engine.

![spring-alerts class diagram](/img/diagrams/spring-alerts-class-diagram.svg)

## spring-ingestion

The synchronous entry point: validates incoming payloads, assigns the correlation `logId`, and publishes to RabbitMQ. Holds no persistent state of its own.

![spring-ingestion class diagram](/img/diagrams/spring-ingestion-class-diagram.svg)

## py-intelligence

The GenAI service. `Intelligence` orchestrates prompt building, model selection, and response parsing; `Model` wraps each LLM backend (local Qwen via llama.cpp, Gemini, OpenAI-compatible fallback); `DB` wraps MongoDB access for both RAG documents and persisted analyses.

```mermaid
classDiagram
    class Intelligence {
        -list~Model~ models
        -dict prompts
        +analyze(content, mode, use_rag, context, retrieved_docs) dict
        +get_model_for_mode(mode) Model
        -_build_analysis_prompt(...) str
        -_parse_model_response(raw) dict
        -_normalize_response(response, docs, use_rag) dict
    }

    class Model {
        -str model_name
        -str provider
        -str shortened
        -bool cloud
        -Client _client
        +count_tokens(text) int
        +generate(prompt) str
    }

    class DB {
        -MongoClient client
        -Database db
        -Collection collection
        +add_new_document(document) bool
        +delete_document(id) bool
        +delete_all_documents() bool
    }

    class AnalyzeResponse {
        +str model
        +str problem_type
        +str severity
        +str summary
        +str problem_summary
        +list~str~ evidence
        +list~str~ troubleshoot
        +list~str~ solutions
        +list~SourceRef~ sources
        +str confidence
    }

    class PersistedAnalysis {
        <<MongoDB document>>
        +str log_id
        +AnalyzeResponse result
    }

    class RagDocument {
        +str title
        +str content
        +list~str~ tags
        +list~float~ embedding
        +datetime created_at
    }

    Intelligence "1" o-- "3" Model : selects by mode
    Intelligence ..> AnalyzeResponse : produces
    Intelligence ..> DB : persists PersistedAnalysis
    PersistedAnalysis "1" *-- "1" AnalyzeResponse : wraps
    DB "1" o-- "*" RagDocument : ingestions collection
    DB "1" o-- "*" PersistedAnalysis : completed_analyses collection
```
