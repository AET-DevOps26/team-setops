package org.devpulse.alerts.repository;

import org.devpulse.alerts.entity.SystemAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SystemAlertRepository extends JpaRepository<SystemAlert, Long> {
    
    Optional<SystemAlert> findByAlertId(String alertId);
    
    // Add this line to fetch alerts by their current status
    List<SystemAlert> findByStatus(String status);
}