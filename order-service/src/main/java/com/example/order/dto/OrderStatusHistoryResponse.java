package com.example.order.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;


@Data
@Builder
public class OrderStatusHistoryResponse {

    private UUID id;
    private String fromStatus;
    private String toStatus;
    private UUID changedBy;
    private String reason;
    private Instant changedAt;
}
