package org.devpulse.alerts.listener;

import org.devpulse.alerts.dto.SystemAlertDto;
import org.devpulse.alerts.engine.EvaluationResult;
import org.devpulse.alerts.engine.RulesEngineService;
import org.devpulse.alerts.entity.SystemAlert;
import org.devpulse.alerts.repository.SystemAlertRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class SystemAlertListener {

    private static final Logger log = LoggerFactory.getLogger(SystemAlertListener.class);

    private final RulesEngineService rulesEngine;
    
    // 1. Add the database repository
    private final SystemAlertRepository alertRepository;

    public SystemAlertListener(RulesEngineService rulesEngine, SystemAlertRepository alertRepository) {
        this.rulesEngine = rulesEngine;
        this.alertRepository = alertRepository;
    }

    @RabbitListener(queues = "${devpulse.rabbitmq.queue.system-alert}")
    public void handleSystemAlert(SystemAlertDto dto) {
        log.info("Received system alert [{}] from {} with severity: {}",
                dto.alertId(), dto.source(), dto.severity());

        EvaluationResult result = rulesEngine.evaluate(dto);

        // 2. Save the alert to the database
        saveAlertToDatabase(dto);

        switch (result.action()) {
case ESCALATE -> {
                log.warn("🚨 ESCALATE alert [{}] — triggered by: {} | details: {}",
                        alert.alertId(), result.triggeredBy(), result.details());
                // TODO: Persist alert to database with ESCALATED status
                // TODO: Send urgent notification (e.g. PagerDuty, Slack #incidents channel)
                // TODO: Trigger incident creation in external incident management system
            }
            case NOTIFY -> {
                log.info("🔔 NOTIFY for alert [{}] — triggered by: {} | details: {}",
                        alert.alertId(), result.triggeredBy(), result.details());
                // TODO: Persist alert to database with NOTIFIED status
                // TODO: Send team notification (e.g. Slack, email, Microsoft Teams webhook)
            }
            case LOG -> {
                log.info("📝 LOG alert [{}] — triggered by: {} | details: {}",
                        alert.alertId(), result.triggeredBy(), result.details());
                // TODO: Persist alert to database with LOGGED status for auditing
            }
            case IGNORE -> {
                log.debug("⏭️ IGNORE alert [{}] — no strategies matched", alert.alertId());
                // TODO: Optionally persist to database with IGNORED status for traceability
            }
        }
    }

    // 3. Helper method to map the DTO to the Entity and save it
    private void saveAlertToDatabase(SystemAlertDto dto) {
        // Prevent saving duplicates if the same alert fires twice
        if (alertRepository.findByAlertId(dto.alertId()).isEmpty()) {
            SystemAlert alert = new SystemAlert(
                    dto.alertId(),
                    dto.source(),
                    dto.severity(),
                    dto.description(),
                    dto.timestamp()
            );
            // Remember: The SystemAlert constructor defaults the status to "ACTIVE"
            alertRepository.save(alert);
            log.info("Successfully saved alert [{}] to PostgreSQL.", dto.alertId());
        }
    }
}