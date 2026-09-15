package com.example.order.client;

import com.example.order.client.dto.CartDto;

import java.util.Optional;
import java.util.UUID;

public interface CartClient {

    Optional<CartDto> getCart(UUID userId);

    void clearCart(UUID userId);
}
