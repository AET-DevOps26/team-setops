package org.devpulse.ingestion.service;

import org.devpulse.ingestion.dto.IncomingLogEventDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class EventPublisherService {

    private static final Logger log = LoggerFactory.getLogger(EventPublisherService.class);
    private final RabbitTemplate rabbitTemplate;

    @Value("${devpulse.rabbitmq.exchange}")
    private String exchangeName;

    @Value("${devpulse.rabbitmq.routing.deployment-log}")
    private String deploymentLogRoutingKey;

    public EventPublisherService(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void publishDeploymentLog(IncomingLogEventDto payload) {
        log.debug("Publishing log for {} to exchange {}", payload.serviceName(), exchangeName);
        rabbitTemplate.convertAndSend(exchangeName, deploymentLogRoutingKey, payload);
        log.info("Successfully published deployment log for commit: {}", payload.commitHash());
    }
}