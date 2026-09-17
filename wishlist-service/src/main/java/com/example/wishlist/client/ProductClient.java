package com.example.wishlist.client;

import java.util.UUID;

public interface ProductClient {

    boolean existsById(UUID productId);
}
