package org.devpulse.alerts.engine;

import org.devpulse.alerts.dto.LogPayloadDto;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RulesEngineServiceTest {

    @Mock
    private AlertStrategy strategy1;

    @Mock
    private AlertStrategy strategy2;

    @Test
    void whenMultipleStrategiesMatch_thenReturnsHighestPriorityAction() {
        // Arrange: Strategy 1 suggests LOG, Strategy 2 suggests ESCALATE
        when(strategy1.name()).thenReturn("LogStrategy");
        when(strategy1.evaluate(any())).thenReturn(Optional.of(
                new AlertStrategy.StrategyMatch(AlertAction.LOG, "Log it")
        ));

        when(strategy2.name()).thenReturn("EscalateStrategy");
        when(strategy2.evaluate(any())).thenReturn(Optional.of(
                new AlertStrategy.StrategyMatch(AlertAction.ESCALATE, "Escalate it")
        ));

        RulesEngineService engine = new RulesEngineService(List.of(strategy1, strategy2));
        LogPayloadDto dummyLog = new LogPayloadDto("test-service", "INFO", "test content", Instant.now(), null, null);

        // Act
        EvaluationResult result = engine.evaluate(dummyLog);

        // Assert: ESCALATE is higher priority than LOG
        assertEquals(AlertAction.ESCALATE, result.action());
        assertEquals(2, result.triggeredBy().size());
        assertTrue(result.triggeredBy().contains("LogStrategy"));
        assertTrue(result.triggeredBy().contains("EscalateStrategy"));
    }

    @Test
    void whenNoStrategiesMatch_thenReturnsIgnored() {
        // Arrange
        when(strategy1.evaluate(any())).thenReturn(Optional.empty());
        when(strategy2.evaluate(any())).thenReturn(Optional.empty());

        RulesEngineService engine = new RulesEngineService(List.of(strategy1, strategy2));
        LogPayloadDto dummyLog = new LogPayloadDto("test-service", "INFO", "test content", Instant.now(), null, null);

        // Act
        EvaluationResult result = engine.evaluate(dummyLog);

        // Assert
        assertEquals(AlertAction.IGNORE, result.action());
        assertTrue(result.triggeredBy().isEmpty());
    }
}