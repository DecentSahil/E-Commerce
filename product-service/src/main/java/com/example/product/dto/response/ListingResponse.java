package com.example.product.dto.response;

import com.example.product.entity.ListingCondition;
import com.example.product.entity.ListingStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ListingResponse {

    private UUID id;

    private UUID productId;

    private UUID sellerId;

    private BigDecimal sellingPrice;

    private String currency;

    private Integer stockQuantity;

    private ListingCondition condition;

    private ListingStatus status;

    private Instant createdAt;

    private Instant updatedAt;
}