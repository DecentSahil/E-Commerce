package com.example.order.event.impl;

import com.example.order.entity.Order;
import com.example.order.entity.OrderStatus;
import com.example.order.event.EventEnvelope;
import com.example.order.event.OrderEventPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Primary;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Component
@Primary
@RequiredArgsConstructor
public class KafkaOrderEventPublisher implements OrderEventPublisher {

    public static final String ORDER_TOPIC = "order-events";

    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Override
    public void publishOrderCreated(Order order) {
        Map<String, Object> payload = buildOrderPayload(order);
        send(order.getId().toString(), EventEnvelope.of("ORDER_CREATED", payload));
    }

    @Override
    public void publishOrderConfirmed(Order order) {
        Map<String, Object> payload = buildOrderPayload(order);
        send(order.getId().toString(), EventEnvelope.of("ORDER_CONFIRMED", payload));
    }

    private Map<String, Object> buildOrderPayload(Order order) {
        List<Map<String, Object>> items = order.getItems() == null ? List.of() :
                order.getItems().stream().map(item -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("productId", item.getProductId());
                    map.put("listingId", item.getListingId());
                    map.put("sellerId", item.getSellerId());
                    map.put("productName", item.getProductName());
                    map.put("productSku", item.getProductSku());
                    map.put("quantity", item.getQuantity());
                    map.put("unitPrice", item.getUnitPrice());
                    map.put("lineTotal", item.getLineTotal());
                    return map;
                }).toList();

        Map<String, Object> payload = new HashMap<>();
        payload.put("orderId", order.getId());
        payload.put("orderNumber", order.getOrderNumber());
        payload.put("authUserId", order.getAuthUserId());
        payload.put("grandTotal", order.getGrandTotal());
        payload.put("subtotal", order.getSubtotal());
        payload.put("shippingCost", order.getShippingCost());
        payload.put("taxTotal", order.getTaxTotal());
        payload.put("currencyCode", order.getCurrencyCode());
        payload.put("status", order.getStatus() != null ? order.getStatus().name() : "");
        payload.put("shipFullName", order.getShipFullName());
        payload.put("shipPhone", order.getShipPhone());
        payload.put("shipCity", order.getShipCity());
        payload.put("items", items);
        return payload;
    }

    @Override
    public void publishOrderStatusChanged(UUID orderId, String orderNumber, UUID authUserId,
                                           OrderStatus fromStatus, OrderStatus toStatus) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("orderId", orderId);
        payload.put("orderNumber", orderNumber != null ? orderNumber : "");
        if (authUserId != null) {
            payload.put("authUserId", authUserId);
        }
        payload.put("fromStatus", fromStatus != null ? fromStatus.name() : "");
        payload.put("toStatus", toStatus != null ? toStatus.name() : "");

        send(orderId.toString(), EventEnvelope.of("ORDER_STATUS_CHANGED", payload));
    }

    @Override
    public void publishOrderRefunded(UUID orderId, String orderNumber, UUID authUserId,
                                     java.math.BigDecimal refundAmount, String currencyCode, String reason) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("orderId", orderId);
        payload.put("orderNumber", orderNumber != null ? orderNumber : "");
        if (authUserId != null) {
            payload.put("authUserId", authUserId);
        }
        payload.put("refundAmount", refundAmount != null ? refundAmount : java.math.BigDecimal.ZERO);
        payload.put("currencyCode", currencyCode != null ? currencyCode : "INR");
        payload.put("reason", reason != null ? reason : "Refund processed");

        send(orderId.toString(), EventEnvelope.of("ORDER_REFUNDED", payload));
    }

    @Override
    public void publishOrderCancelled(UUID orderId, String orderNumber, UUID authUserId, String reason) {
        Map<String, Object> payload = Map.of(
                "orderId", orderId,
                "orderNumber", orderNumber != null ? orderNumber : "",
                "authUserId", authUserId,
                "reason", reason != null ? reason : ""
        );
        send(orderId.toString(), EventEnvelope.of("ORDER_CANCELLED", payload));
    }

    @Override
    public void publishOrderDelivered(UUID orderId, String orderNumber, UUID authUserId) {
        Map<String, Object> payload = Map.of(
                "orderId", orderId,
                "orderNumber", orderNumber != null ? orderNumber : "",
                "authUserId", authUserId
        );
        send(orderId.toString(), EventEnvelope.of("ORDER_DELIVERED", payload));
    }

    private void send(String key, Object event) {
        if (org.springframework.transaction.support.TransactionSynchronizationManager.isActualTransactionActive()) {
            org.springframework.transaction.support.TransactionSynchronizationManager.registerSynchronization(
                    new org.springframework.transaction.support.TransactionSynchronization() {
                        @Override
                        public void afterCommit() {
                            doSend(key, event);
                        }
                    }
            );
        } else {
            doSend(key, event);
        }
    }

    private void doSend(String key, Object event) {
        try {
            kafkaTemplate.send(ORDER_TOPIC, key, event);
            log.info("[KAFKA_PUBLISHED] topic={} key={} event={}", ORDER_TOPIC, key, event);
        } catch (Exception ex) {
            log.error("[KAFKA_ERROR] Failed to send to {}: {}", ORDER_TOPIC, ex.getMessage(), ex);
        }
    }
}
