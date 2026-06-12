package org.devpulse.logbook.dto;

import java.time.Instant;
import java.util.Map;

import org.devpulse.logbook.type.LogType;
import org.devpulse.logbook.type.Severity;

public record DeploymentLogDto(
        String serviceName,
        String logContent,
        Severity severity,
        Instant timestamp,
        LogType type,
        Map<String, Object> metadata
        ) {

}
