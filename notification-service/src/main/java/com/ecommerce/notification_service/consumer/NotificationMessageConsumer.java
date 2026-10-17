package com.ecommerce.notification_service.consumer;

import com.ecommerce.notification_service.dto.event.*;
import com.ecommerce.notification_service.service.NotificationService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationMessageConsumer {

    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;

    @KafkaListener(
            topics = {"otp-events", "auth-events", "order-events"},
            groupId = "notification-service-group",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void onMessage(String rawMessage) {
        if (rawMessage == null || rawMessage.isBlank()) {
            log.warn("[KAFKA_CONSUMER] Received empty or null message, skipping");
            return;
        }

        JsonNode rootNode;
        try {
            rootNode = objectMapper.readTree(rawMessage);
        } catch (JsonProcessingException ex) {
            log.warn("[KAFKA_CONSUMER_MALFORMED] Received unparseable JSON message, discarding: {}", ex.getMessage());
            return;
        }

        try {
            String eventType = rootNode.has("eventType") && !rootNode.get("eventType").isNull()
                    ? rootNode.get("eventType").asText()
                    : null;

            UUID eventId = null;
            if (rootNode.has("eventId") && !rootNode.get("eventId").isNull()) {
                try {
                    eventId = UUID.fromString(rootNode.get("eventId").asText());
                } catch (IllegalArgumentException e) {
                    log.warn("[KAFKA_CONSUMER] Invalid eventId format: {}", rootNode.get("eventId").asText());
                }
            }

            JsonNode payloadNode = rootNode.get("payload");
            if (payloadNode == null || payloadNode.isNull()) {
                log.warn("[KAFKA_CONSUMER] Missing payload in event | eventType={} | eventId={}", eventType, eventId);
                return;
            }

            if (eventType == null) {
                log.warn("[KAFKA_CONSUMER] Missing eventType in message | eventId={}", eventId);
                return;
            }

            if ("OTP_REQUESTED".equalsIgnoreCase(eventType)) {
                log.info("[KAFKA_RECEIVED] Processing eventType=OTP_REQUESTED | eventId={}", eventId);
            } else {
                log.info("[KAFKA_RECEIVED] Processing eventType={} | eventId={}", eventType, eventId);
            }

            dispatch(eventType, eventId, payloadNode);

        } catch (Exception ex) {
            log.error("[KAFKA_CONSUMER_ERROR] Failed to process message: {}", ex.getMessage(), ex);
            throw new RuntimeException("Error processing Kafka message", ex);
        }
    }

    private void dispatch(String eventType, UUID eventId, JsonNode payloadNode) {
        try {
            switch (eventType) {
                case "OTP_REQUESTED" -> {
                    OtpPayload payload = objectMapper.treeToValue(payloadNode, OtpPayload.class);
                    notificationService.processOtpRequested(eventId, payload);
                }
                case "USER_REGISTERED" -> {
                    UserRegisteredPayload payload = objectMapper.treeToValue(payloadNode, UserRegisteredPayload.class);
                    notificationService.processUserRegistered(eventId, payload);
                }
                case "ORDER_CREATED" -> {
                    OrderCreatedPayload payload = objectMapper.treeToValue(payloadNode, OrderCreatedPayload.class);
                    notificationService.processOrderCreated(eventId, payload);
                }
                case "ORDER_CONFIRMED" -> {
                    OrderCreatedPayload payload = objectMapper.treeToValue(payloadNode, OrderCreatedPayload.class);
                    notificationService.processOrderConfirmed(eventId, payload);
                }
                case "ORDER_STATUS_CHANGED" -> {
                    OrderStatusChangedPayload payload = objectMapper.treeToValue(payloadNode, OrderStatusChangedPayload.class);
                    notificationService.processOrderStatusChanged(eventId, payload);
                }
                case "ORDER_REFUNDED" -> {
                    OrderRefundedPayload payload = objectMapper.treeToValue(payloadNode, OrderRefundedPayload.class);
                    notificationService.processOrderRefunded(eventId, payload);
                }
                case "ORDER_CANCELLED" -> {
                    OrderCancelledPayload payload = objectMapper.treeToValue(payloadNode, OrderCancelledPayload.class);
                    notificationService.processOrderCancelled(eventId, payload);
                }
                case "ORDER_DELIVERED" -> {
                    OrderDeliveredPayload payload = objectMapper.treeToValue(payloadNode, OrderDeliveredPayload.class);
                    notificationService.processOrderDelivered(eventId, payload);
                }
                default -> {
                    log.info("[KAFKA_IGNORED] Unhandled eventType: {} | eventId={}", eventType, eventId);
                }
            }
        } catch (Exception ex) {
            log.error("[DISPATCH_ERROR] Failed to dispatch eventType={}: {}", eventType, ex.getMessage());
            throw new RuntimeException("Failed to dispatch event " + eventType, ex);
        }
    }
}
