package com.example.auth.entity;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum Role {
    ROLE_USER,
    ROLE_SELLER,
    ROLE_ADMIN;

    public String getAuthority() {
        return name();
    }

    @JsonCreator
    public static Role fromString(String value) {
        if (value == null || value.isBlank()) {
            return ROLE_USER;
        }
        String clean = value.trim().toUpperCase();
        if ("SELLER".equals(clean) || "ROLE_SELLER".equals(clean)) {
            return ROLE_SELLER;
        }
        if ("ADMIN".equals(clean) || "ROLE_ADMIN".equals(clean)) {
            return ROLE_ADMIN;
        }
        return ROLE_USER;
    }
}
