package org.devpulse.logbook.listener;

import org.devpulse.logbook.dto.IncomingLogMessageDto;
import org.devpulse.logbook.dto.LogPayloadDto;
import org.devpulse.logbook.service.LogService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class LogListener {

    private static final Logger logger = LoggerFactory.getLogger(LogListener.class);
    private final LogService logService;

    public LogListener(LogService logService) {
        this.logService = logService;
    }

    @RabbitListener(queues = "${devpulse.rabbitmq.queue.deployment-logs}")
    public void handleDeploymentLog(IncomingLogMessageDto message) {
        // Unwrap the envelope!
        LogPayloadDto payload = message.payload();

        logger.info("Received deployment log [{}] from service '{}' [severity={}, type={}]",
                message.logId(), payload.serviceName(), payload.severity(), payload.type());

        logService.saveLog(message.logId(), message.payload());
    }
}
