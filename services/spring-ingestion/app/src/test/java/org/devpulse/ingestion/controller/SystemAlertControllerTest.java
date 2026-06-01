package org.devpulse.ingestion.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.devpulse.ingestion.dto.SystemAlertDto;
import org.devpulse.ingestion.service.EventPublisherService;
import org.devpulse.ingestion.type.Severity;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(SystemAlertController.class)
public class SystemAlertControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private EventPublisherService eventPublisherService;

    @Test
    void whenValidAlert_thenReturns202() throws Exception {
        SystemAlertDto validAlert = new SystemAlertDto(
                "alert-123",
                "Prometheus",
                Severity.CRITICAL,
                "High CPU Usage",
                Instant.now(),
                Map.of("cpu", 95.5)
        );

        mockMvc.perform(post("/api/v1/alerts/system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validAlert)))
                .andExpect(status().isAccepted());

        verify(eventPublisherService).publishSystemAlert(any(SystemAlertDto.class));
    }

    @Test
    void whenMissingSource_thenReturns422() throws Exception {
        // Missing source field
        SystemAlertDto invalidAlert = new SystemAlertDto(
                "alert-123",
                "",
                Severity.CRITICAL,
                "High CPU Usage",
                Instant.now(),
                null
        );

        mockMvc.perform(post("/api/v1/alerts/system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidAlert)))
                .andExpect(status().isUnprocessableEntity());
    }
}