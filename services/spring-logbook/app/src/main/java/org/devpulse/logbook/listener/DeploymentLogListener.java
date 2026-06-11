package org.devpulse.logbook.listener;

import org.devpulse.logbook.dto.DeploymentLogDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class DeploymentLogListener {

    private static final Logger log = LoggerFactory.getLogger(DeploymentLogListener.class);

    @RabbitListener(queues = "${devpulse.rabbitmq.queue.deployment-logs}")
    public void handleDeploymentLog(DeploymentLogDto dto) {
        log.info("Received deployment log from service '{}' [severity={}, type={}]",
                dto.serviceName(), dto.severity(), dto.type());
        log.debug("Log content: {}", dto.logContent());
    }
}
