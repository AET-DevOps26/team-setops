package org.devpulse.alerts.engine.strategies;

import java.util.Map;
import java.util.Optional;

import org.devpulse.alerts.dto.LogPayloadDto;
import org.devpulse.alerts.engine.AlertAction;
import org.devpulse.alerts.engine.AlertStrategy;
import org.springframework.stereotype.Component;

@Component
public class MetricThresholdStrategy implements AlertStrategy {

    // Define thresholds (e.g., CPU > 90%, Memory > 85%)
    private final Map<String, Double> thresholds = Map.of(
            "cpu_load", 90.0,
            "memory_usage", 85.0
    );

    @Override
    public String name() {
        return "MetricThresholdStrategy";
    }

    @Override
    public Optional<StrategyMatch> evaluate(LogPayloadDto log) {
        // Change to evaluate log.metadata()
        if (log.metadata() == null || log.metadata().isEmpty()) {
            return Optional.empty();
        }

        for (Map.Entry<String, Double> threshold : thresholds.entrySet()) {
            String metricKey = threshold.getKey();
            Double limit = threshold.getValue();

            if (log.metadata().containsKey(metricKey)) {
                double actualValue = toDouble(log.metadata().get(metricKey));
                if (actualValue >= limit) {
                    return Optional.of(new StrategyMatch(
                            AlertAction.ESCALATE,
                            String.format("Metric '%s' value %.2f exceeds threshold %.2f", metricKey, actualValue, limit)
                    ));
                }
            }
        }

        return Optional.empty();
    }

    private double toDouble(Object value) {
        if (value instanceof Number n) {
            return n.doubleValue();
        } else if (value instanceof String s) {
            try {
                return Double.parseDouble(s.replaceAll("[^0-9.]", "")); // Strip out things like '%' or 'MB'
            } catch (NumberFormatException ignored) {
            }
        }
        return 0.0;
    }
}
