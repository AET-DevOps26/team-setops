package org.devpulse.alerts.engine.strategies;

import java.util.Optional;

import org.devpulse.alerts.dto.LogPayloadDto;
import org.devpulse.alerts.engine.AlertAction;
import org.devpulse.alerts.engine.AlertStrategy;
import org.springframework.stereotype.Component;

@Component
public class SeverityStrategy implements AlertStrategy {

    @Override
    public String name() {
        return "SeverityStrategy";
    }

    @Override
    public Optional<StrategyMatch> evaluate(LogPayloadDto log) {
        if (log.severity() == null) {
            return Optional.empty();
        }

        return switch (log.severity().toUpperCase()) {
            case "CRITICAL", "FATAL" ->
                Optional.of(new StrategyMatch(AlertAction.ESCALATE, "Severity is " + log.severity()));
            case "ERROR" ->
                Optional.of(new StrategyMatch(AlertAction.NOTIFY, "Severity is ERROR"));
            case "WARNING" ->
                Optional.of(new StrategyMatch(AlertAction.LOG, "Severity is WARNING"));
            default ->
                Optional.empty();
        };
    }
}
