package com.example.order.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class CreateOrderRequest {

    @NotEmpty(message = "An order must contain at least one item")
    @Size(max = 50, message = "An order cannot contain more than 50 line items")
    @Valid
    private List<OrderItemRequest> items;

    @NotNull(message = "Shipping address is required")
    private UUID shippingAddressId;

    @Size(max = 1000, message = "Customer note must not exceed 1000 characters")
    private String customerNote;
}