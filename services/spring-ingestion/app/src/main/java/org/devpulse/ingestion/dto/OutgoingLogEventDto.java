package org.devpulse.ingestion.dto;

import java.util.UUID;

public record OutgoingLogEventDto(
        UUID logId,
        IncomingLogEventDto payload) {

}
