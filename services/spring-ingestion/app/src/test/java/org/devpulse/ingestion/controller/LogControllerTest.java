package org.devpulse.ingestion.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.devpulse.ingestion.dto.IncomingLogEventDto;
import org.devpulse.ingestion.service.EventPublisherService;
import org.devpulse.ingestion.type.LogType;
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

@WebMvcTest(LogController.class)
public class LogControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private EventPublisherService eventPublisherService;

    @Test
    void whenValidInput_thenReturns202() throws Exception {
        IncomingLogEventDto validPayload = new IncomingLogEventDto(
                "auth-service",
                "Successfully deployed to production",
                Instant.now(),
                Severity.INFO,
                LogType.DEPLOYMENT_LOG,
                Map.of("region", "eu-central-1")
        );

        mockMvc.perform(post("/api/v1/logs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validPayload)))
                .andExpect(status().isAccepted());

        verify(eventPublisherService).publishLog(any(IncomingLogEventDto.class));
    }

    @Test
    void whenBlankServiceName_thenReturnsValidationFailure() throws Exception {
        // serviceName is blank, which violates @NotBlank
        IncomingLogEventDto invalidPayload = new IncomingLogEventDto(
                "",
                "Some logs",
                Instant.now(),
                Severity.INFO,
                LogType.DEPLOYMENT_LOG,
                null
        );

        mockMvc.perform(post("/api/v1/logs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidPayload)))
                .andExpect(status().isUnprocessableEntity()); // Note: Adjust to isBadRequest() if you change to 400
    }
}