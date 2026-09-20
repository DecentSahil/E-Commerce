package com.example.product.consumer;

import com.example.product.service.ListingService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class OrderEventConsumer {

    private final ListingService listingService;
    private final ObjectMapper objectMapper;

    @KafkaListener(topics = "order-events", groupId = "product-service-group")
    public void onOrderEvent(Object message) {
        log.info("[KAFKA_RECEIVED] order-events in product-service: {}", message);
        try {
            Map<?, ?> map;
            if (message instanceof String str) {
                map = objectMapper.readValue(str, Map.class);
            } else if (message instanceof Map<?, ?> m) {
                map = m;
            } else {
                map = objectMapper.convertValue(message, Map.class);
            }

            String eventType = (String) map.get("eventType");
            if ("ORDER_CANCELLED".equalsIgnoreCase(eventType)) {
                Object payloadObj = map.get("payload");
                Map<?, ?> payload = payloadObj instanceof Map<?, ?> p ? p : map;

                Object itemsObj = payload.get("items");
                if (itemsObj instanceof List<?> items) {
                    for (Object itemObj : items) {
                        if (itemObj instanceof Map<?, ?> item) {
                            Object listingIdObj = item.get("listingId");
                            Object qtyObj = item.get("quantity");
                            if (listingIdObj != null && qtyObj != null) {
                                UUID listingId = UUID.fromString(listingIdObj.toString());
                                int qty = Integer.parseInt(qtyObj.toString());
                                log.info("Restoring stock for cancelled order item: listingId={}, qty={}", listingId, qty);
                                listingService.restoreStock(listingId, qty);
                            }
                        }
                    }
                }
            }
        } catch (Exception ex) {
            log.error("Error processing order event in product-service: {}", ex.getMessage(), ex);
        }
    }
}
