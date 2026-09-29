package com.example.order.client;

import com.example.order.client.dto.CartDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;

import java.util.UUID;

@FeignClient(name = "cart-service")
public interface CartFeignClient {

    @GetMapping("/api/v1/cart")
    CartDto getCart(@RequestHeader("X-User-Id") UUID userId);

    @DeleteMapping("/api/v1/cart")
    void clearCart(@RequestHeader("X-User-Id") UUID userId);
}
