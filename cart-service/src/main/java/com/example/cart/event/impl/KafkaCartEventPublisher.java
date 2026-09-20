package com.example.cart.event.impl;

import com.example.cart.event.CartEventPublisher;
import com.example.cart.event.EventEnvelope;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.UUID;

@Slf4j
@Component("kafkaCartEventPublisher")
@RequiredArgsConstructor
public class KafkaCartEventPublisher implements CartEventPublisher {

    public static final String CART_TOPIC = "cart-events";

    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Override
    public void publishCartItemAdded(UUID userId, UUID productId, UUID listingId, Integer quantity) {
        Map<String, Object> payload = Map.of(
                "userId", userId,
                "productId", productId,
                "listingId", listingId,
                "quantity", quantity
        );
        send(userId.toString(), EventEnvelope.of("CART_ITEM_ADDED", payload));
    }

    @Override
    public void publishCartItemUpdated(UUID userId, UUID productId, UUID listingId, Integer quantity) {
        Map<String, Object> payload = Map.of(
                "userId", userId,
                "productId", productId,
                "listingId", listingId,
                "quantity", quantity
        );
        send(userId.toString(), EventEnvelope.of("CART_ITEM_UPDATED", payload));
    }

    @Override
    public void publishCartItemRemoved(UUID userId, UUID productId, UUID listingId) {
        Map<String, Object> payload = Map.of(
                "userId", userId,
                "productId", productId,
                "listingId", listingId
        );
        send(userId.toString(), EventEnvelope.of("CART_ITEM_REMOVED", payload));
    }

    private void send(String key, Object event) {
        try {
            kafkaTemplate.send(CART_TOPIC, key, event);
            log.info("[KAFKA_PUBLISHED] topic={} key={} event={}", CART_TOPIC, key, event);
        } catch (Exception ex) {
            log.error("[KAFKA_ERROR] Failed to send to {}: {}", CART_TOPIC, ex.getMessage(), ex);
        }
    }
}
