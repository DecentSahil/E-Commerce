package com.example.order.saga.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InventoryResponse {

    private UUID reservationId;

    private UUID orderId;

    private String status;
}