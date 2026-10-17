package com.example.cart.client;

import com.example.cart.client.dto.ListingDto;
import com.example.cart.client.dto.ProductDto;

import java.util.Optional;
import java.util.UUID;

public interface ProductListingClient {

    Optional<ListingDto> getListing(UUID productId, UUID listingId);

    Optional<ProductDto> getProduct(UUID productId);
}
