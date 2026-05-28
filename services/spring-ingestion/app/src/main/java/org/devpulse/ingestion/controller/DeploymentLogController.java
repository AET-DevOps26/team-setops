package org.devpulse.ingestion.controller;

import org.devpulse.ingestion.dto.IncomingLogEventDto;
import org.devpulse.ingestion.service.EventPublisherService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/logs/deployment")
public class DeploymentLogController {

    private static final Logger log = LoggerFactory.getLogger(DeploymentLogController.class);
    private final EventPublisherService eventPublisherService;

    public DeploymentLogController(EventPublisherService eventPublisherService) {
        this.eventPublisherService = eventPublisherService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.ACCEPTED)
    public void ingestDeploymentLog(@Valid @RequestBody IncomingLogEventDto payload) {
        log.info("Received deployment log for service: {}", payload.serviceName());
        eventPublisherService.publishDeploymentLog(payload);
    }
}
