package com.example.order.client.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CartItemDto {

    private UUID id;
    private UUID productId;
    private UUID listingId;
    private UUID sellerId;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal subtotal;
}
