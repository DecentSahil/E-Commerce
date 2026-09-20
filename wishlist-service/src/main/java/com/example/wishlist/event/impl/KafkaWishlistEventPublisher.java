package com.example.wishlist.event.impl;

import com.example.wishlist.event.EventEnvelope;
import com.example.wishlist.event.WishlistEventPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.UUID;

@Slf4j
@Component("kafkaWishlistEventPublisher")
@RequiredArgsConstructor
public class KafkaWishlistEventPublisher implements WishlistEventPublisher {

    public static final String WISHLIST_TOPIC = "wishlist-events";

    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Override
    public void publishWishlistAdded(UUID userId, UUID productId) {
        Map<String, Object> payload = Map.of(
                "userId", userId,
                "productId", productId
        );
        send(userId.toString(), EventEnvelope.of("WISHLIST_ITEM_ADDED", payload));
    }

    @Override
    public void publishWishlistRemoved(UUID userId, UUID productId) {
        Map<String, Object> payload = Map.of(
                "userId", userId,
                "productId", productId
        );
        send(userId.toString(), EventEnvelope.of("WISHLIST_ITEM_REMOVED", payload));
    }

    private void send(String key, Object event) {
        try {
            kafkaTemplate.send(WISHLIST_TOPIC, key, event);
            log.info("[KAFKA_PUBLISHED] topic={} key={} event={}", WISHLIST_TOPIC, key, event);
        } catch (Exception ex) {
            log.error("[KAFKA_ERROR] Failed to send to {}: {}", WISHLIST_TOPIC, ex.getMessage(), ex);
        }
    }
}
