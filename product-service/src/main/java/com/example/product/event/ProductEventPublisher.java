package com.example.product.event;

import java.util.UUID;

public interface ProductEventPublisher {

    void publishProductCreated(
            UUID productId,
            String name,
            String category,
            String brand
    );

    void publishProductUpdated(
            UUID productId,
            String name,
            String category,
            String brand,
            String status
    );

    void publishProductDeleted(
            UUID productId
    );

    void publishListingCreated(
            UUID listingId,
            UUID productId,
            UUID sellerId
    );

    void publishListingUpdated(
            UUID listingId,
            UUID productId,
            UUID sellerId
    );

    void publishListingDeleted(
            UUID listingId,
            UUID productId,
            UUID sellerId
    );

    void publishListingStockChanged(
            UUID listingId,
            UUID productId,
            UUID sellerId,
            Integer oldStock,
            Integer newStock
    );
}