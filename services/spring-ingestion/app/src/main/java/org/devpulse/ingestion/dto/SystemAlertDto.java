package org.devpulse.ingestion.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.devpulse.ingestion.type.Severity;

import java.time.Instant;
import java.util.Map;

public record SystemAlertDto(
        @NotBlank(message = "Alert ID cannot be blank")
        String alertId,

        @NotBlank(message = "Source (e.g., Prometheus, Datadog) cannot be blank")
        String source,

        @NotBlank(message = "Severity is required")
        Severity severity,

        @NotBlank(message = "Description is required")
        String description,

        @NotNull(message = "Timestamp is required")
        Instant timestamp,

        // Flexible map for specific metric values (e.g., CPU load, memory usage)
        Map<String, Object> metrics
) {}