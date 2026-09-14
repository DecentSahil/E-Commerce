package com.example.cart.client.dto;

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
public class ListingDto {

    private UUID id;
    private UUID productId;
    private UUID sellerId;
    private BigDecimal sellingPrice;
    private String currency;
    private Integer stockQuantity;
    private String status;
    private String condition;
}
