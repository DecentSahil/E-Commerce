package com.example.order.event;

import com.example.order.entity.Order;
import com.example.order.entity.OrderStatus;

import java.math.BigDecimal;
import java.util.UUID;

public interface OrderEventPublisher {

    void publishOrderCreated(Order order);

    void publishOrderConfirmed(Order order);

    void publishOrderStatusChanged(UUID orderId, String orderNumber, UUID authUserId,
                                   OrderStatus fromStatus, OrderStatus toStatus);

    void publishOrderRefunded(UUID orderId, String orderNumber, UUID authUserId,
                              BigDecimal refundAmount, String currencyCode, String reason);

    void publishOrderCancelled(UUID orderId, String orderNumber, UUID authUserId, String reason);

    void publishOrderDelivered(UUID orderId, String orderNumber, UUID authUserId);

}
