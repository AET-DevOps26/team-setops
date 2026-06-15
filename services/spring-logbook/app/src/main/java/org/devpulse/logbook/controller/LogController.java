package org.devpulse.logbook.controller;

import java.util.List;

import org.devpulse.logbook.entity.DeploymentLog;
import org.devpulse.logbook.service.LogService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/logs")
@CrossOrigin(origins = "*") // Allows the React frontend to call this without CORS issues
public class LogController {

    private static final Logger logger = LoggerFactory.getLogger(LogController.class);
    private final LogService deploymentLogService;

    public LogController(LogService deploymentLogService) {
        this.deploymentLogService = deploymentLogService;
    }

    /**
     * Called by the React Client to display the historical deployment timeline.
     * Example: GET /api/v1/logs
     */
    @GetMapping
    public ResponseEntity<List<DeploymentLog>> getDeploymentHistory() {
        logger.info("Client requested deployment history timeline.");

        List<DeploymentLog> logs = deploymentLogService.getDeploymentHistory();

        return ResponseEntity.ok(logs);
    }
}
