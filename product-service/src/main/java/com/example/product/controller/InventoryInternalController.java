package com.example.product.controller;

import com.example.product.dto.request.InventoryReleaseRequest;
import com.example.product.dto.request.InventoryReserveRequest;
import com.example.product.dto.response.InventoryResponse;
import com.example.product.service.InventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/internal/inventory")
@RequiredArgsConstructor
public class InventoryInternalController {

    private final InventoryService inventoryService;

    @PostMapping("/reserve")
    public ResponseEntity<InventoryResponse> reserveInventory(
            @RequestBody InventoryReserveRequest request
    ) {
        return ResponseEntity.ok(
                inventoryService.reserveInventory(request)
        );
    }

    @PostMapping("/release")
    public ResponseEntity<Void> releaseInventory(
            @RequestBody InventoryReleaseRequest request
    ) {
        inventoryService.releaseInventory(request);

        return ResponseEntity.noContent().build();
    }
}