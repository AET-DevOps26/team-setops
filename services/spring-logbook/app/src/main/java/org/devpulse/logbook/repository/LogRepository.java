package org.devpulse.logbook.repository;

import java.util.List;
import java.util.UUID;

import org.devpulse.logbook.entity.Log;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LogRepository extends JpaRepository<Log, UUID> {

    List<Log> findAllByOrderByTimestampDesc();
}
