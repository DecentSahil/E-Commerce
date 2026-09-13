package com.example.product.entity;

public enum ProductStatus {

    ACTIVE,
    INACTIVE,
    DISCONTINUED;

    public boolean isPubliclyVisible() {
        return this == ACTIVE;
    }
}