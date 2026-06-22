package org.devpulse.logbook.service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.devpulse.logbook.dto.LogPayloadDto;
import org.devpulse.logbook.entity.Log;
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
        Log log1 = new Log(
                UUID.randomUUID(), "auth-service", "DEPLOYMENT_LOG", "INFO",
                "Deployed successfully", Instant.now()
        );
        when(logRepository.findAllByOrderByTimestampDesc()).thenReturn(List.of(log1));

        // Act
        List<Log> result = logService.getDeploymentHistory();

        // Assert
        assertEquals(1, result.size());
        assertEquals("auth-service", result.get(0).getServiceName());
        verify(logRepository).findAllByOrderByTimestampDesc();
    }

    @Test
    void whenGetLogsByIds_thenDelegatesToRepository() {
        // Arrange
        UUID logId1 = UUID.randomUUID();
        UUID logId2 = UUID.randomUUID();
        List<UUID> ids = List.of(logId1, logId2);

        Log log1 = new Log(logId1, "auth-service", "DEPLOYMENT_LOG", "INFO", "Deployed", Instant.now());
        Log log2 = new Log(logId2, "payment-service", "DEPLOYMENT_LOG", "WARNING", "Timeout", Instant.now());
        when(logRepository.findAllById(ids)).thenReturn(List.of(log1, log2));

        // Act
        List<Log> result = logService.getLogsByIds(ids);

        // Assert
        assertEquals(2, result.size());
        verify(logRepository).findAllById(ids);
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
        ArgumentCaptor<Log> captor = ArgumentCaptor.forClass(Log.class);
        when(logRepository.save(captor.capture())).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        Log result = logService.saveLog(logId, payload);

        // Assert: Verify the entity was constructed correctly
        assertNotNull(result);
        Log savedEntity = captor.getValue();
        assertEquals(logId, savedEntity.getLogId());
        assertEquals("payment-service", savedEntity.getServiceName());
        assertEquals("DEPLOYMENT_LOG", savedEntity.getType());
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

        ArgumentCaptor<Log> captor = ArgumentCaptor.forClass(Log.class);
        when(logRepository.save(captor.capture())).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        logService.saveLog(logId, payload);

        // Assert: Null type and severity should fall back to "UNKNOWN"
        Log savedEntity = captor.getValue();
        assertEquals("UNKNOWN", savedEntity.getType());
        assertEquals("UNKNOWN", savedEntity.getSeverity());
    }
}
