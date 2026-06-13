package org.devpulse.alerts.engine;

import java.util.List;

/**
 * The result of running the rules engine against an incoming alert.
 *
 * @param action       the highest-priority action recommended
 * @param triggeredBy  names of the rules that fired
 * @param details      human-readable explanation of each triggered rule
 */
public record EvaluationResult(
        AlertAction action,
        List<String> triggeredBy,
        List<String> details
) {
    public static EvaluationResult ignored() {
        return new EvaluationResult(AlertAction.IGNORE, List.of(), List.of("No rules matched"));
    }
}
