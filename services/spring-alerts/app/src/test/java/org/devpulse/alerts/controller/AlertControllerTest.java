package org.devpulse.alerts.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.devpulse.alerts.dto.StatusUpdateDto;
import org.devpulse.alerts.entity.SystemAlert;
import org.devpulse.alerts.repository.SystemAlertRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
// Using the updated Spring Boot 3.4 annotation you learned earlier!
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AlertController.class)
public class AlertControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    // Mock the database layer so we only test the controller logic
    @MockitoBean
    private SystemAlertRepository alertRepository;

    @Test
    void whenGetAlerts_thenReturnAlertList() throws Exception {
        // Arrange: Create a mock alert that the database "returns"
        SystemAlert mockAlert = new SystemAlert(
                "alert-001", "Prometheus", "CRITICAL", "High CPU", Instant.now()
        );
        mockAlert.setStatus("ACTIVE");
        
        when(alertRepository.findByStatus("ACTIVE")).thenReturn(List.of(mockAlert));

        // Act & Assert: Call the GET endpoint and verify the JSON response
        mockMvc.perform(get("/api/v1/alerts")
                        .param("status", "ACTIVE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].alertId").value("alert-001"))
                .andExpect(jsonPath("$[0].source").value("Prometheus"))
                .andExpect(jsonPath("$[0].status").value("ACTIVE"));
    }

    @Test
    void whenGetAlertsWithoutParam_thenDefaultsToActive() throws Exception {
        // Arrange
        when(alertRepository.findByStatus("ACTIVE")).thenReturn(List.of());

        // Act & Assert: Call GET without the ?status query parameter
        mockMvc.perform(get("/api/v1/alerts"))
                .andExpect(status().isOk());

        // Verify that the controller defaulted to asking the DB for "ACTIVE" alerts
        verify(alertRepository).findByStatus("ACTIVE");
    }

    @Test
    void whenPatchValidAlert_thenUpdatesStatusAndReturns200() throws Exception {
        // Arrange: Mock an existing alert in the database
        SystemAlert existingAlert = new SystemAlert(
                "alert-002", "Datadog", "WARNING", "High Memory", Instant.now()
        );
        existingAlert.setStatus("ACTIVE");
        
        when(alertRepository.findById(1L)).thenReturn(Optional.of(existingAlert));

        // The payload the React client will send
        StatusUpdateDto payload = new StatusUpdateDto("RESOLVED");

        // Act & Assert: Call the PATCH endpoint
        mockMvc.perform(patch("/api/v1/alerts/1/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk());

        // Verify that the alert's status was changed and saved back to the database
        assertEquals("RESOLVED", existingAlert.getStatus());
        verify(alertRepository).save(existingAlert);
    }

    @Test
    void whenPatchUnknownAlert_thenReturns404() throws Exception {
        // Arrange: Simulate the database not finding the alert ID
        when(alertRepository.findById(99L)).thenReturn(Optional.empty());

        StatusUpdateDto payload = new StatusUpdateDto("RESOLVED");

        // Act & Assert: Should return a 404 Not Found error
        mockMvc.perform(patch("/api/v1/alerts/99/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isNotFound());
    }
}