package org.devpulse.alerts.engine.strategies;

import org.devpulse.alerts.dto.SystemAlertDto;
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
        SystemAlertDto alert = createAlertWithSeverity(inputSeverity);

        // Act
        Optional<AlertStrategy.StrategyMatch> matchOpt = strategy.evaluate(alert);

        // Assert
        assertTrue(matchOpt.isPresent());
        assertEquals(expectedAction, matchOpt.get().action());
    }

    @Test
    void whenInfoOrUnknownSeverity_thenReturnsEmpty() {
        SystemAlertDto alert = createAlertWithSeverity("INFO");
        assertTrue(strategy.evaluate(alert).isEmpty());

        SystemAlertDto unknownAlert = createAlertWithSeverity("WEIRD_STATUS");
        assertTrue(strategy.evaluate(unknownAlert).isEmpty());
    }

    @Test
    void whenSeverityIsNull_thenReturnsEmpty() {
        SystemAlertDto alert = createAlertWithSeverity(null);
        assertTrue(strategy.evaluate(alert).isEmpty());
    }

    // Helper to keep tests clean
    private SystemAlertDto createAlertWithSeverity(String severity) {
        return new SystemAlertDto("alert-1", "Datadog", severity, "Test desc", Instant.now(), null);
    }
}