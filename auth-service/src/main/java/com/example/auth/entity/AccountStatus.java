package com.example.auth.entity;

public enum AccountStatus {
    ACTIVE,
    PENDING_APPROVAL,
    LOCKED,
    DISABLED;

    public boolean isActive() {
        return this == ACTIVE;
    }
}
