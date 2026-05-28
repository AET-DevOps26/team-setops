package org.devpulse.ingestion.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import java.time.Instant;
import java.util.Map;

public record IncomingLogEventDto(
        @NotBlank(message = "Service name cannot be blank")
        String serviceName,

        @NotBlank(message = "Log content cannot be blank")
        String logContent,

        Instant timestamp,

        @Pattern(regexp = "^(INFO|WARNING|ERROR|CRITICAL)$", message = "Severity must be INFO, WARNING, ERROR, or CRITICAL")
        String severity,

        Map<String, Object> metadata
) {}