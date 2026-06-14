package org.devpulse.alerts.engine.strategies;

import org.devpulse.alerts.dto.SystemAlertDto;
import org.devpulse.alerts.engine.AlertAction;
import org.devpulse.alerts.engine.AlertStrategy;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Optional;

/**
 * Evaluates numeric values in the alert's {@code metrics} map against
 * configurable thresholds. If any metric exceeds its threshold, the strategy fires.
 *
 * <p>Thresholds are defined in {@code application.yml} under
 * {@code devpulse.alerts.thresholds} as a map of metric-name → threshold-value.
 */
@Component
public class MetricThresholdStrategy implements AlertStrategy {

    private final Map<String, Double> thresholds;

    public MetricThresholdStrategy(
            @Value("#{${devpulse.alerts.thresholds:{cpu_load: 90.0, memory_usage_percent: 85.0}}}") Map<String, Double> thresholds) {
        this.thresholds = thresholds;
    }

    @Override
    public String name() {
        return "MetricThresholdStrategy";
    }

    @Override
    public Optional<StrategyMatch> evaluate(SystemAlertDto alert) {
        if (alert.metrics() == null || alert.metrics().isEmpty()) {
            return Optional.empty();
        }

        for (Map.Entry<String, Double> threshold : thresholds.entrySet()) {
            String metricName = threshold.getKey();
            double limit = threshold.getValue();

            Object rawValue = alert.metrics().get(metricName);
            if (rawValue == null) {
                continue;
            }

            double actualValue = toDouble(rawValue);
            if (actualValue > limit) {
                String detail = String.format(
                        "Metric '%s' = %.2f exceeds threshold %.2f",
                        metricName, actualValue, limit
                );
                return Optional.of(new StrategyMatch(AlertAction.ESCALATE, detail));
            }
        }

        return Optional.empty();
    }

    private double toDouble(Object value) {
        if (value instanceof Number number) {
            return number.doubleValue();
        }
        try {
            return Double.parseDouble(value.toString().replaceAll("[^\\d.]", ""));
        } catch (NumberFormatException e) {
            return 0.0;
        }
    }
}
