package com.example.wishlist.event;

import java.util.UUID;

public interface WishlistEventPublisher {

    void publishWishlistAdded(UUID userId, UUID productId);

    void publishWishlistRemoved(UUID userId, UUID productId);
}
