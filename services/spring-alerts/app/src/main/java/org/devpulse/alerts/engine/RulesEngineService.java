package org.devpulse.alerts.engine;

import org.devpulse.alerts.dto.SystemAlertDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * Evaluates an incoming alert against all registered {@link AlertStrategy} beans.
 *
 * <p>Each strategy is evaluated independently. The engine collects all matches and
 * returns a single {@link EvaluationResult} whose action is the highest-priority
 * one across all triggered strategies (ESCALATE > NOTIFY > LOG > IGNORE).
 */
@Service
public class RulesEngineService {

    private static final Logger log = LoggerFactory.getLogger(RulesEngineService.class);

    private final List<AlertStrategy> strategies;

    public RulesEngineService(List<AlertStrategy> strategies) {
        this.strategies = strategies;
        log.info("Rules engine initialized with {} strategy(ies): {}",
                strategies.size(), strategies.stream().map(AlertStrategy::name).toList());
    }

    /**
     * Run all strategies against the given alert and return the combined result.
     */
    public EvaluationResult evaluate(SystemAlertDto alert) {
        List<String> triggeredNames = new ArrayList<>();
        List<String> details = new ArrayList<>();
        AlertAction highestAction = null;

        for (AlertStrategy strategy : strategies) {
            var matchOpt = strategy.evaluate(alert);
            if (matchOpt.isPresent()) {
                var match = matchOpt.get();
                triggeredNames.add(strategy.name());
                details.add(match.detail());

                if (highestAction == null || match.action().ordinal() < highestAction.ordinal()) {
                    highestAction = match.action();
                }
            }
        }

        if (highestAction == null) {
            return EvaluationResult.ignored();
        }

        return new EvaluationResult(highestAction, triggeredNames, details);
    }
}
