package org.devpulse.logbook.dto;

import java.time.Instant;
import java.util.Map;

public record DeploymentLogDto(
        String serviceName,
        String logContent,
        Instant timestamp,
        String severity,
        String type,
        Map<String, Object> metadata
) {}
