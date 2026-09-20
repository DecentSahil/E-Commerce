package com.example.wishlist.client;

import feign.FeignException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class ProductClientImpl implements ProductClient {

    private final ProductFeignClient productFeignClient;

    @Override
    public boolean existsById(UUID productId) {
        if (productId == null) {
            return false;
        }
        try {
            return productFeignClient.getProductById(productId) != null;
        } catch (FeignException.NotFound ex) {
            log.warn("Product not found with id: {}", productId);
            return false;
        } catch (Exception ex) {
            log.error("Error communicating with product-service for productId {}: {}", productId, ex.getMessage());
            throw ex;
        }
    }
}
