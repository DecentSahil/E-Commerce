package com.example.product.service;

import com.example.product.dto.request.InventoryReleaseRequest;
import com.example.product.dto.request.InventoryReserveRequest;
import com.example.product.dto.response.InventoryResponse;

public interface InventoryService {

    InventoryResponse reserveInventory(
            InventoryReserveRequest request
    );

    void releaseInventory(
            InventoryReleaseRequest request
    );
}