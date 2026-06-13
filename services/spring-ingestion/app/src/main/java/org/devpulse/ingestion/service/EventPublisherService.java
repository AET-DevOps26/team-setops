package org.devpulse.ingestion.service;

import java.util.UUID;

import org.devpulse.ingestion.dto.IncomingLogEventDto;
import org.devpulse.ingestion.dto.OutgoingLogEventDto;
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

    public void publishLog(IncomingLogEventDto incomingPayload) {
        OutgoingLogEventDto outgoingLogEventDto = new OutgoingLogEventDto(
                UUID.randomUUID(),
                incomingPayload);

        publishLogToLogbook(outgoingLogEventDto);
        publishLogToAlerts(outgoingLogEventDto);
    }

    private void publishLogToLogbook(OutgoingLogEventDto outgoingPayload) {
        log.debug("Publishing log for {} to exchange {} to logbook", outgoingPayload.payload().serviceName(), exchangeName);
        rabbitTemplate.convertAndSend(exchangeName, deploymentLogRoutingKey, outgoingPayload);
        log.info("Successfully published log for service to logbook: {}", outgoingPayload.payload().serviceName());
    }

    private void publishLogToAlerts(OutgoingLogEventDto outgoingPayload) {
        log.debug("Publishing log {} from {} to exchange {} to alerts", outgoingPayload.payload().serviceName(), exchangeName);
        rabbitTemplate.convertAndSend(exchangeName, systemAlertRoutingKey, outgoingPayload);
        log.info("Successfully published log for service to alerts: {}", outgoingPayload.payload().serviceName());
    }
}
