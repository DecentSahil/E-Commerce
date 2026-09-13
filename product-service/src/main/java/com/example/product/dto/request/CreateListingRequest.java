package com.example.product.dto.request;

import com.example.product.entity.ListingCondition;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateListingRequest {

    @NotNull(message = "Product ID is required")
    private UUID productId;

    @NotNull(message = "Selling price is required")
    @DecimalMin(
            value = "0.01",
            message = "Selling price must be greater than zero"
    )
    private BigDecimal sellingPrice;

    @NotBlank(message = "Currency is required")
    @Size(max = 10, message = "Currency must not exceed 10 characters")
    @Builder.Default
    private String currency = "INR";

    @NotNull(message = "Stock quantity is required")
    @Min(
            value = 0,
            message = "Stock quantity cannot be negative"
    )
    private Integer stockQuantity;

    @NotNull(message = "Condition is required")
    private ListingCondition condition;
}