package com.ecommerce.notification_service.service;

import com.ecommerce.notification_service.dto.event.OrderCreatedPayload;

import java.util.UUID;

public interface EmailService {

    void sendOtpEmail(UUID eventId, String recipient, String otp);

    void sendWelcomeEmail(UUID eventId, String recipient, UUID userId);

    void sendOrderConfirmationEmail(UUID eventId, String recipient, String customerName, OrderCreatedPayload order);

    void sendOrderStatusEmail(UUID eventId, String recipient, String orderNumber, String fromStatus, String toStatus);

    void sendOrderCancelledEmail(UUID eventId, String recipient, String orderNumber, String reason);

    void sendOrderDeliveredEmail(UUID eventId, String recipient, String orderNumber);

    void sendOrderRefundedEmail(UUID eventId, String recipient, String orderNumber, java.math.BigDecimal amount, String currency, String reason);
}
