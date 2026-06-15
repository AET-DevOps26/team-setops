package org.devpulse.logbook.service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.devpulse.logbook.dto.LogPayloadDto;
import org.devpulse.logbook.entity.DeploymentLog;
import org.devpulse.logbook.repository.LogRepository;
import org.devpulse.logbook.type.LogType;
import org.devpulse.logbook.type.Severity;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class LogServiceTest {

    @Mock
    private LogRepository logRepository;

    @InjectMocks
    private LogService logService;

    @Test
    void whenGetDeploymentHistory_thenDelegatesToRepository() {
        // Arrange
        DeploymentLog log1 = new DeploymentLog(
                UUID.randomUUID(), "auth-service", "DEPLOYMENT_LOG", "INFO",
                "Deployed successfully", Instant.now()
        );
        when(logRepository.findAllByOrderByTimestampDesc()).thenReturn(List.of(log1));

        // Act
        List<DeploymentLog> result = logService.getDeploymentHistory();

        // Assert
        assertEquals(1, result.size());
        assertEquals("auth-service", result.get(0).getServiceName());
        verify(logRepository).findAllByOrderByTimestampDesc();
    }

    @Test
    void whenSaveLog_thenCreatesEntityAndPersists() {
        // Arrange
        UUID logId = UUID.randomUUID();
        Instant timestamp = Instant.now();
        LogPayloadDto payload = new LogPayloadDto(
                "payment-service", "Payment processed", Severity.WARNING, timestamp,
                LogType.DEPLOYMENT_LOG, null
        );

        // Capture the entity passed to repository.save()
        ArgumentCaptor<DeploymentLog> captor = ArgumentCaptor.forClass(DeploymentLog.class);
        when(logRepository.save(captor.capture())).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        DeploymentLog result = logService.saveLog(logId, payload);

        // Assert: Verify the entity was constructed correctly
        assertNotNull(result);
        DeploymentLog savedEntity = captor.getValue();
        assertEquals(logId, savedEntity.getLogId());
        assertEquals("payment-service", savedEntity.getServiceName());
        assertEquals("DEPLOYMENT_LOG", savedEntity.getEnvironment());
        assertEquals("WARNING", savedEntity.getSeverity());
        assertEquals("Payment processed", savedEntity.getLogContent());
        assertEquals(timestamp, savedEntity.getTimestamp());
    }

    @Test
    void whenSaveLogWithNullTypeAndSeverity_thenDefaultsToUnknown() {
        // Arrange: Both type and severity are null
        UUID logId = UUID.randomUUID();
        LogPayloadDto payload = new LogPayloadDto(
                "api-gateway", "Some event", null, Instant.now(), null, null
        );

        ArgumentCaptor<DeploymentLog> captor = ArgumentCaptor.forClass(DeploymentLog.class);
        when(logRepository.save(captor.capture())).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        logService.saveLog(logId, payload);

        // Assert: Null type and severity should fall back to "UNKNOWN"
        DeploymentLog savedEntity = captor.getValue();
        assertEquals("UNKNOWN", savedEntity.getEnvironment());
        assertEquals("UNKNOWN", savedEntity.getSeverity());
    }
}
