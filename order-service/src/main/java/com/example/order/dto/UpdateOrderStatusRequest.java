package com.example.order.dto;

import com.example.order.entity.OrderStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;


@Data
public class UpdateOrderStatusRequest {

    @NotNull(message = "New status is required")
    private OrderStatus status;

    @Size(max = 500, message = "Reason must not exceed 500 characters")
    private String reason;
}
