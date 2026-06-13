package org.devpulse.alerts.controller;

import org.devpulse.alerts.dto.StatusUpdateDto;
import org.devpulse.alerts.entity.SystemAlert;
import org.devpulse.alerts.repository.SystemAlertRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/alerts")
@CrossOrigin(origins = "*") // Allows the React frontend (running on port 3000) to call this API without CORS errors
public class AlertController {

    private static final Logger log = LoggerFactory.getLogger(AlertController.class);
    
    private final SystemAlertRepository alertRepository;

    public AlertController(SystemAlertRepository alertRepository) {
        this.alertRepository = alertRepository;
    }

    /**
     * Called by the React Client to display the dashboard.
     * Example: GET /api/v1/alerts?status=ACTIVE
     */
    @GetMapping
    public ResponseEntity<List<SystemAlert>> getAlerts(
            @RequestParam(required = false, defaultValue = "ACTIVE") String status) {
        
        log.info("Fetching alerts with status: {}", status);
        List<SystemAlert> alerts = alertRepository.findByStatus(status.toUpperCase());
        return ResponseEntity.ok(alerts);
    }

    /**
     * Called by the React Client when a developer acknowledges or resolves an incident.
     * Example: PATCH /api/v1/alerts/1/status
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<Void> updateAlertStatus(
            @PathVariable Long id,
            @RequestBody StatusUpdateDto payload) {
        
        log.info("Updating status of alert ID {} to {}", id, payload.status());

        Optional<SystemAlert> alertOpt = alertRepository.findById(id);

        if (alertOpt.isEmpty()) {
            log.warn("Alert ID {} not found", id);
            return ResponseEntity.notFound().build();
        }

        SystemAlert alert = alertOpt.get();
        alert.setStatus(payload.status().toUpperCase());
        alertRepository.save(alert);

        return ResponseEntity.ok().build();
    }
}