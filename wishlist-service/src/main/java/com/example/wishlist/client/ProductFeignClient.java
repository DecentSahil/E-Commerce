package com.example.wishlist.client;

import com.example.wishlist.client.dto.ProductDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.UUID;

@FeignClient(name = "product-service")
public interface ProductFeignClient {

    @GetMapping("/api/v1/products/{productId}")
    ProductDto getProductById(@PathVariable("productId") UUID productId);
}
