package com.example.cart.service;

import com.example.cart.dto.request.AddToCartRequest;
import com.example.cart.dto.request.UpdateCartItemRequest;
import com.example.cart.dto.response.CartResponse;

import java.util.UUID;

public interface CartService {

    CartResponse getCart(UUID userId);

    CartResponse addItemToCart(UUID userId, AddToCartRequest request);

    CartResponse updateCartItem(UUID userId, UUID itemId, UpdateCartItemRequest request);

    CartResponse removeCartItem(UUID userId, UUID itemId);

    void clearCart(UUID userId);
}
