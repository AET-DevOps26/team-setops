package org.devpulse.alerts.controller;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.devpulse.alerts.dto.StatusUpdateDto;
import org.devpulse.alerts.entity.IncidentStatus;
import org.devpulse.alerts.repository.IncidentStatusRepository;
import org.devpulse.alerts.type.AlertStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/incidents")
@CrossOrigin(origins = "*")
public class IncidentController {

    private static final Logger log = LoggerFactory.getLogger(IncidentController.class);
    private final IncidentStatusRepository statusRepository;

    public IncidentController(IncidentStatusRepository statusRepository) {
        this.statusRepository = statusRepository;
    }

    @GetMapping
    public ResponseEntity<List<IncidentStatus>> getIncidentStatuses(
            @RequestParam(required = false, defaultValue = "ACTIVE") AlertStatus status) {

        List<IncidentStatus> incidents = statusRepository.findByStatus(status);
        return ResponseEntity.ok(incidents);
    }

    // Now uses the UUID logId instead of the Long id!
    @PatchMapping("/{logId}/status")
    public ResponseEntity<Void> updateStatus(
            @PathVariable UUID logId,
            @RequestBody StatusUpdateDto payload) {

        Optional<IncidentStatus> statusOpt = statusRepository.findById(logId);

        if (statusOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        IncidentStatus incidentStatus = statusOpt.get();
        incidentStatus.setStatus(payload.status());
        statusRepository.save(incidentStatus);

        log.info("Updated incident [{}] status to {}", logId, incidentStatus.getStatus());
        return ResponseEntity.ok().build();
    }
}
