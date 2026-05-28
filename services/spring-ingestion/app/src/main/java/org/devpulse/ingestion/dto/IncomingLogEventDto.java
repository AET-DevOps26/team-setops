package org.devpulse.ingestion.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import java.time.Instant;

public record IncomingLogEventDto(
        @NotBlank(message = "Service name cannot be blank")
        String serviceName,

        @NotBlank(message = "Commit hash cannot be blank")
        String commitHash,

        @NotBlank(message = "Environment is required")
        @Pattern(regexp = "^(PROD|STAGING|DEV)$", message = "Environment must be PROD, STAGING, or DEV")
        String environment,

        @NotBlank(message = "Status is required")
        @Pattern(regexp = "^(SUCCESS|FAILED|ROLLBACK)$", message = "Status must be SUCCESS, FAILED, or ROLLBACK")
        String status,

        @NotBlank(message = "Deployed by cannot be blank")
        String deployedBy,

        @NotNull(message = "Timestamp is required")
        Instant timestamp,

        String rawLogs
) {}