package com.ecommerce.notification_service.exception;

public class UnauthorizedAccessException extends NotificationException {
    public UnauthorizedAccessException(String message) {
        super(message);
    }
}
