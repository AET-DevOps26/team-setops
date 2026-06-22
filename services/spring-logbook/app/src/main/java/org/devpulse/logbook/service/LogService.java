package org.devpulse.logbook.service;

import java.util.List;
import java.util.UUID;

import org.devpulse.logbook.dto.LogPayloadDto;
import org.devpulse.logbook.entity.Log;
import org.devpulse.logbook.repository.LogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class LogService {

    private static final Logger logger = LoggerFactory.getLogger(LogService.class);
    private final LogRepository logRepository;

    public LogService(LogRepository logRepository) {
        this.logRepository = logRepository;
    }

    /**
     * Returns all deployment logs ordered by timestamp descending (newest
     * first).
     */
    public List<Log> getDeploymentHistory() {
        return logRepository.findAllByOrderByTimestampDesc();
    }

    /**
     * Returns all deployment logs matching the given list of IDs.
     */
    public List<Log> getLogsByIds(List<UUID> ids) {
        return logRepository.findAllById(ids);
    }

    /**
     * Persists an incoming log message to the database.
     */
    public Log saveLog(UUID logId, LogPayloadDto payload) {
        Log logEntity = new Log(
                logId,
                payload.serviceName(),
                payload.type() != null ? payload.type().name() : "UNKNOWN",
                payload.severity() != null ? payload.severity().name() : "UNKNOWN",
                payload.logContent(),
                payload.timestamp()
        );
        Log saved = logRepository.save(logEntity);
        logger.info("Successfully persisted log [{}] for '{}' to PostgreSQL.", logId, payload.serviceName());
        return saved;
    }
}
