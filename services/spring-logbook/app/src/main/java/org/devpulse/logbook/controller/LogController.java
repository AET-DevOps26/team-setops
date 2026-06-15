package org.devpulse.logbook.controller;

import java.util.List;
import java.util.UUID;

import org.devpulse.logbook.entity.DeploymentLog;
import org.devpulse.logbook.service.LogService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/logs")
@CrossOrigin(origins = "*") // Allows the React frontend to call this without CORS issues
public class LogController {

    private static final Logger logger = LoggerFactory.getLogger(LogController.class);
    private final LogService logService;

    public LogController(LogService logService) {
        this.logService = logService;
    }

    /**
     * Called by the React Client to display the historical deployment timeline.
     * Example: GET /api/v1/logs
     */
    @GetMapping
    public ResponseEntity<List<DeploymentLog>> getDeploymentHistory() {
        logger.info("Client requested deployment history timeline.");

        List<DeploymentLog> logs = logService.getDeploymentHistory();

        return ResponseEntity.ok(logs);
    }

    /**
     * Returns deployment logs matching the given list of IDs. Example: GET
     * /api/v1/logs/search?ids=uuid-1,uuid-2&...
     */
    @GetMapping("/search")
    public ResponseEntity<List<DeploymentLog>> getLogsByIds(@RequestParam List<UUID> ids) {
        logger.info("Client requested {} log(s) by ID.", ids.size());

        List<DeploymentLog> logs = logService.getLogsByIds(ids);

        return ResponseEntity.ok(logs);
    }
}
