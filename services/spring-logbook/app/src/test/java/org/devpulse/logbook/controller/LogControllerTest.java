package org.devpulse.logbook.controller;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.devpulse.logbook.entity.Log;
import org.devpulse.logbook.service.LogService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(LogController.class)
public class LogControllerTest {

    @Autowired
    private MockMvc mockMvc;

    // Mock the service layer so we only test the controller logic
    @MockitoBean
    private LogService logService;

    @Test
    void whenGetLogs_thenReturnsLogListOrderedByTimestamp() throws Exception {
        // Arrange: Create mock deployment logs that the service "returns"
        UUID logId1 = UUID.randomUUID();
        UUID logId2 = UUID.randomUUID();
        Instant now = Instant.now();

        Log log1 = new Log(logId1, "auth-service", "DEPLOYMENT_LOG", "CRITICAL", "High CPU detected", now);
        Log log2 = new Log(logId2, "payment-service", "DEPLOYMENT_LOG", "INFO", "Deployed successfully", now.minusSeconds(60));

        when(logService.getDeploymentHistory()).thenReturn(List.of(log1, log2));

        // Act & Assert: Call the GET endpoint and verify the JSON response
        mockMvc.perform(get("/api/v1/logs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].logId").value(logId1.toString()))
                .andExpect(jsonPath("$[0].serviceName").value("auth-service"))
                .andExpect(jsonPath("$[0].severity").value("CRITICAL"))
                .andExpect(jsonPath("$[1].logId").value(logId2.toString()))
                .andExpect(jsonPath("$[1].serviceName").value("payment-service"));

        // Verify the service method was called
        verify(logService).getDeploymentHistory();
    }

    @Test
    void whenGetLogs_andNoLogsExist_thenReturnsEmptyList() throws Exception {
        // Arrange: No logs in the system
        when(logService.getDeploymentHistory()).thenReturn(List.of());

        // Act & Assert: Should return 200 with an empty array
        mockMvc.perform(get("/api/v1/logs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void whenSearchByIds_thenReturnsMatchingLogs() throws Exception {
        // Arrange
        UUID logId1 = UUID.randomUUID();
        UUID logId2 = UUID.randomUUID();
        List<UUID> ids = List.of(logId1, logId2);

        Log log1 = new Log(logId1, "auth-service", "DEPLOYMENT_LOG", "CRITICAL", "High CPU", Instant.now());
        Log log2 = new Log(logId2, "payment-service", "DEPLOYMENT_LOG", "INFO", "Deployed", Instant.now());

        when(logService.getLogsByIds(ids)).thenReturn(List.of(log1, log2));

        // Act & Assert: GET /api/v1/logs/search?ids=uuid-1&ids=uuid-2
        mockMvc.perform(get("/api/v1/logs/search")
                .param("ids", logId1.toString(), logId2.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].logId").value(logId1.toString()))
                .andExpect(jsonPath("$[1].logId").value(logId2.toString()));

        verify(logService).getLogsByIds(ids);
    }

    @Test
    void whenSearchByIds_andNoLogsMatch_thenReturnsEmptyList() throws Exception {
        // Arrange: IDs that don't exist in the database
        UUID unknownId = UUID.randomUUID();
        List<UUID> ids = List.of(unknownId);

        when(logService.getLogsByIds(ids)).thenReturn(List.of());

        // Act & Assert
        mockMvc.perform(get("/api/v1/logs/search")
                .param("ids", unknownId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void whenSearchByIds_withoutIdsParam_thenReturnsBadRequest() throws Exception {
        // Act & Assert: Missing required query parameter should return 400
        mockMvc.perform(get("/api/v1/logs/search"))
                .andExpect(status().isBadRequest());
    }
}
