package com.ecommerce.notification_service.service.impl;

import com.ecommerce.notification_service.client.UserServiceClient;
import com.ecommerce.notification_service.dto.event.*;
import com.ecommerce.notification_service.dto.external.UserProfileDto;
import com.ecommerce.notification_service.enums.NotificationType;
import com.ecommerce.notification_service.service.EmailService;
import com.ecommerce.notification_service.service.InAppNotificationService;
import com.ecommerce.notification_service.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final EmailService emailService;
    private final InAppNotificationService inAppNotificationService;
    private final UserServiceClient userServiceClient;

    @Override
    public void processOtpRequested(UUID eventId, OtpPayload payload) {
        if (payload == null || payload.getEmail() == null || payload.getOtp() == null) {
            log.warn("[NOTIFICATION_SKIP] Invalid OTP payload | eventId={}", eventId);
            return;
        }

        emailService.sendOtpEmail(eventId, payload.getEmail().trim(), payload.getOtp().trim());
    }

    @Override
    public void processUserRegistered(UUID eventId, UserRegisteredPayload payload) {
        if (payload == null || payload.email() == null) {
            log.warn("[NOTIFICATION_SKIP] Invalid UserRegistered payload | eventId={}", eventId);
            return;
        }

        emailService.sendWelcomeEmail(eventId, payload.email().trim(), payload.userId());
    }

    @Override
    public void processOrderCreated(UUID eventId, OrderCreatedPayload payload) {
        if (payload == null) {
            log.warn("[NOTIFICATION_SKIP] Null OrderCreated payload | eventId={}", eventId);
            return;
        }

        UUID authUserId = payload.getAuthUserId();
        String orderNumber = payload.getOrderNumber() != null ? payload.getOrderNumber() : "Unknown";

        if (authUserId != null) {
            inAppNotificationService.createNotification(
                    authUserId,
                    NotificationType.ORDER_CREATED,
                    "Order Placed Successfully",
                    "Your order #" + orderNumber + " has been placed and is being processed.",
                    payload.getOrderId() != null ? payload.getOrderId().toString() : null
            );
        }
        String recipientEmail = null;
        String customerName = "Customer";

        if (authUserId != null) {
            Optional<UserProfileDto> profileOpt = userServiceClient.getUserProfile(authUserId);
            if (profileOpt.isPresent()) {
                UserProfileDto profile = profileOpt.get();
                recipientEmail = profile.getEmail();
                if (profile.getFirstName() != null && !profile.getFirstName().isBlank()) {
                    customerName = profile.getFirstName();
                }
            }
        }
        if (recipientEmail != null && !recipientEmail.isBlank()) {
            emailService.sendOrderConfirmationEmail(eventId, recipientEmail, customerName, payload);
        } else {
            log.warn("[NOTIFICATION_WARN] Recipient email could not be resolved for order #{} | authUserId={}",
                    orderNumber, authUserId);
        }
    }

    @Override
    public void processOrderConfirmed(UUID eventId, OrderCreatedPayload payload) {
        if (payload == null) {
            log.warn("[NOTIFICATION_SKIP] Null OrderConfirmed payload | eventId={}", eventId);
            return;
        }

        UUID authUserId = payload.getAuthUserId();
        String orderNumber = payload.getOrderNumber() != null ? payload.getOrderNumber() : "Unknown";
        if (authUserId != null) {
            inAppNotificationService.createNotification(
                    authUserId,
                    NotificationType.ORDER_CONFIRMED,
                    "Order Confirmed",
                    "Your order #" + orderNumber + " has been confirmed and is being prepared.",
                    payload.getOrderId() != null ? payload.getOrderId().toString() : null
            );
        }
        String recipientEmail = null;
        String customerName = "Customer";

        if (authUserId != null) {
            Optional<UserProfileDto> profileOpt = userServiceClient.getUserProfile(authUserId);
            if (profileOpt.isPresent()) {
                UserProfileDto profile = profileOpt.get();
                recipientEmail = profile.getEmail();
                if (profile.getFirstName() != null && !profile.getFirstName().isBlank()) {
                    customerName = profile.getFirstName();
                }
            }
        }
        if (recipientEmail != null && !recipientEmail.isBlank()) {
            emailService.sendOrderConfirmationEmail(eventId, recipientEmail, customerName, payload);
        } else {
            log.warn("[NOTIFICATION_WARN] Recipient email could not be resolved for confirmed order #{} | authUserId={}",
                    orderNumber, authUserId);
        }
    }

    @Override
    public void processOrderStatusChanged(UUID eventId, OrderStatusChangedPayload payload) {
        if (payload == null) {
            log.warn("[NOTIFICATION_SKIP] Null OrderStatusChanged payload | eventId={}", eventId);
            return;
        }
        UUID authUserId = payload.getAuthUserId();
        String orderNumber = payload.getOrderNumber() != null ? payload.getOrderNumber() : "Unknown";
        String toStatus = payload.getToStatus() != null ? payload.getToStatus() : "UPDATED";
        log.info("[NOTIFICATION_ORDER_STATUS] Order #{} status changed from {} to {}",
                orderNumber, payload.getFromStatus(), toStatus);
        if (authUserId != null) {
            String title = "Order " + toStatus;
            String message = "Your order #" + orderNumber + " is now " + toStatus + ".";
            if (payload.getReason() != null && !payload.getReason().isBlank()) {
                message += " (" + payload.getReason() + ")";
            }
            inAppNotificationService.createNotification(
                    authUserId,
                    NotificationType.ORDER_STATUS_CHANGED,
                    title,
                    message,
                    payload.getOrderId() != null ? payload.getOrderId().toString() : null
            );
        }
    }

    @Override
    public void processOrderRefunded(UUID eventId, OrderRefundedPayload payload) {
        if (payload == null) {
            log.warn("[NOTIFICATION_SKIP] Null OrderRefunded payload | eventId={}", eventId);
            return;
        }

        UUID authUserId = payload.getAuthUserId();
        String orderNumber = payload.getOrderNumber() != null ? payload.getOrderNumber() : "Unknown";
        String currency = payload.getCurrencyCode() != null ? payload.getCurrencyCode() : "INR";
        String formattedAmount = currency + " " + (payload.getRefundAmount() != null ? payload.getRefundAmount() : "0.00");
        if (authUserId != null) {
            inAppNotificationService.createNotification(
                    authUserId,
                    NotificationType.ORDER_REFUNDED,
                    "Refund Processed",
                    "A refund of " + formattedAmount + " has been initiated for order #" + orderNumber + ".",
                    payload.getOrderId() != null ? payload.getOrderId().toString() : null
            );
        }
        if (authUserId != null) {
            userServiceClient.getUserProfile(authUserId).ifPresent(profile -> {
                if (profile.getEmail() != null && !profile.getEmail().isBlank()) {
                    emailService.sendOrderRefundedEmail(
                            eventId,
                            profile.getEmail(),
                            orderNumber,
                            payload.getRefundAmount(),
                            payload.getCurrencyCode(),
                            payload.getReason()
                    );
                }
            });
        }
    }

    @Override
    public void processOrderCancelled(UUID eventId, OrderCancelledPayload payload) {
        if (payload == null) {
            log.warn("[NOTIFICATION_SKIP] Null OrderCancelled payload | eventId={}", eventId);
            return;
        }

        UUID authUserId = payload.getAuthUserId();
        String orderNumber = payload.getOrderNumber() != null ? payload.getOrderNumber() : "Unknown";
        String reason = payload.getReason() != null ? payload.getReason() : "No reason provided";
        if (authUserId != null) {
            inAppNotificationService.createNotification(
                    authUserId,
                    NotificationType.ORDER_CANCELLED,
                    "Order Cancelled",
                    "Your order #" + orderNumber + " has been cancelled. Reason: " + reason,
                    payload.getOrderId() != null ? payload.getOrderId().toString() : null
            );
        }
        if (authUserId != null) {
            userServiceClient.getUserProfile(authUserId).ifPresent(profile -> {
                if (profile.getEmail() != null && !profile.getEmail().isBlank()) {
                    emailService.sendOrderCancelledEmail(eventId, profile.getEmail(), orderNumber, reason);
                }
            });
        }
    }

    @Override
    public void processOrderDelivered(UUID eventId, OrderDeliveredPayload payload) {
        if (payload == null) {
            log.warn("[NOTIFICATION_SKIP] Null OrderDelivered payload | eventId={}", eventId);
            return;
        }

        UUID authUserId = payload.getAuthUserId();
        String orderNumber = payload.getOrderNumber() != null ? payload.getOrderNumber() : "Unknown";
        if (authUserId != null) {
            inAppNotificationService.createNotification(
                    authUserId,
                    NotificationType.ORDER_DELIVERED,
                    "Order Delivered",
                    "Your order #" + orderNumber + " has been delivered.",
                    payload.getOrderId() != null ? payload.getOrderId().toString() : null
            );
        }
        if (authUserId != null) {
            userServiceClient.getUserProfile(authUserId).ifPresent(profile -> {
                if (profile.getEmail() != null && !profile.getEmail().isBlank()) {
                    emailService.sendOrderDeliveredEmail(eventId, profile.getEmail(), orderNumber);
                }
            });
        }
    }
}
