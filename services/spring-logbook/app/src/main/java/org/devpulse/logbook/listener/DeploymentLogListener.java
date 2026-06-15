package org.devpulse.logbook.listener;

import org.devpulse.logbook.dto.IncomingLogMessageDto;
import org.devpulse.logbook.dto.LogPayloadDto;
import org.devpulse.logbook.service.LogService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class DeploymentLogListener {

    private static final Logger log = LoggerFactory.getLogger(DeploymentLogListener.class);
    private final LogService deploymentLogService;

    public DeploymentLogListener(LogService deploymentLogService) {
        this.deploymentLogService = deploymentLogService;
    }

    @RabbitListener(queues = "${devpulse.rabbitmq.queue.deployment-logs}")
    public void handleDeploymentLog(IncomingLogMessageDto message) {
        // Unwrap the envelope!
        LogPayloadDto payload = message.payload();

        log.info("Received deployment log [{}] from service '{}' [severity={}, type={}]",
                message.logId(), payload.serviceName(), payload.severity(), payload.type());

        deploymentLogService.saveLog(message.logId(), message.payload());
    }
}
