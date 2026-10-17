package com.example.wishlist.client;

import com.example.wishlist.client.dto.ProductDto;

import java.util.Optional;
import java.util.UUID;

public interface ProductClient {

    boolean existsById(UUID productId);

    Optional<ProductDto> getProduct(UUID productId);
}
