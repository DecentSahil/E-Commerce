package com.example.auth.event;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class KafkaEventPublisher implements EventPublisher {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Override
    public <T> void publish(
            String topic,
            String key,
            EventEnvelope<T> event
    ) {
        log.info("Publishing event to Kafka | topic={} | key={} | eventId={}", topic, key, event.eventId());
        try {
            kafkaTemplate
                    .send(topic, key, event)
                    .whenComplete((result, ex) -> {

                        if (ex != null) {

                            log.error(
                                    "Failed to publish event | topic={} | key={} | eventId={}",
                                    topic,
                                    key,
                                    event.eventId(),
                                    ex
                            );

                            return;
                        }

                        log.info(
                                "Event published successfully | topic={} | key={} | eventId={}",
                                topic,
                                key,
                                event.eventId()
                        );
                    });
        } catch (Exception ex) {
            log.error("Failed to publish event to topic {}: {}", topic, ex.getMessage(), ex);
        }
    }
}