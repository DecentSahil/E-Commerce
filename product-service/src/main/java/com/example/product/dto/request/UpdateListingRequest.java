package com.example.product.dto.request;

import com.example.product.entity.ListingCondition;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateListingRequest {

    @DecimalMin(
            value = "0.01",
            message = "Selling price must be greater than zero"
    )
    private BigDecimal sellingPrice;

    @Size(max = 10)
    private String currency;

    @Min(
            value = 0,
            message = "Stock quantity cannot be negative"
    )
    private Integer stockQuantity;

    private ListingCondition condition;
}