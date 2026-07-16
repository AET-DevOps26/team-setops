package org.devpulse.ingestion.dto;

import java.time.Instant;
import java.util.Map;

import org.devpulse.ingestion.type.LogType;
import org.devpulse.ingestion.type.Severity;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record IncomingLogEventDto(
        @NotBlank(message = "Service name cannot be blank")
        String serviceName,
        @NotBlank(message = "Log content cannot be blank")
        String logContent,
        @NotNull(message = "Timestamp is required")
        Instant timestamp,
        @NotNull(message = "Severity must be INFO, WARNING, ERROR, or CRITICAL")
        Severity severity,
        @NotNull(message = "Log Type must be DEPLOYMENT_LOG, BUILD_ERRORS or TROUBLESHOOTING_NOTE")
        LogType type,
        Map<String, Object> metadata
        ) {

}
