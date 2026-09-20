package com.example.product.event.impl;

import com.example.product.event.ProductEventPublisher;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Slf4j
@Service
@ConditionalOnMissingBean(ProductEventPublisher.class)
public class LoggingProductEventPublisher implements ProductEventPublisher {

    @Override
    public void publishProductCreated(
            UUID productId,
            String name,
            String category,
            String brand
    ) {

        log.info(
                "[EVENT_PUBLISHED] PRODUCT_CREATED -> id: {}, name: '{}', category: '{}', brand: '{}'",
                productId,
                name,
                category,
                brand
        );
    }

    @Override
    public void publishProductUpdated(
            UUID productId,
            String name,
            String category,
            String brand,
            String status
    ) {

        log.info(
                "[EVENT_PUBLISHED] PRODUCT_UPDATED -> id: {}, name: '{}', category: '{}', brand: '{}', status: {}",
                productId,
                name,
                category,
                brand,
                status
        );
    }

    @Override
    public void publishProductDeleted(UUID productId) {

        log.info(
                "[EVENT_PUBLISHED] PRODUCT_DELETED -> id: {}",
                productId
        );
    }

    @Override
    public void publishListingCreated(
            UUID listingId,
            UUID productId,
            UUID sellerId
    ) {

        log.info(
                "[EVENT_PUBLISHED] LISTING_CREATED -> listingId: {}, productId: {}, sellerId: {}",
                listingId,
                productId,
                sellerId
        );
    }

    @Override
    public void publishListingUpdated(
            UUID listingId,
            UUID productId,
            UUID sellerId
    ) {

        log.info(
                "[EVENT_PUBLISHED] LISTING_UPDATED -> listingId: {}, productId: {}, sellerId: {}",
                listingId,
                productId,
                sellerId
        );
    }

    @Override
    public void publishListingDeleted(
            UUID listingId,
            UUID productId,
            UUID sellerId
    ) {

        log.info(
                "[EVENT_PUBLISHED] LISTING_DELETED -> listingId: {}, productId: {}, sellerId: {}",
                listingId,
                productId,
                sellerId
        );
    }

    @Override
    public void publishListingStockChanged(
            UUID listingId,
            UUID productId,
            UUID sellerId,
            Integer oldStock,
            Integer newStock
    ) {

        log.info(
                "[EVENT_PUBLISHED] LISTING_STOCK_CHANGED -> listingId: {}, productId: {}, sellerId: {}, oldStock: {}, newStock: {}",
                listingId,
                productId,
                sellerId,
                oldStock,
                newStock
        );
    }
}