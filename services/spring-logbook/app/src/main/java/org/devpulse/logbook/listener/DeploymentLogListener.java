package org.devpulse.logbook.listener;

import java.util.UUID;

import org.devpulse.logbook.dto.IncomingLogMessageDto;
import org.devpulse.logbook.dto.LogPayloadDto;
import org.devpulse.logbook.entity.DeploymentLog;
import org.devpulse.logbook.repository.DeploymentLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class DeploymentLogListener {

    private static final Logger log = LoggerFactory.getLogger(DeploymentLogListener.class);
    private final DeploymentLogRepository logRepository;

    public DeploymentLogListener(DeploymentLogRepository logRepository) {
        this.logRepository = logRepository;
    }

    @RabbitListener(queues = "${devpulse.rabbitmq.queue.deployment-logs}")
    public void handleDeploymentLog(IncomingLogMessageDto message) {
        // Unwrap the envelope!
        LogPayloadDto payload = message.payload();

        log.info("Received deployment log [{}] from service '{}' [severity={}, type={}]",
                message.logId(), payload.serviceName(), payload.severity(), payload.type());

        saveLogToDatabase(message.logId(), message.payload());
    }

    private void saveLogToDatabase(UUID logId, LogPayloadDto payload) {
        DeploymentLog logEntity = new DeploymentLog(
                logId, // Pass the UUID here!
                payload.serviceName(),
                payload.type() != null ? payload.type().name() : "UNKNOWN",
                payload.severity() != null ? payload.severity().name() : "UNKNOWN",
                payload.logContent(),
                payload.timestamp()
        );
        logRepository.save(logEntity);
        log.info("Successfully persisted log [{}] for '{}' to PostgreSQL.", logId, payload.serviceName());
    }
}
