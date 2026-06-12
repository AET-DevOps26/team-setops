package org.devpulse.logbook.repository;

import java.util.List;

import org.devpulse.logbook.entity.DeploymentLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DeploymentLogRepository extends JpaRepository<DeploymentLog, Long> {

    List<DeploymentLog> findAllByOrderByTimestampDesc();

}
