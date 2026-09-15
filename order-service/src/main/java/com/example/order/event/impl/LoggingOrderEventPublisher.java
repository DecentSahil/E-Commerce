package com.example.order.event.impl;

import com.example.order.entity.Order;
import com.example.order.entity.OrderStatus;
import com.example.order.event.OrderEventPublisher;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.UUID;


@Slf4j
@Component
public class LoggingOrderEventPublisher implements OrderEventPublisher {

    @Override
    public void publishOrderCreated(Order order) {
        // [TEMPORARY] Replace with RabbitMQ producer publishing to exchange: order.events
        // Routing key: order.created
        // Consumers: notification-service (confirmation email), analytics-service
        log.info("[EVENT][order.created] orderId={} orderNumber={} userId={} grandTotal={} currency={}",
                order.getId(),
                order.getOrderNumber(),
                order.getAuthUserId(),
                order.getGrandTotal(),
                order.getCurrencyCode());
    }

    @Override
    public void publishOrderStatusChanged(UUID orderId, String orderNumber,
                                          OrderStatus fromStatus, OrderStatus toStatus) {
        // [TEMPORARY] Replace with RabbitMQ producer publishing to exchange: order.events
        // Routing key: order.status.changed
        // Consumers: notification-service, analytics-service
        log.info("[EVENT][order.status.changed] orderId={} orderNumber={} from={} to={}",
                orderId, orderNumber, fromStatus, toStatus);
    }

    @Override
    public void publishOrderCancelled(UUID orderId, String orderNumber,
                                      UUID authUserId, String reason) {
        // [TEMPORARY] Replace with RabbitMQ producer publishing to exchange: order.events
        // Routing key: order.cancelled
        // Consumers: notification-service (cancellation email), analytics-service
        log.info("[EVENT][order.cancelled] orderId={} orderNumber={} userId={} reason={}",
                orderId, orderNumber, authUserId, reason);
    }

    @Override
    public void publishOrderDelivered(UUID orderId, String orderNumber, UUID authUserId) {
        // [TEMPORARY] Replace with RabbitMQ producer publishing to exchange: order.events
        // Routing key: order.delivered
        // Consumers: recommendation-service (purchase signal), analytics-service
        log.info("[EVENT][order.delivered] orderId={} orderNumber={} userId={}",
                orderId, orderNumber, authUserId);
    }
}
