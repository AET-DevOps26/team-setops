package org.devpulse.alerts.engine.strategies;

import org.devpulse.alerts.dto.SystemAlertDto;
import org.devpulse.alerts.engine.AlertAction;
import org.devpulse.alerts.engine.AlertStrategy;
import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * Routes alerts based on their severity level.
 *
 * <ul>
 *   <li>CRITICAL → ESCALATE</li>
 *   <li>ERROR    → NOTIFY</li>
 *   <li>WARNING  → LOG</li>
 *   <li>INFO / unknown → no match (defers to other strategies)</li>
 * </ul>
 */
@Component
public class SeverityStrategy implements AlertStrategy {

    @Override
    public String name() {
        return "SeverityStrategy";
    }

    @Override
    public Optional<StrategyMatch> evaluate(SystemAlertDto alert) {
        if (alert.severity() == null) {
            return Optional.empty();
        }

        return switch (alert.severity().toUpperCase()) {
            case "CRITICAL" -> Optional.of(new StrategyMatch(
                    AlertAction.ESCALATE,
                    "Severity is CRITICAL — immediate escalation required"
            ));
            case "ERROR" -> Optional.of(new StrategyMatch(
                    AlertAction.NOTIFY,
                    "Severity is ERROR — team notification triggered"
            ));
            case "WARNING" -> Optional.of(new StrategyMatch(
                    AlertAction.LOG,
                    "Severity is WARNING — logged for review"
            ));
            default -> Optional.empty();
        };
    }
}
