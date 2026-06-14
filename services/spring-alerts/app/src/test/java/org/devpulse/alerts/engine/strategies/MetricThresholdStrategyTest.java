package org.devpulse.alerts.engine.strategies;

import org.devpulse.alerts.dto.LogPayloadDto;
import org.devpulse.alerts.engine.AlertAction;
import org.devpulse.alerts.engine.AlertStrategy;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

class MetricThresholdStrategyTest {

    // The refactored strategy uses hardcoded thresholds — no constructor args needed
    private final MetricThresholdStrategy strategy = new MetricThresholdStrategy();

    @Test
    void whenMetricExceedsThreshold_thenReturnsEscalate() {
        LogPayloadDto log = createLogWithMetadata(Map.of("cpu_load", 95.5));

        Optional<AlertStrategy.StrategyMatch> matchOpt = strategy.evaluate(log);

        assertTrue(matchOpt.isPresent());
        assertEquals(AlertAction.ESCALATE, matchOpt.get().action());
        assertTrue(matchOpt.get().detail().contains("exceeds threshold"));
    }

    @Test
    void whenMetricBelowThreshold_thenReturnsEmpty() {
        LogPayloadDto log = createLogWithMetadata(Map.of("cpu_load", 50.0));
        assertTrue(strategy.evaluate(log).isEmpty());
    }

    @Test
    void whenMetricIsStringNumberExceedingThreshold_thenParsesAndReturnsEscalate() {
        // Testing the `toDouble` parsing logic
        LogPayloadDto log = createLogWithMetadata(Map.of("memory_usage", "90.5%"));

        Optional<AlertStrategy.StrategyMatch> matchOpt = strategy.evaluate(log);

        assertTrue(matchOpt.isPresent());
        assertEquals(AlertAction.ESCALATE, matchOpt.get().action());
    }

    @Test
    void whenMetadataNullOrEmpty_thenReturnsEmpty() {
        LogPayloadDto log1 = createLogWithMetadata(null);
        assertTrue(strategy.evaluate(log1).isEmpty());

        LogPayloadDto log2 = createLogWithMetadata(Map.of());
        assertTrue(strategy.evaluate(log2).isEmpty());
    }

    private LogPayloadDto createLogWithMetadata(Map<String, Object> metadata) {
        return new LogPayloadDto("test-service", "INFO", "Test log content", Instant.now(), null, metadata);
    }
}