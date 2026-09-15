package com.example.order.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;


@Data
@Builder
public class OrderResponse {

    private UUID id;
    private UUID authUserId;
    private String orderNumber;
    private String status;
    private String paymentStatus;
    private String currencyCode;

    private BigDecimal subtotal;
    private BigDecimal discountTotal;
    private BigDecimal shippingCost;
    private BigDecimal taxTotal;
    private BigDecimal grandTotal;

    private ShippingAddressResponse shippingAddress;

    private List<OrderItemResponse> items;

    private String customerNote;

    private Instant createdAt;
    private Instant updatedAt;
    private Instant confirmedAt;
    private Instant shippedAt;
    private Instant deliveredAt;
    private Instant cancelledAt;
}
