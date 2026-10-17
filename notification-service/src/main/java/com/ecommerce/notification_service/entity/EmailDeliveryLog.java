package com.ecommerce.notification_service.entity;

import com.ecommerce.notification_service.enums.DeliveryStatus;
import com.ecommerce.notification_service.enums.NotificationType;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
        name = "email_delivery_logs",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_email_delivery_event_type", columnNames = {"event_id", "notification_type"})
        },
        indexes = {
                @Index(name = "idx_email_delivery_recipient", columnList = "recipient_email"),
                @Index(name = "idx_email_delivery_event_id", columnList = "event_id"),
                @Index(name = "idx_email_delivery_status", columnList = "delivery_status")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailDeliveryLog {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "event_id")
    private UUID eventId;

    @Enumerated(EnumType.STRING)
    @Column(name = "notification_type", nullable = false, length = 50)
    private NotificationType notificationType;

    @Column(name = "recipient_email", nullable = false, length = 255)
    private String recipientEmail;

    @Column(name = "subject", length = 255)
    private String subject;

    @Enumerated(EnumType.STRING)
    @Column(name = "delivery_status", nullable = false, length = 30)
    private DeliveryStatus deliveryStatus;

    @Column(name = "attempt_count", nullable = false)
    @Builder.Default
    private int attemptCount = 1;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        if (this.id == null) {
            this.id = UUID.randomUUID();
        }
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
