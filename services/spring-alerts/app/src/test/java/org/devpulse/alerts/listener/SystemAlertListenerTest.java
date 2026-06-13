package org.devpulse.alerts.listener;

import org.devpulse.alerts.dto.IncomingLogMessageDto;
import org.devpulse.alerts.dto.LogPayloadDto;
import org.devpulse.alerts.engine.AlertAction;
import org.devpulse.alerts.engine.EvaluationResult;
import org.devpulse.alerts.engine.RulesEngineService;
import org.devpulse.alerts.entity.IncidentStatus;
import org.devpulse.alerts.repository.IncidentStatusRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SystemAlertListenerTest {

    @Mock
    private RulesEngineService rulesEngine;

    // Mock the new database repository dependency
    @Mock
    private IncidentStatusRepository statusRepository;

    @InjectMocks
    private SystemAlertListener listener;

    @Test
    void successfullyProcessesAlertAndSavesIncident() {
        // Arrange
        UUID logId = UUID.randomUUID();
        LogPayloadDto payload = new LogPayloadDto(
                "auth-service", "CRITICAL", "High CPU detected", Instant.now(), null, null
        );
        IncomingLogMessageDto message = new IncomingLogMessageDto(logId, payload);

        EvaluationResult mockResult = new EvaluationResult(
                AlertAction.ESCALATE, List.of("SeverityStrategy"), List.of("Severity is CRITICAL")
        );

        when(rulesEngine.evaluate(any(LogPayloadDto.class))).thenReturn(mockResult);

        // Simulate that this incident doesn't exist in the DB yet
        when(statusRepository.existsById(any(UUID.class))).thenReturn(false);

        // Act
        listener.handleLogEvent(message);

        // Assert
        verify(rulesEngine).evaluate(payload);

        // Verify that the listener successfully tried to save the entity to the database
        verify(statusRepository).save(any(IncidentStatus.class));
    }
}