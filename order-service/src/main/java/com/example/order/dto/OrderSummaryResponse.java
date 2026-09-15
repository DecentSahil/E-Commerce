package com.example.order.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;


@Data
@Builder
public class OrderSummaryResponse {

    private UUID id;
    private String orderNumber;
    private String status;
    private String paymentStatus;
    private BigDecimal grandTotal;
    private String currencyCode;
    private int itemCount;
    private Instant createdAt;
    private Instant updatedAt;
}
