package com.example.order.exception;

public class DuplicateIdempotencyKeyException extends RuntimeException {
    public DuplicateIdempotencyKeyException(String s) {
        super(s);
    }
}
