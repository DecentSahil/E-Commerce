package com.example.product.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InventoryReserveItemRequest {

    private UUID productId;

    private UUID listingId;

    private Integer quantity;
}