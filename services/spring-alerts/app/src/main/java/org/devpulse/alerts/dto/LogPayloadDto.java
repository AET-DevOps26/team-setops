package org.devpulse.alerts.dto;

import java.time.Instant;
import java.util.Map;

public record LogPayloadDto(
        String serviceName,
        String severity,
        String logContent,
        Instant timestamp,
        String logType, // Useful for the MetricThresholdStrategy
        Map<String, Object> metadata // Useful for the MetricThresholdStrategy
        ) {

}
