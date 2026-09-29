package com.example.order.saga.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InventoryItemRequest {

    private UUID productId;

    private UUID listingId;

    private Integer quantity;
}