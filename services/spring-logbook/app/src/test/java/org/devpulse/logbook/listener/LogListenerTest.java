package org.devpulse.logbook.listener;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

import org.devpulse.logbook.dto.IncomingLogMessageDto;
import org.devpulse.logbook.dto.LogPayloadDto;
import org.devpulse.logbook.entity.DeploymentLog;
import org.devpulse.logbook.service.LogService;
import org.devpulse.logbook.type.LogType;
import org.devpulse.logbook.type.Severity;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LogListenerTest {

    @Mock
    private LogService logService;

    @InjectMocks
    private LogListener listener;

    @Test
    void whenDeploymentLogReceived_thenDelegatesToService() {
        // Arrange
        UUID logId = UUID.randomUUID();
        LogPayloadDto payload = new LogPayloadDto(
                "auth-service", "Deployed to production", Severity.INFO, Instant.now(),
                LogType.DEPLOYMENT_LOG, Map.of("region", "eu-central-1")
        );
        IncomingLogMessageDto message = new IncomingLogMessageDto(logId, payload);

        when(logService.saveLog(any(UUID.class), any(LogPayloadDto.class)))
                .thenReturn(new DeploymentLog());

        // Act
        listener.handleDeploymentLog(message);

        // Assert: Verify the listener delegated to the service with the correct arguments
        verify(logService).saveLog(eq(logId), eq(payload));
    }

    @Test
    void whenLogWithNullSeverity_thenStillDelegatesToService() {
        // Arrange: Severity and type are null — the service handles the "UNKNOWN" fallback
        UUID logId = UUID.randomUUID();
        LogPayloadDto payload = new LogPayloadDto(
                "payment-service", "Something happened", null, Instant.now(), null, null
        );
        IncomingLogMessageDto message = new IncomingLogMessageDto(logId, payload);

        when(logService.saveLog(any(UUID.class), any(LogPayloadDto.class)))
                .thenReturn(new DeploymentLog());

        // Act
        listener.handleDeploymentLog(message);

        // Assert
        verify(logService).saveLog(eq(logId), eq(payload));
    }
}
