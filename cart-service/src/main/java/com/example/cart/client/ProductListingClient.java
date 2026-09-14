package com.example.cart.client;

import com.example.cart.client.dto.ListingDto;

import java.util.Optional;
import java.util.UUID;

public interface ProductListingClient {

    Optional<ListingDto> getListing(UUID productId, UUID listingId);
}
