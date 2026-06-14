package org.devpulse.alerts.engine;

/**
 * Actions that the rules engine can recommend for an incoming alert.
 */
public enum AlertAction {
    /** Immediately escalate — requires urgent attention. */
    ESCALATE,
    /** Send a notification to the relevant team. */
    NOTIFY,
    /** Log for auditing only, no action needed. */
    LOG,
    /** Ignore — does not meet any rule thresholds. */
    IGNORE
}
