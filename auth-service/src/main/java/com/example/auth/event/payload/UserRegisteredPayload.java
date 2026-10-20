package com.example.auth.event.payload;

import java.util.UUID;

public record UserRegisteredPayload(
        UUID userId,
        String email,
        String role,
        String name
) {
    public UserRegisteredPayload(UUID userId, String email, String role) {
        this(userId, email, role, null);
    }
}