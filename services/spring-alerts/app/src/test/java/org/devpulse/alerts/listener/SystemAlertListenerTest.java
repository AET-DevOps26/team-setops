package org.devpulse.alerts.listener;

import org.devpulse.alerts.dto.SystemAlertDto;
import org.devpulse.alerts.engine.AlertAction;
import org.devpulse.alerts.engine.EvaluationResult;
import org.devpulse.alerts.engine.RulesEngineService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SystemAlertListenerTest {

    @Mock
    private RulesEngineService rulesEngine;

    @InjectMocks
    private SystemAlertListener listener;

    @Test
    void successfullyProcessesAlert() {
        // Arrange
        SystemAlertDto alert = new SystemAlertDto(
                "alert-123", "Prometheus", "CRITICAL", "Desc", Instant.now(), null
        );
        
        EvaluationResult mockResult = new EvaluationResult(
                AlertAction.ESCALATE, List.of("SeverityStrategy"), List.of("Severity is CRITICAL")
        );
        
        when(rulesEngine.evaluate(any(SystemAlertDto.class))).thenReturn(mockResult);

        // Act
        listener.handleSystemAlert(alert);

        // Assert
        verify(rulesEngine).evaluate(alert);
        // Since the current listener implementation only logs, we just verify it runs 
        // without throwing exceptions and properly delegates to the engine.
    }
}