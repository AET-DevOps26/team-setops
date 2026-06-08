package org.devpulse.ingestion.controller;

import org.devpulse.ingestion.dto.SystemAlertDto;
import org.devpulse.ingestion.service.EventPublisherService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/alerts/system")
public class SystemAlertController {

    private static final Logger log = LoggerFactory.getLogger(SystemAlertController.class);
    private final EventPublisherService eventPublisherService;

    public SystemAlertController(EventPublisherService eventPublisherService) {
        this.eventPublisherService = eventPublisherService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.ACCEPTED)
    public void ingestSystemAlert(@Valid @RequestBody SystemAlertDto payload) {
        log.info("Received system alert from source: {} with severity: {}", payload.source(), payload.severity());
        eventPublisherService.publishSystemAlert(payload);
    }
}