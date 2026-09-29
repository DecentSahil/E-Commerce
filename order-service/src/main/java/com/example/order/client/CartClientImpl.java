package com.example.order.client;

import com.example.order.client.dto.CartDto;
import feign.FeignException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class CartClientImpl implements CartClient {

    private final CartFeignClient cartFeignClient;

    @Override
    public Optional<CartDto> getCart(UUID userId) {
        if (userId == null) {
            return Optional.empty();
        }
        try {
            CartDto cart = cartFeignClient.getCart(userId);
            return Optional.ofNullable(cart);
        } catch (FeignException.NotFound ex) {
            log.warn("Cart not found for user: {}", userId);
            return Optional.empty();
        } catch (Exception ex) {
            log.error("Failed to fetch cart for user {}: {}", userId, ex.getMessage());
            throw ex;
        }
    }

    @Override
    public void clearCart(UUID userId) {
        if (userId == null) {
            return;
        }
        try {
            cartFeignClient.clearCart(userId);
            log.info("Cleared cart for user: {}", userId);
        } catch (Exception ex) {
            log.warn("Failed to clear cart for user {}: {}", userId, ex.getMessage());
        }
    }
}
