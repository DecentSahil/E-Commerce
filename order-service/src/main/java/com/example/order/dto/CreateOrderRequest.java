package com.example.order.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;


@Data
public class CreateOrderRequest {

    @NotEmpty(message = "An order must contain at least one item")
    @Size(max = 50, message = "An order cannot contain more than 50 line items")
    @Valid
    private List<OrderItemRequest> items;

    @NotNull(message = "Shipping address is required")
    @Valid
    private ShippingAddressRequest shippingAddress;

    @DecimalMin(value = "0.00", message = "Shipping cost must be non-negative")
    @Digits(integer = 10, fraction = 4, message = "Invalid shipping cost format")
    private BigDecimal shippingCost;

    @DecimalMin(value = "0.00", message = "Tax total must be non-negative")
    @Digits(integer = 10, fraction = 4, message = "Invalid tax total format")
    private BigDecimal taxTotal;

    @Pattern(regexp = "^[A-Z]{3}$", message = "Currency code must be a 3-letter ISO 4217 code")
    private String currencyCode;

    @Size(max = 1000, message = "Customer note must not exceed 1000 characters")
    private String customerNote;
}
