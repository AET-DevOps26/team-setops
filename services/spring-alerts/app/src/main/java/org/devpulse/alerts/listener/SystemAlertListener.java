package org.devpulse.alerts.listener;

import org.devpulse.alerts.dto.SystemAlertDto;
import org.devpulse.alerts.engine.EvaluationResult;
import org.devpulse.alerts.engine.RulesEngineService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class SystemAlertListener {

    private static final Logger log = LoggerFactory.getLogger(SystemAlertListener.class);

    private final RulesEngineService rulesEngine;

    public SystemAlertListener(RulesEngineService rulesEngine) {
        this.rulesEngine = rulesEngine;
    }

    @RabbitListener(queues = "${devpulse.rabbitmq.queue.system-alert}")
    public void handleSystemAlert(SystemAlertDto alert) {
        log.info("Received system alert [{}] from {} with severity: {}",
                alert.alertId(), alert.source(), alert.severity());

        EvaluationResult result = rulesEngine.evaluate(alert);

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
}
