package com.example.order.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;


@Data
@Builder
public class OrderItemResponse {

    private UUID id;
    private UUID productId;
    private UUID listingId;
    private UUID sellerId;
    private String productSku;
    private String productName;
    private String productImageUrl;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal discountAmount;
    private BigDecimal lineTotal;
}
