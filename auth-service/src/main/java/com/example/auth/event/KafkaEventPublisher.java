package com.example.auth.event;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class KafkaEventPublisher implements EventPublisher {

    @Override
    public <T> void publish(
            String topic,
            String key,
            EventEnvelope<T> event
    ) {
        log.info(
                "Event published | topic={} | key={} | eventId={} | eventType={} | eventVersion={} | occurredAt={} | payload={}",
                topic,
                key,
                event.eventId(),
                event.eventType(),
                event.eventVersion(),
                event.occurredAt(),
                event.payload()
        );
    }


}