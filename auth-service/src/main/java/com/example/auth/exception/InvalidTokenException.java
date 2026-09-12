package com.example.auth.exception;

public class InvalidTokenException extends ApiException {
    public InvalidTokenException(String message) {
        super(message);
    }
}
