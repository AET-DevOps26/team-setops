package org.devpulse.alerts.controller;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.devpulse.alerts.dto.StatusUpdateDto;
import org.devpulse.alerts.entity.IncidentStatus;
import org.devpulse.alerts.repository.IncidentStatusRepository;
import org.devpulse.alerts.type.AlertStatus;
import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.Test;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import tools.jackson.databind.json.JsonMapper;

@WebMvcTest(IncidentController.class)
public class IncidentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private final JsonMapper jsonMapper = JsonMapper.builder().build();

    // Mock the database layer so we only test the controller logic
    @MockitoBean
    private IncidentStatusRepository statusRepository;

    @Test
    void whenGetIncidents_thenReturnIncidentList() throws Exception {
        // Arrange: Create a mock incident that the database "returns"
        UUID logId = UUID.randomUUID();
        IncidentStatus mockIncident = new IncidentStatus(logId);
        mockIncident.setStatus(AlertStatus.ACTIVE);

        when(statusRepository.findByStatus(AlertStatus.ACTIVE)).thenReturn(List.of(mockIncident));

        // Act & Assert: Call the GET endpoint and verify the JSON response
        mockMvc.perform(get("/api/v1/incidents")
                .param("status", "ACTIVE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].logId").value(logId.toString()))
                .andExpect(jsonPath("$[0].status").value("ACTIVE"));
    }

    @Test
    void whenGetIncidentsWithoutParam_thenDefaultsToActive() throws Exception {
        // Arrange
        when(statusRepository.findByStatus(AlertStatus.ACTIVE)).thenReturn(List.of());

        // Act & Assert: Call GET without the ?status query parameter
        mockMvc.perform(get("/api/v1/incidents"))
                .andExpect(status().isOk());

        // Verify that the controller defaulted to asking the DB for ACTIVE incidents
        verify(statusRepository).findByStatus(AlertStatus.ACTIVE);
    }

    @Test
    void whenPatchValidIncident_thenUpdatesStatusAndReturns200() throws Exception {
        // Arrange: Mock an existing incident in the database
        UUID logId = UUID.randomUUID();
        IncidentStatus existingIncident = new IncidentStatus(logId);
        existingIncident.setStatus(AlertStatus.ACTIVE);

        when(statusRepository.findById(logId)).thenReturn(Optional.of(existingIncident));

        // The payload the client will send
        StatusUpdateDto payload = new StatusUpdateDto(AlertStatus.RESOLVED);

        // Act & Assert: Call the PATCH endpoint
        mockMvc.perform(patch("/api/v1/incidents/" + logId + "/status")
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonMapper.writeValueAsString(payload)))
                .andExpect(status().isOk());

        // Verify that the incident's status was changed and saved back to the database
        assertEquals(AlertStatus.RESOLVED, existingIncident.getStatus());
        verify(statusRepository).save(existingIncident);
    }

    @Test
    void whenPatchUnknownIncident_thenReturns404() throws Exception {
        // Arrange: Simulate the database not finding the logId
        UUID unknownLogId = UUID.randomUUID();
        when(statusRepository.findById(unknownLogId)).thenReturn(Optional.empty());

        StatusUpdateDto payload = new StatusUpdateDto(AlertStatus.RESOLVED);

        // Act & Assert: Should return a 404 Not Found error
        mockMvc.perform(patch("/api/v1/incidents/" + unknownLogId + "/status")
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonMapper.writeValueAsString(payload)))
                .andExpect(status().isNotFound());
    }
}
