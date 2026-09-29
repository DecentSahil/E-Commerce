package com.example.order.client;

import com.example.order.client.dto.ListingDto;
import com.example.order.client.dto.ProductDto;

import java.util.Optional;
import java.util.UUID;

public interface ProductClient {

    boolean checkAvailability(
            UUID productId,
            int quantity
    );

    Optional<ListingDto> getListing(
            UUID listingId
    );

    Optional<ProductDto> getProduct(
            UUID productId
    );

    void deductStock(
            UUID listingId,
            int quantity
    );

    void restoreStock(
            UUID listingId,
            int quantity
    );
}