package com.example.order.saga.client;

import com.example.order.saga.dto.InventoryRequest;
import com.example.order.saga.dto.InventoryResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@FeignClient(
        name = "PRODUCT-SERVICE",
        contextId = "sagaProductClient"
)
public interface ProductClient {

    @PostMapping("/internal/inventory/reserve")
    InventoryResponse reserveInventory(
            @RequestBody InventoryRequest request
    );

    @PostMapping("/internal/inventory/{reservationId}/release")
    void releaseInventory(
            @PathVariable UUID reservationId
    );
}