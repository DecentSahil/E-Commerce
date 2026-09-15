package com.example.order.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;


@Data
public class OrderItemRequest {

    @NotNull(message = "Product ID is required")
    private UUID productId;

    private UUID listingId;

    private UUID sellerId;

    private String productSku;

    @NotBlank(message = "Product name is required")
    @Size(max = 300, message = "Product name must not exceed 300 characters")
    private String productName;

    @Size(max = 2048, message = "Image URL must not exceed 2048 characters")
    private String productImageUrl;

    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    @Max(value = 999, message = "Quantity cannot exceed 999 per item")
    private Integer quantity;

    @NotNull(message = "Unit price is required")
    @DecimalMin(value = "0.00", message = "Unit price must be non-negative")
    @Digits(integer = 15, fraction = 4, message = "Invalid unit price format")
    private BigDecimal unitPrice;

    @DecimalMin(value = "0.00", message = "Discount amount must be non-negative")
    @Digits(integer = 15, fraction = 4, message = "Invalid discount amount format")
    private BigDecimal discountAmount;
}
