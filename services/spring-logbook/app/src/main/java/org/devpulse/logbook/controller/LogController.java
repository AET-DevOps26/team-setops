package org.devpulse.logbook.controller;

import org.devpulse.logbook.entity.DeploymentLog;
import org.devpulse.logbook.repository.DeploymentLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/logs")
@CrossOrigin(origins = "*") // Allows the React frontend to call this without CORS issues
public class LogController {

    private static final Logger log = LoggerFactory.getLogger(LogController.class);
    private final DeploymentLogRepository logRepository;

    public LogController(DeploymentLogRepository logRepository) {
        this.logRepository = logRepository;
    }

    /**
     * Called by the React Client to display the historical deployment timeline.
     * Example: GET /api/v1/logs
     */
    @GetMapping
    public ResponseEntity<List<DeploymentLog>> getDeploymentHistory() {
        log.info("Client requested deployment history timeline.");

        // Fetch all logs, newest first
        List<DeploymentLog> logs = logRepository.findAllByOrderByTimestampDesc();

        return ResponseEntity.ok(logs);
    }
}
