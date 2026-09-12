package com.example.auth.event;

public interface EventPublisher {

    <T> void publish(
            String topic,
            String key,
            EventEnvelope<T> event
    );
}