package org.devpulse.alerts.listener;

import java.util.UUID;

import org.devpulse.alerts.dto.IncomingLogMessageDto;
import org.devpulse.alerts.dto.LogPayloadDto;
import org.devpulse.alerts.engine.AlertAction;
import org.devpulse.alerts.engine.EvaluationResult;
import org.devpulse.alerts.engine.RulesEngineService;
import org.devpulse.alerts.entity.IncidentStatus;
import org.devpulse.alerts.repository.IncidentStatusRepository;
import org.devpulse.alerts.type.AlertStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class SystemAlertListener {

    private static final Logger log = LoggerFactory.getLogger(SystemAlertListener.class);
    private final RulesEngineService rulesEngine;
    private final IncidentStatusRepository statusRepository;

    public SystemAlertListener(RulesEngineService rulesEngine, IncidentStatusRepository statusRepository) {
        this.rulesEngine = rulesEngine;
        this.statusRepository = statusRepository;
    }

    @RabbitListener(queues = "${devpulse.rabbitmq.queue.system-alert}")
    public void handleLogEvent(IncomingLogMessageDto message) {
        LogPayloadDto payload = message.payload();

        // 1. Evaluate EVERY incoming log using the rules engine
        EvaluationResult result = rulesEngine.evaluate(payload);

        // 2. Determine the initial status based on the engine's action
        AlertStatus initialStatus = (result.action() == AlertAction.ESCALATE || result.action() == AlertAction.NOTIFY)
                ? AlertStatus.ACTIVE
                : AlertStatus.IGNORED;

        // 3. Save EVERYTHING to the database
        saveStatusToDatabase(message.logId(), initialStatus);

        // 4. Act on the evaluation (logging exactly what happened)
        switch (result.action()) {
            case ESCALATE ->
                log.warn("🚨 ESCALATE incident [{}] — triggered by: {}", message.logId(), result.triggeredBy());
            case NOTIFY ->
                log.info("🔔 NOTIFY for incident [{}] — triggered by: {}", message.logId(), result.triggeredBy());
            case LOG ->
                log.debug("📝 LOG routine event [{}] — status saved as IGNORED", message.logId());
            case IGNORE ->
                log.debug("⏭️ IGNORE routine event [{}] — status saved as IGNORED", message.logId());
        }
    }

    // Updated to accept the target status
    private void saveStatusToDatabase(UUID logId, AlertStatus status) {
        if (!statusRepository.existsById(logId)) {
            IncidentStatus trackingState = new IncidentStatus(logId);
            trackingState.setStatus(status); // Override the "ACTIVE" default

            statusRepository.save(trackingState);
            log.info("Successfully persisted tracking status for incident [{}] as [{}]", logId, status);
        }
    }
}
