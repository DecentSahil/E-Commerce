package com.ecommerce.notification_service.service;

import com.ecommerce.notification_service.dto.event.*;

import java.util.UUID;

public interface NotificationService {

    void processOtpRequested(UUID eventId, OtpPayload payload);

    void processUserRegistered(UUID eventId, UserRegisteredPayload payload);

    void processOrderCreated(UUID eventId, OrderCreatedPayload payload);

    void processOrderConfirmed(UUID eventId, OrderCreatedPayload payload);

    void processOrderStatusChanged(UUID eventId, OrderStatusChangedPayload payload);

    void processOrderRefunded(UUID eventId, OrderRefundedPayload payload);

    void processOrderCancelled(UUID eventId, OrderCancelledPayload payload);

    void processOrderDelivered(UUID eventId, OrderDeliveredPayload payload);
}
