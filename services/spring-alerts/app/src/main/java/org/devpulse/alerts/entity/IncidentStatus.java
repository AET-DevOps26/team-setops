package org.devpulse.alerts.entity;

import java.util.UUID;

import org.devpulse.alerts.type.AlertStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "incident_status")
public class IncidentStatus {

    @Id
    private UUID logId; // We use the incoming UUID as the primary key!

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AlertStatus status = AlertStatus.ACTIVE; // Defaults to ACTIVE

    // Empty constructor required by JPA
    public IncidentStatus() {
    }

    public IncidentStatus(UUID logId) {
        this.logId = logId;
    }

    // --- Getters and Setters ---
    public UUID getLogId() {
        return logId;
    }

    public AlertStatus getStatus() {
        return status;
    }

    public void setStatus(AlertStatus status) {
        this.status = status;
    }
}
