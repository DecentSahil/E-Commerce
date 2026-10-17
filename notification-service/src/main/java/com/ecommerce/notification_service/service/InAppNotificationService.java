package com.ecommerce.notification_service.service;

import com.ecommerce.notification_service.dto.response.NotificationResponse;
import com.ecommerce.notification_service.entity.Notification;
import com.ecommerce.notification_service.enums.NotificationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface InAppNotificationService {

    Notification createNotification(UUID userId, NotificationType type, String title, String message, String referenceId);

    Page<NotificationResponse> getNotificationsForUser(UUID userId, boolean unreadOnly, Pageable pageable);

    long getUnreadCount(UUID userId);

    NotificationResponse markAsRead(UUID userId, UUID notificationId);

    int markAllAsRead(UUID userId);
}
