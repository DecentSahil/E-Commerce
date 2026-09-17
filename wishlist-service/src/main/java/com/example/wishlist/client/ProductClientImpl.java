package com.example.wishlist.client;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class ProductClientImpl implements ProductClient {

    private static final Logger log = LoggerFactory.getLogger(ProductClientImpl.class);

    @Override
    public boolean existsById(UUID productId) {
        log.debug("Verifying product existence for productId: {}", productId);
        return productId != null;
    }
}
