package org.devpulse.alerts.engine.strategies;

import org.devpulse.alerts.dto.SystemAlertDto;
import org.devpulse.alerts.engine.AlertAction;
import org.devpulse.alerts.engine.AlertStrategy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

class MetricThresholdStrategyTest {

    private MetricThresholdStrategy strategy;

    @BeforeEach
    void setUp() {
        // Initialize strategy with test thresholds
        Map<String, Double> testThresholds = Map.of(
                "cpu_load", 90.0,
                "memory_usage", 85.0
        );
        strategy = new MetricThresholdStrategy(testThresholds);
    }

    @Test
    void whenMetricExceedsThreshold_thenReturnsEscalate() {
        SystemAlertDto alert = createAlertWithMetrics(Map.of("cpu_load", 95.5));

        Optional<AlertStrategy.StrategyMatch> matchOpt = strategy.evaluate(alert);

        assertTrue(matchOpt.isPresent());
        assertEquals(AlertAction.ESCALATE, matchOpt.get().action());
        assertTrue(matchOpt.get().detail().contains("exceeds threshold"));
    }

    @Test
    void whenMetricBelowThreshold_thenReturnsEmpty() {
        SystemAlertDto alert = createAlertWithMetrics(Map.of("cpu_load", 50.0));
        assertTrue(strategy.evaluate(alert).isEmpty());
    }

    @Test
    void whenMetricIsStringNumberExceedingThreshold_thenParsesAndReturnsEscalate() {
        // Testing the `toDouble` parsing logic
        SystemAlertDto alert = createAlertWithMetrics(Map.of("memory_usage", "90.5%"));

        Optional<AlertStrategy.StrategyMatch> matchOpt = strategy.evaluate(alert);

        assertTrue(matchOpt.isPresent());
        assertEquals(AlertAction.ESCALATE, matchOpt.get().action());
    }

    @Test
    void whenMetricsNullOrEmpty_thenReturnsEmpty() {
        SystemAlertDto alert1 = createAlertWithMetrics(null);
        assertTrue(strategy.evaluate(alert1).isEmpty());

        SystemAlertDto alert2 = createAlertWithMetrics(Map.of());
        assertTrue(strategy.evaluate(alert2).isEmpty());
    }

    private SystemAlertDto createAlertWithMetrics(Map<String, Object> metrics) {
        return new SystemAlertDto("alert-1", "Datadog", "INFO", "Test desc", Instant.now(), metrics);
    }
}