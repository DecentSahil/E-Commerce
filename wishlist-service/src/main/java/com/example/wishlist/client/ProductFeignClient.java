package com.example.wishlist.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.Map;
import java.util.UUID;

@FeignClient(name = "product-service")
public interface ProductFeignClient {

    @GetMapping("/api/v1/products/{productId}")
    Map<String, Object> getProductById(@PathVariable("productId") UUID productId);
}
