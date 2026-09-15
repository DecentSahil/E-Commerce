package com.example.order.event;

import com.example.order.entity.Order;
import com.example.order.entity.OrderStatus;

import java.util.UUID;


public interface OrderEventPublisher {

    void publishOrderCreated(Order order);

    void publishOrderStatusChanged(UUID orderId, String orderNumber,
                                   OrderStatus fromStatus, OrderStatus toStatus);

    void publishOrderCancelled(UUID orderId, String orderNumber, UUID authUserId, String reason);

    void publishOrderDelivered(UUID orderId, String orderNumber, UUID authUserId);
}
