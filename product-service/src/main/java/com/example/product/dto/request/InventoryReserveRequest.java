package com.example.product.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InventoryReserveRequest {

    private UUID orderId;

    private List<InventoryReserveItemRequest> items;
}