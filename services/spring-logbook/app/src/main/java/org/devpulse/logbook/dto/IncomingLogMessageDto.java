package org.devpulse.logbook.dto;

import java.util.UUID;

public record IncomingLogMessageDto(
        UUID logId,
        LogPayloadDto payload
        ) {

}
