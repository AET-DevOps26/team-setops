package org.devpulse.alerts.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "system_alerts")
public class SystemAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String alertId; // The original ID from Prometheus/Datadog

    @Column(nullable = false)
    private String source;

    @Column(nullable = false)
    private String severity;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private Instant timestamp;

    @Column(nullable = false)
    private String status = "ACTIVE"; // Defaults to ACTIVE when first saved

    // JPA requires an empty constructor
    public SystemAlert() {}

    public SystemAlert(String alertId, String source, String severity, String description, Instant timestamp) {
        this.alertId = alertId;
        this.source = source;
        this.severity = severity;
        this.description = description;
        this.timestamp = timestamp;
    }

    // --- Getters and Setters ---

    public Long getId() {
        return id;
    }

    public String getAlertId() {
        return alertId;
    }

    public String getSource() {
        return source;
    }

    public String getSeverity() {
        return severity;
    }

    public String getDescription() {
        return description;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}