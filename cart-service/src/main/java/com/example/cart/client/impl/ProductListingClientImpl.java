package com.example.cart.client.impl;

import com.example.cart.client.ProductFeignClient;
import com.example.cart.client.ProductListingClient;
import com.example.cart.client.dto.ListingDto;
import com.example.cart.client.dto.ProductDto;
import feign.FeignException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class ProductListingClientImpl implements ProductListingClient {

    private final ProductFeignClient productFeignClient;

    @Override
    public Optional<ListingDto> getListing(UUID productId, UUID listingId) {
        try {
            ListingDto dto = productFeignClient.getListingById(listingId);
            return Optional.ofNullable(dto);
        } catch (FeignException.NotFound ex) {
            log.warn("Listing not found with id: {}", listingId);
            return Optional.empty();
        } catch (Exception ex) {
            log.error("Error communicating with product-service for listingId {}: {}", listingId, ex.getMessage());
            throw ex;
        }
    }

    @Override
    public Optional<ProductDto> getProduct(UUID productId) {
        if (productId == null) {
            return Optional.empty();
        }
        try {
            ProductDto dto = productFeignClient.getProductById(productId);
            return Optional.ofNullable(dto);
        } catch (FeignException.NotFound ex) {
            log.warn("Product not found with id: {}", productId);
            return Optional.empty();
        } catch (Exception ex) {
            log.error("Error communicating with product-service for productId {}: {}", productId, ex.getMessage());
            return Optional.empty();
        }
    }
}
