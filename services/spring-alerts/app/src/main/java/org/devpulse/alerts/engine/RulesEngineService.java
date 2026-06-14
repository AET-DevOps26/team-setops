package org.devpulse.alerts.engine;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.devpulse.alerts.dto.LogPayloadDto;
import org.springframework.stereotype.Service;

@Service
public class RulesEngineService {

    private final List<AlertStrategy> strategies;

    public RulesEngineService(List<AlertStrategy> strategies) {
        this.strategies = strategies;
    }

    public EvaluationResult evaluate(LogPayloadDto log) {
        List<String> triggeredBy = new ArrayList<>();
        List<String> details = new ArrayList<>();
        AlertAction highestAction = AlertAction.IGNORE;

        for (AlertStrategy strategy : strategies) {
            Optional<AlertStrategy.StrategyMatch> matchOpt = strategy.evaluate(log);

            if (matchOpt.isPresent()) {
                AlertStrategy.StrategyMatch match = matchOpt.get();
                triggeredBy.add(strategy.name());
                details.add(match.detail());

                // If this strategy suggests a more severe action, upgrade the overall action
                // (relies on the Enum ordinal: ESCALATE(0) < NOTIFY(1) < LOG(2) < IGNORE(3))
                if (match.action().compareTo(highestAction) < 0) {
                    highestAction = match.action();
                }
            }
        }

        return new EvaluationResult(highestAction, triggeredBy, details);
    }
}
