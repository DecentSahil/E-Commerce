package com.example.auth.exception;

public class AccountDisabledException extends ApiException {
    public AccountDisabledException(String message) {
        super(message);
    }
}
