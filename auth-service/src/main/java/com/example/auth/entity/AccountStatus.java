package com.example.auth.entity;

public enum AccountStatus {
    ACTIVE,
    LOCKED,
    DISABLED;

    public boolean isActive() {
        return this == ACTIVE;
    }
}
