package com.ecommerce.notification_service.controller;

import com.ecommerce.notification_service.dto.response.NotificationResponse;
import com.ecommerce.notification_service.dto.response.UnreadCountResponse;
import com.ecommerce.notification_service.exception.UnauthorizedAccessException;
import com.ecommerce.notification_service.service.InAppNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private static final String USER_ID_HEADER = "X-User-Id";
    private final InAppNotificationService inAppNotificationService;

    @GetMapping
    public ResponseEntity<Page<NotificationResponse>> getNotifications(
            @RequestHeader(value = USER_ID_HEADER, required = false) String userIdHeader,
            @RequestParam(value = "unreadOnly", defaultValue = "false") boolean unreadOnly,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {

        UUID userId = parseAndValidateUserId(userIdHeader);
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.min(100, Math.max(1, size)), Sort.by("createdAt").descending());

        Page<NotificationResponse> response = inAppNotificationService.getNotificationsForUser(userId, unreadOnly, pageable);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/unread-count")
    public ResponseEntity<UnreadCountResponse> getUnreadCount(
            @RequestHeader(value = USER_ID_HEADER, required = false) String userIdHeader) {

        UUID userId = parseAndValidateUserId(userIdHeader);
        long count = inAppNotificationService.getUnreadCount(userId);
        return ResponseEntity.ok(new UnreadCountResponse(count));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<NotificationResponse> markAsRead(
            @RequestHeader(value = USER_ID_HEADER, required = false) String userIdHeader,
            @PathVariable("id") UUID notificationId) {

        UUID userId = parseAndValidateUserId(userIdHeader);
        NotificationResponse response = inAppNotificationService.markAsRead(userId, notificationId);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/read-all")
    public ResponseEntity<Map<String, Object>> markAllAsRead(
            @RequestHeader(value = USER_ID_HEADER, required = false) String userIdHeader) {

        UUID userId = parseAndValidateUserId(userIdHeader);
        int count = inAppNotificationService.markAllAsRead(userId);
        return ResponseEntity.ok(Map.of(
                "message", "All notifications marked as read",
                "updatedCount", count
        ));
    }

    private UUID parseAndValidateUserId(String userIdHeader) {
        if (userIdHeader == null || userIdHeader.isBlank()) {
            throw new UnauthorizedAccessException("Missing X-User-Id header. User must be authenticated.");
        }
        try {
            return UUID.fromString(userIdHeader.trim());
        } catch (IllegalArgumentException ex) {
            throw new UnauthorizedAccessException("Invalid X-User-Id header format.");
        }
    }
}
