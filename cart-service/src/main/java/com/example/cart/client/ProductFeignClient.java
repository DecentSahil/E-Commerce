package com.example.cart.client;

import com.example.cart.client.dto.ListingDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.UUID;

@FeignClient(name = "product-service")
public interface ProductFeignClient {

    @GetMapping("/api/v1/listings/{listingId}")
    ListingDto getListingById(@PathVariable("listingId") UUID listingId);
}
