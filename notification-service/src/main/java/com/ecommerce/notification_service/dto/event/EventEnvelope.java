package com.ecommerce.notification_service.dto.event;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.Instant;
import java.util.UUID;

@JsonIgnoreProperties(ignoreUnknown = true)
public record EventEnvelope<T>(
        UUID eventId,
        String eventType,
        int eventVersion,
        Instant occurredAt,
        T payload
) {
    public static <T> EventEnvelope<T> of(String eventType, T payload) {
        return new EventEnvelope<>(UUID.randomUUID(), eventType, 1, Instant.now(), payload);
    }
}
