package com.ecommerce.notification_service.service.impl;

import com.ecommerce.notification_service.config.NotificationMailProperties;
import com.ecommerce.notification_service.dto.event.OrderCreatedPayload;
import com.ecommerce.notification_service.entity.EmailDeliveryLog;
import com.ecommerce.notification_service.enums.DeliveryStatus;
import com.ecommerce.notification_service.enums.NotificationType;
import com.ecommerce.notification_service.exception.InvalidEmailException;
import com.ecommerce.notification_service.exception.NotificationException;
import com.ecommerce.notification_service.repository.EmailDeliveryLogRepository;
import com.ecommerce.notification_service.service.EmailService;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

import java.nio.charset.StandardCharsets;
import java.time.Year;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private static final Pattern EMAIL_PATTERN = Pattern.compile(
            "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$"
    );

    private final JavaMailSender mailSender;
    private final SpringTemplateEngine templateEngine;
    private final NotificationMailProperties properties;
    private final EmailDeliveryLogRepository emailDeliveryLogRepository;

    @Override
    @Transactional
    public void sendOtpEmail(UUID eventId, String recipient, String otp) {
        validateEmail(recipient);

        if (isAlreadyDelivered(eventId, NotificationType.OTP)) {
            log.info("[IDEMPOTENT_SKIP] OTP email already sent for eventId: {}", eventId);
            return;
        }

        String subject = "Your Verification Code - " + properties.getMail().getSenderName();
        Context context = new Context();
        context.setVariable("otp", otp);
        context.setVariable("expiryMinutes", 5);
        context.setVariable("year", Year.now().getValue());

        String htmlBody = templateEngine.process("email/otp-email", context);
        sendHtmlEmail(eventId, NotificationType.OTP, recipient, subject, htmlBody);
    }

    @Override
    @Transactional
    public void sendWelcomeEmail(UUID eventId, String recipient, UUID userId) {
        validateEmail(recipient);

        if (isAlreadyDelivered(eventId, NotificationType.WELCOME)) {
            log.info("[IDEMPOTENT_SKIP] Welcome email already sent for eventId: {}", eventId);
            return;
        }

        String subject = "Welcome to " + properties.getMail().getSenderName();
        Context context = new Context();
        context.setVariable("email", recipient);
        context.setVariable("loginUrl", properties.getMail().getFrontendUrl() + "/login");
        context.setVariable("year", Year.now().getValue());

        String htmlBody = templateEngine.process("email/welcome-email", context);
        sendHtmlEmail(eventId, NotificationType.WELCOME, recipient, subject, htmlBody);
    }

    @Override
    @Transactional
    public void sendOrderConfirmationEmail(UUID eventId, String recipient, String customerName, OrderCreatedPayload order) {
        validateEmail(recipient);

        if (isAlreadyDelivered(eventId, NotificationType.ORDER_CREATED)) {
            log.info("[IDEMPOTENT_SKIP] Order confirmation already sent for eventId: {}", eventId);
            return;
        }

        String subject = "Order Confirmation #" + order.getOrderNumber() + " - " + properties.getMail().getSenderName();
        Context context = new Context();
        context.setVariable("customerName", customerName);
        context.setVariable("orderNumber", order.getOrderNumber());
        context.setVariable("grandTotal", order.getGrandTotal());
        context.setVariable("currencyCode", order.getCurrencyCode());
        context.setVariable("items", order.getItems());
        context.setVariable("year", Year.now().getValue());

        String htmlBody = templateEngine.process("email/order-confirmation-email", context);
        sendHtmlEmail(eventId, NotificationType.ORDER_CREATED, recipient, subject, htmlBody);
    }

    @Override
    @Transactional
    public void sendOrderStatusEmail(UUID eventId, String recipient, String orderNumber, String fromStatus, String toStatus) {
        validateEmail(recipient);

        if (isAlreadyDelivered(eventId, NotificationType.ORDER_STATUS_CHANGED)) {
            log.info("[IDEMPOTENT_SKIP] Order status update already sent for eventId: {}", eventId);
            return;
        }

        String subject = "Status Update for Order #" + orderNumber + " - " + properties.getMail().getSenderName();
        Context context = new Context();
        context.setVariable("orderNumber", orderNumber);
        context.setVariable("fromStatus", fromStatus);
        context.setVariable("toStatus", toStatus);
        context.setVariable("year", Year.now().getValue());

        String htmlBody = templateEngine.process("email/order-status-email", context);
        sendHtmlEmail(eventId, NotificationType.ORDER_STATUS_CHANGED, recipient, subject, htmlBody);
    }

    @Override
    @Transactional
    public void sendOrderCancelledEmail(UUID eventId, String recipient, String orderNumber, String reason) {
        validateEmail(recipient);

        if (isAlreadyDelivered(eventId, NotificationType.ORDER_CANCELLED)) {
            log.info("[IDEMPOTENT_SKIP] Order cancellation email already sent for eventId: {}", eventId);
            return;
        }

        String subject = "Order Cancelled #" + orderNumber + " - " + properties.getMail().getSenderName();
        Context context = new Context();
        context.setVariable("orderNumber", orderNumber);
        context.setVariable("reason", reason);
        context.setVariable("year", Year.now().getValue());

        String htmlBody = templateEngine.process("email/order-cancelled-email", context);
        sendHtmlEmail(eventId, NotificationType.ORDER_CANCELLED, recipient, subject, htmlBody);
    }

    @Override
    @Transactional
    public void sendOrderDeliveredEmail(UUID eventId, String recipient, String orderNumber) {
        validateEmail(recipient);

        if (isAlreadyDelivered(eventId, NotificationType.ORDER_DELIVERED)) {
            log.info("[IDEMPOTENT_SKIP] Order delivered email already sent for eventId: {}", eventId);
            return;
        }

        String subject = "Your Order Has Been Delivered #" + orderNumber + " - " + properties.getMail().getSenderName();
        Context context = new Context();
        context.setVariable("orderNumber", orderNumber);
        context.setVariable("year", Year.now().getValue());

        String htmlBody = templateEngine.process("email/order-delivered-email", context);
        sendHtmlEmail(eventId, NotificationType.ORDER_DELIVERED, recipient, subject, htmlBody);
    }

    @Override
    @Transactional
    public void sendOrderRefundedEmail(UUID eventId, String recipient, String orderNumber, java.math.BigDecimal amount, String currency, String reason) {
        validateEmail(recipient);

        if (isAlreadyDelivered(eventId, NotificationType.ORDER_REFUNDED)) {
            log.info("[IDEMPOTENT_SKIP] Order refunded email already sent for eventId: {}", eventId);
            return;
        }

        String subject = "Refund Processed for Order #" + orderNumber + " - " + properties.getMail().getSenderName();
        Context context = new Context();
        context.setVariable("orderNumber", orderNumber);
        context.setVariable("refundAmount", amount);
        context.setVariable("currencyCode", currency != null ? currency : "INR");
        context.setVariable("reason", reason != null ? reason : "Refund processed");
        context.setVariable("year", Year.now().getValue());

        String htmlBody = templateEngine.process("email/order-refunded-email", context);
        sendHtmlEmail(eventId, NotificationType.ORDER_REFUNDED, recipient, subject, htmlBody);
    }

    private void sendHtmlEmail(UUID eventId, NotificationType type, String recipient, String subject, String htmlBody) {
        EmailDeliveryLog deliveryLog = getOrCreateDeliveryLog(eventId, type, recipient, subject);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(
                    message,
                    MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED,
                    StandardCharsets.UTF_8.name()
            );

            helper.setFrom(properties.getMail().getFrom(), properties.getMail().getSenderName());
            helper.setTo(recipient);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);

            mailSender.send(message);

            deliveryLog.setDeliveryStatus(DeliveryStatus.SENT);
            deliveryLog.setErrorMessage(null);
            emailDeliveryLogRepository.save(deliveryLog);

            log.info("[EMAIL_SENT] Successfully sent {} email to recipient={} | eventId={}",
                    type, recipient, eventId);

        } catch (MailException ex) {
            deliveryLog.setDeliveryStatus(DeliveryStatus.FAILED);
            deliveryLog.setErrorMessage(ex.getMessage());
            emailDeliveryLogRepository.save(deliveryLog);

            log.error("[EMAIL_SEND_FAILED] Failed to send {} email to recipient={} | eventId={}. Error: {}",
                    type, recipient, eventId, ex.getMessage());
            throw new NotificationException("Failed to send email to " + recipient, ex);

        } catch (Exception ex) {
            deliveryLog.setDeliveryStatus(DeliveryStatus.FAILED);
            deliveryLog.setErrorMessage(ex.getMessage());
            emailDeliveryLogRepository.save(deliveryLog);

            log.error("[EMAIL_PREP_FAILED] Failed creating email for recipient={} | eventId={}. Error: {}",
                    recipient, eventId, ex.getMessage());
            throw new NotificationException("Unexpected error sending email", ex);
        }
    }

    private EmailDeliveryLog getOrCreateDeliveryLog(UUID eventId, NotificationType type, String recipient, String subject) {
        if (eventId != null) {
            return emailDeliveryLogRepository.findByEventIdAndNotificationType(eventId, type)
                    .map(existing -> {
                        existing.setAttemptCount(existing.getAttemptCount() + 1);
                        existing.setRecipientEmail(recipient);
                        existing.setSubject(subject);
                        return existing;
                    })
                    .orElseGet(() -> EmailDeliveryLog.builder()
                            .eventId(eventId)
                            .notificationType(type)
                            .recipientEmail(recipient)
                            .subject(subject)
                            .deliveryStatus(DeliveryStatus.PENDING)
                            .attemptCount(1)
                            .build());
        }

        return EmailDeliveryLog.builder()
                .notificationType(type)
                .recipientEmail(recipient)
                .subject(subject)
                .deliveryStatus(DeliveryStatus.PENDING)
                .attemptCount(1)
                .build();
    }

    private boolean isAlreadyDelivered(UUID eventId, NotificationType type) {
        if (eventId == null) {
            return false;
        }
        return emailDeliveryLogRepository.existsByEventIdAndNotificationTypeAndDeliveryStatus(
                eventId, type, DeliveryStatus.SENT
        );
    }

    private void validateEmail(String email) {
        if (email == null || email.isBlank() || !EMAIL_PATTERN.matcher(email.trim()).matches()) {
            throw new InvalidEmailException("Invalid recipient email address: " + email);
        }
    }
}
