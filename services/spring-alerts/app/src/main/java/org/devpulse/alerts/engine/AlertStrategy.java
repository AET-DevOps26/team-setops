package org.devpulse.alerts.engine;

import org.devpulse.alerts.dto.SystemAlertDto;

import java.util.Optional;

/**
 * A single evaluation strategy. Implementations inspect the incoming alert
 * and optionally return a {@link StrategyMatch} if the strategy fires.
 */
public interface AlertStrategy {

    /**
     * @return a short identifier for this strategy (e.g. "SeverityStrategy")
     */
    String name();

    /**
     * Evaluate the alert against this strategy.
     *
     * @return a match if the strategy fires, or empty if it does not apply
     */
    Optional<StrategyMatch> evaluate(SystemAlertDto alert);

    /**
     * A match produced when a strategy fires.
     *
     * @param action  the action this strategy recommends
     * @param detail  human-readable explanation
     */
    record StrategyMatch(AlertAction action, String detail) {}
}
