package com.ecommerce.notification_service.dto.response;

import com.ecommerce.notification_service.enums.NotificationChannel;
import com.ecommerce.notification_service.enums.NotificationType;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {
    private UUID id;
    private UUID userId;
    private NotificationType notificationType;
    private NotificationChannel channel;
    private String title;
    private String message;

    @JsonProperty("isRead")
    private boolean isRead;

    private Instant readAt;
    private String referenceId;
    private Instant createdAt;
}
