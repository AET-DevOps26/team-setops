package org.devpulse.alerts.listener;

import org.devpulse.alerts.dto.SystemAlertDto;
import org.devpulse.alerts.engine.AlertAction;
import org.devpulse.alerts.engine.EvaluationResult;
import org.devpulse.alerts.engine.RulesEngineService;
import org.devpulse.alerts.entity.SystemAlert;
import org.devpulse.alerts.repository.SystemAlertRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SystemAlertListenerTest {

    @Mock
    private RulesEngineService rulesEngine;

    // 1. Mock the new database repository dependency
    @Mock
    private SystemAlertRepository alertRepository;

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
        
        // 2. Mock the repository to simulate that this alert doesn't exist in the DB yet
        when(alertRepository.findByAlertId(anyString())).thenReturn(Optional.empty());

        // Act
        listener.handleSystemAlert(alert);

        // Assert
        verify(rulesEngine).evaluate(alert);
        
        // 3. Verify that the listener successfully tried to save the entity to the database
        verify(alertRepository).save(any(SystemAlert.class));
    }
}