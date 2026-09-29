package com.example.order.client;

import com.example.order.client.dto.ListingDto;
import com.example.order.client.dto.ProductDto;
import feign.FeignException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class ProductClientImpl implements ProductClient {

    private final ProductFeignClient productFeignClient;

    @Override
    public boolean checkAvailability(
            UUID productId,
            int quantity) {

        try {

            ProductDto product =
                    productFeignClient.getProductById(productId);

            return product != null;

        } catch (FeignException.NotFound e) {

            log.warn(
                    "Product not found: {}",
                    productId
            );

            return false;

        } catch (Exception e) {

            log.error(
                    "Failed to reach Product Service for product {}",
                    productId,
                    e
            );

            throw e;
        }
    }

    @Override
    public Optional<ProductDto> getProduct(
            UUID productId) {

        try {

            ProductDto product =
                    productFeignClient.getProductById(productId);

            return Optional.ofNullable(product);

        } catch (FeignException.NotFound e) {

            log.warn(
                    "Product not found: {}",
                    productId
            );

            return Optional.empty();

        } catch (Exception e) {

            log.error(
                    "Failed to retrieve product {}",
                    productId,
                    e
            );

            throw e;
        }
    }

    @Override
    public Optional<ListingDto> getListing(
            UUID listingId) {

        try {

            ListingDto listing =
                    productFeignClient.getListingById(listingId);

            return Optional.ofNullable(listing);

        } catch (FeignException.NotFound e) {

            log.warn(
                    "Listing not found: {}",
                    listingId
            );

            return Optional.empty();

        } catch (Exception e) {

            log.error(
                    "Failed to retrieve listing {}",
                    listingId,
                    e
            );

            throw e;
        }
    }

    @Override
    public void deductStock(
            UUID listingId,
            int quantity) {

        try {

            productFeignClient.deductStock(
                    listingId,
                    quantity
            );

        } catch (Exception e) {

            log.error(
                    "Failed to deduct stock for listing {}",
                    listingId,
                    e
            );

            throw e;
        }
    }

    @Override
    public void restoreStock(
            UUID listingId,
            int quantity) {

        try {

            productFeignClient.restoreStock(
                    listingId,
                    quantity
            );

        } catch (Exception e) {

            log.error(
                    "Failed to restore stock for listing {}",
                    listingId,
                    e
            );

            throw e;
        }
    }
}