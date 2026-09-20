package com.example.product.event.impl;

import com.example.product.event.EventEnvelope;
import com.example.product.event.ProductEventPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Primary;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@Primary
@RequiredArgsConstructor
public class KafkaProductEventPublisher implements ProductEventPublisher {

    public static final String PRODUCT_TOPIC = "product-events";
    public static final String LISTING_TOPIC = "listing-events";

    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Override
    public void publishProductCreated(UUID productId, String name, String category, String brand) {
        Map<String, Object> payload = Map.of(
                "productId", productId,
                "name", name != null ? name : "",
                "category", category != null ? category : "",
                "brand", brand != null ? brand : ""
        );
        send(PRODUCT_TOPIC, productId.toString(), EventEnvelope.of("PRODUCT_CREATED", payload));
    }

    @Override
    public void publishProductUpdated(UUID productId, String name, String category, String brand, String status) {
        Map<String, Object> payload = Map.of(
                "productId", productId,
                "name", name != null ? name : "",
                "category", category != null ? category : "",
                "brand", brand != null ? brand : "",
                "status", status != null ? status : ""
        );
        send(PRODUCT_TOPIC, productId.toString(), EventEnvelope.of("PRODUCT_UPDATED", payload));
    }

    @Override
    public void publishProductDeleted(UUID productId) {
        Map<String, Object> payload = Map.of("productId", productId);
        send(PRODUCT_TOPIC, productId.toString(), EventEnvelope.of("PRODUCT_DELETED", payload));
    }

    @Override
    public void publishListingCreated(UUID listingId, UUID productId, UUID sellerId) {
        Map<String, Object> payload = Map.of(
                "listingId", listingId,
                "productId", productId,
                "sellerId", sellerId
        );
        send(LISTING_TOPIC, productId.toString(), EventEnvelope.of("LISTING_CREATED", payload));
    }

    @Override
    public void publishListingUpdated(UUID listingId, UUID productId, UUID sellerId) {
        Map<String, Object> payload = Map.of(
                "listingId", listingId,
                "productId", productId,
                "sellerId", sellerId
        );
        send(LISTING_TOPIC, productId.toString(), EventEnvelope.of("LISTING_UPDATED", payload));
    }

    @Override
    public void publishListingDeleted(UUID listingId, UUID productId, UUID sellerId) {
        Map<String, Object> payload = Map.of(
                "listingId", listingId,
                "productId", productId,
                "sellerId", sellerId
        );
        send(LISTING_TOPIC, productId.toString(), EventEnvelope.of("LISTING_DELETED", payload));
    }

    @Override
    public void publishListingStockChanged(UUID listingId, UUID productId, UUID sellerId, Integer oldStock, Integer newStock) {
        Map<String, Object> payload = Map.of(
                "listingId", listingId,
                "productId", productId,
                "sellerId", sellerId,
                "oldStock", oldStock != null ? oldStock : 0,
                "newStock", newStock != null ? newStock : 0
        );
        send(LISTING_TOPIC, productId.toString(), EventEnvelope.of("LISTING_STOCK_CHANGED", payload));
    }

    private void send(String topic, String key, Object message) {
        try {
            kafkaTemplate.send(topic, key, message);
            log.info("[KAFKA_PUBLISHED] topic={} key={} event={}", topic, key, message);
        } catch (Exception ex) {
            log.error("[KAFKA_ERROR] Failed to send to {}: {}", topic, ex.getMessage(), ex);
        }
    }
}
