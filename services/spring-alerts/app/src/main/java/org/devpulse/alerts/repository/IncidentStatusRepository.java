package org.devpulse.alerts.repository;

import java.util.List;
import java.util.UUID;

import org.devpulse.alerts.entity.AlertStatus;
import org.devpulse.alerts.entity.IncidentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface IncidentStatusRepository extends JpaRepository<IncidentStatus, UUID> {

    List<IncidentStatus> findByStatus(AlertStatus status);
}

