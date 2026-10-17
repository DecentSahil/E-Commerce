package com.ecommerce.notification_service.exception;

public class InvalidEmailException extends NotificationException {
    public InvalidEmailException(String message) {
        super(message);
    }
}
