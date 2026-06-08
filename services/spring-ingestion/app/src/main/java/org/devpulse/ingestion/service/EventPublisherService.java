package org.devpulse.ingestion.service;

import org.devpulse.ingestion.dto.IncomingLogEventDto;
import org.devpulse.ingestion.dto.SystemAlertDto;
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

    @Value("${devpulse.rabbitmq.routing.system-alert}")
    private String systemAlertRoutingKey;

    public EventPublisherService(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void publishLog(IncomingLogEventDto payload) {
        log.debug("Publishing log for {} to exchange {}", payload.serviceName(), exchangeName);
        rabbitTemplate.convertAndSend(exchangeName, deploymentLogRoutingKey, payload);
        log.info("Successfully published deployment log for service: {}", payload.serviceName());
    }

    public void publishSystemAlert(SystemAlertDto payload) {
        log.debug("Publishing alert {} from {} to exchange {}", payload.alertId(), payload.source(), exchangeName);
        rabbitTemplate.convertAndSend(exchangeName, systemAlertRoutingKey, payload);
        log.info("Successfully published system alert: {}", payload.alertId());
    }
}