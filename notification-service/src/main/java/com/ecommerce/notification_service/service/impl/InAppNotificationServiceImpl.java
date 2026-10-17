package com.ecommerce.notification_service.service.impl;

import com.ecommerce.notification_service.dto.response.NotificationResponse;
import com.ecommerce.notification_service.entity.Notification;
import com.ecommerce.notification_service.enums.NotificationChannel;
import com.ecommerce.notification_service.enums.NotificationType;
import com.ecommerce.notification_service.exception.ResourceNotFoundException;
import com.ecommerce.notification_service.repository.NotificationRepository;
import com.ecommerce.notification_service.service.InAppNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class InAppNotificationServiceImpl implements InAppNotificationService {

    private final NotificationRepository notificationRepository;

    @Override
    @Transactional
    public Notification createNotification(UUID userId, NotificationType type, String title, String message, String referenceId) {
        if (userId == null) {
            log.warn("[IN_APP_NOTIFICATION] Cannot create notification without userId | type={}", type);
            return null;
        }

        if (type == NotificationType.OTP) {
            log.warn("[IN_APP_NOTIFICATION_BLOCKED] Attempted to store OTP as in-app notification. Operation blocked.");
            return null;
        }

        Notification notification = Notification.builder()
                .userId(userId)
                .notificationType(type)
                .channel(NotificationChannel.IN_APP)
                .title(title)
                .message(message)
                .referenceId(referenceId)
                .isRead(false)
                .build();

        Notification saved = notificationRepository.save(notification);
        log.info("[IN_APP_NOTIFICATION_CREATED] Created notification id={} for userId={} | type={}",
                saved.getId(), userId, type);
        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<NotificationResponse> getNotificationsForUser(UUID userId, boolean unreadOnly, Pageable pageable) {
        Page<Notification> page = unreadOnly
                ? notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId, pageable)
                : notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);

        return page.map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount(UUID userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    @Override
    @Transactional
    public NotificationResponse markAsRead(UUID userId, UUID notificationId) {
        Notification notification = notificationRepository.findByIdAndUserId(notificationId, userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Notification not found or access denied for id: " + notificationId
                ));

        if (!notification.isRead()) {
            notification.setRead(true);
            notification.setReadAt(Instant.now());
            notification = notificationRepository.save(notification);
            log.info("[NOTIFICATION_READ] Marked notification id={} as read for userId={}", notificationId, userId);
        }

        return toResponse(notification);
    }

    @Override
    @Transactional
    public int markAllAsRead(UUID userId) {
        int updatedCount = notificationRepository.markAllAsReadForUser(userId, Instant.now());
        log.info("[NOTIFICATIONS_READ_ALL] Marked {} notifications as read for userId={}", updatedCount, userId);
        return updatedCount;
    }

    private NotificationResponse toResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .userId(n.getUserId())
                .notificationType(n.getNotificationType())
                .channel(n.getChannel())
                .title(n.getTitle())
                .message(n.getMessage())
                .isRead(n.isRead())
                .readAt(n.getReadAt())
                .referenceId(n.getReferenceId())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
