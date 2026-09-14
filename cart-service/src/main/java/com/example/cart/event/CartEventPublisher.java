package com.example.cart.event;

import java.util.UUID;

public interface CartEventPublisher {

    void publishCartItemAdded(UUID userId, UUID productId, UUID listingId, Integer quantity);

    void publishCartItemUpdated(UUID userId, UUID productId, UUID listingId, Integer quantity);

    void publishCartItemRemoved(UUID userId, UUID productId, UUID listingId);
}
