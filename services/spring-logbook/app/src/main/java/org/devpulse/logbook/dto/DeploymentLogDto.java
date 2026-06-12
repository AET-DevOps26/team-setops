package org.devpulse.logbook.dto;

import java.time.Instant;
import java.util.Map;

import org.devpulse.logbook.type.LogType;
import org.devpulse.logbook.type.Severity;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record DeploymentLogDto(

        @NotBlank(message = "Service name cannot be blank")
        String serviceName,

        @NotBlank(message = "Log content cannot be blank")
        String logContent,

        @NotNull(message = "Severity is required")
        Severity severity,

        @NotNull(message = "Timestamp is required")
        Instant timestamp,

        @NotNull(message = "Log Type is required")
        LogType type,

        Map<String, Object> metadata
) {}
