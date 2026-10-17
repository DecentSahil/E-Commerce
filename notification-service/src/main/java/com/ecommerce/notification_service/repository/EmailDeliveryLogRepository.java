package com.ecommerce.notification_service.repository;

import com.ecommerce.notification_service.entity.EmailDeliveryLog;
import com.ecommerce.notification_service.enums.DeliveryStatus;
import com.ecommerce.notification_service.enums.NotificationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmailDeliveryLogRepository extends JpaRepository<EmailDeliveryLog, UUID> {

    Optional<EmailDeliveryLog> findByEventIdAndNotificationType(UUID eventId, NotificationType notificationType);

    boolean existsByEventIdAndNotificationTypeAndDeliveryStatus(UUID eventId, NotificationType notificationType, DeliveryStatus status);
}
