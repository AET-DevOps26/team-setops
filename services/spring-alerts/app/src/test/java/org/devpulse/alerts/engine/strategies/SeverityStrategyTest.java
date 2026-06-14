package org.devpulse.alerts.engine.strategies;

import org.devpulse.alerts.dto.LogPayloadDto;
import org.devpulse.alerts.engine.AlertAction;
import org.devpulse.alerts.engine.AlertStrategy;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

class SeverityStrategyTest {

    private final SeverityStrategy strategy = new SeverityStrategy();

    @ParameterizedTest
    @CsvSource({
            "CRITICAL, ESCALATE",
            "ERROR, NOTIFY",
            "WARNING, LOG"
    })
    void whenKnownSeverity_thenReturnsExpectedAction(String inputSeverity, AlertAction expectedAction) {
        // Arrange
        LogPayloadDto log = createLogWithSeverity(inputSeverity);

        // Act
        Optional<AlertStrategy.StrategyMatch> matchOpt = strategy.evaluate(log);

        // Assert
        assertTrue(matchOpt.isPresent());
        assertEquals(expectedAction, matchOpt.get().action());
    }

    @Test
    void whenInfoOrUnknownSeverity_thenReturnsEmpty() {
        LogPayloadDto log = createLogWithSeverity("INFO");
        assertTrue(strategy.evaluate(log).isEmpty());

        LogPayloadDto unknownLog = createLogWithSeverity("WEIRD_STATUS");
        assertTrue(strategy.evaluate(unknownLog).isEmpty());
    }

    @Test
    void whenSeverityIsNull_thenReturnsEmpty() {
        LogPayloadDto log = createLogWithSeverity(null);
        assertTrue(strategy.evaluate(log).isEmpty());
    }

    // Helper to keep tests clean
    private LogPayloadDto createLogWithSeverity(String severity) {
        return new LogPayloadDto("test-service", severity, "Test log content", Instant.now(), null, null);
    }
}