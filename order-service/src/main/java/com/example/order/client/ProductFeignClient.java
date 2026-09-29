package com.example.order.client;

import com.example.order.client.dto.ListingDto;
import com.example.order.client.dto.ProductDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@FeignClient(
        name = "PRODUCT-SERVICE",
        contextId = "productFeignClient"
)
public interface ProductFeignClient {

    @GetMapping("/api/v1/products/{productId}")
    ProductDto getProductById(
            @PathVariable("productId") UUID productId
    );

    @GetMapping("/api/v1/listings/{listingId}")
    ListingDto getListingById(
            @PathVariable("listingId") UUID listingId
    );

    @PostMapping("/api/v1/listings/{listingId}/deduct-stock")
    ListingDto deductStock(
            @PathVariable("listingId") UUID listingId,
            @RequestParam("quantity") int quantity
    );

    @PostMapping("/api/v1/listings/{listingId}/restore-stock")
    ListingDto restoreStock(
            @PathVariable("listingId") UUID listingId,
            @RequestParam("quantity") int quantity
    );


}