package org.devpulse.logbook.listener;

import org.devpulse.logbook.dto.DeploymentLogDto;
import org.devpulse.logbook.entity.DeploymentLog;
import org.devpulse.logbook.repository.DeploymentLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class DeploymentLogListener {

    private static final Logger log = LoggerFactory.getLogger(DeploymentLogListener.class);

    // 1. Inject the database repository
    private final DeploymentLogRepository logRepository;

    public DeploymentLogListener(DeploymentLogRepository logRepository) {
        this.logRepository = logRepository;
    }

    @RabbitListener(queues = "${devpulse.rabbitmq.queue.deployment-logs}")
    public void handleDeploymentLog(DeploymentLogDto dto) {
        log.info("Received deployment log from service '{}' [severity={}, type={}]",
                dto.serviceName(), dto.severity(), dto.type());

        // 2. Save the log to the database
        saveLogToDatabase(dto);
    }

    // 3. Helper method to map the DTO to the Entity and save it
    private void saveLogToDatabase(DeploymentLogDto dto) {
        DeploymentLog logEntity = new DeploymentLog(
                dto.serviceName(),
                dto.logContent(),
                dto.severity().name(),
                dto.type().name(),
                dto.timestamp(),
                "ACTIVE"
        );
        logRepository.save(logEntity);
        log.info("Successfully persisted log for '{}' to PostgreSQL.", dto.serviceName());
    }
}
