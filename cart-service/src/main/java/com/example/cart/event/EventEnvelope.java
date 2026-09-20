package com.example.cart.event;

import java.time.Instant;
import java.util.UUID;

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
