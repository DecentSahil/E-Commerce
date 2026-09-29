package com.example.product.service.impl;

import com.example.product.dto.request.InventoryReleaseRequest;
import com.example.product.dto.request.InventoryReserveItemRequest;
import com.example.product.dto.request.InventoryReserveRequest;
import com.example.product.dto.response.InventoryResponse;
import com.example.product.service.InventoryService;
import com.example.product.service.ListingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class InventoryServiceImpl implements InventoryService {

    private final ListingService listingService;

    @Override
    @Transactional
    public InventoryResponse reserveInventory(
            InventoryReserveRequest request
    ) {

        if (request.getItems() == null ||
                request.getItems().isEmpty()) {

            throw new IllegalArgumentException(
                    "Inventory reservation requires at least one item"
            );
        }

        for (InventoryReserveItemRequest item :
                request.getItems()) {

            if (item.getListingId() == null) {
                throw new IllegalArgumentException(
                        "Listing ID cannot be null"
                );
            }

            if (item.getQuantity() == null ||
                    item.getQuantity() <= 0) {

                throw new IllegalArgumentException(
                        "Quantity must be greater than zero"
                );
            }

            listingService.deductStock(
                    item.getListingId(),
                    item.getQuantity()
            );

            log.info(
                    "Stock deducted: orderId={}, listingId={}, quantity={}",
                    request.getOrderId(),
                    item.getListingId(),
                    item.getQuantity()
            );
        }

        log.info(
                "Inventory reserved successfully: orderId={}",
                request.getOrderId()
        );

        return InventoryResponse.builder()
                .orderId(request.getOrderId())
                .status("RESERVED")
                .build();
    }


    @Override
    @Transactional
    public void releaseInventory(
            InventoryReleaseRequest request
    ) {

        if (request.getItems() == null ||
                request.getItems().isEmpty()) {

            return;
        }

        for (InventoryReserveItemRequest item :
                request.getItems()) {

            if (item.getListingId() == null) {
                throw new IllegalArgumentException(
                        "Listing ID cannot be null"
                );
            }

            if (item.getQuantity() == null ||
                    item.getQuantity() <= 0) {

                throw new IllegalArgumentException(
                        "Quantity must be greater than zero"
                );
            }

            listingService.restoreStock(
                    item.getListingId(),
                    item.getQuantity()
            );

            log.info(
                    "Stock restored: orderId={}, listingId={}, quantity={}",
                    request.getOrderId(),
                    item.getListingId(),
                    item.getQuantity()
            );
        }

        log.info(
                "Inventory released successfully: orderId={}",
                request.getOrderId()
        );
    }
}