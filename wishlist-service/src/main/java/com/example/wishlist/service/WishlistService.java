package com.example.wishlist.service;

import com.example.wishlist.dto.response.WishlistResponse;

import java.util.UUID;

public interface WishlistService {

    WishlistResponse getWishlist(UUID userId);

    WishlistResponse addItemToWishlist(UUID userId, UUID productId);

    void removeItemFromWishlist(UUID userId, UUID productId);
}
