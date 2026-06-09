package org.devpulse.alerts.dto;

import java.time.Instant;
import java.util.Map;

public record SystemAlertDto(
        String alertId,
        String source,
        String severity,
        String description,
        Instant timestamp,
        Map<String, Object> metrics
) {}
