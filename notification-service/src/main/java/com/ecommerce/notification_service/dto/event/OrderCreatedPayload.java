package com.ecommerce.notification_service.dto.event;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class OrderCreatedPayload {
    private UUID orderId;
    private String orderNumber;
    private UUID authUserId;
    private BigDecimal grandTotal;
    private String currencyCode;
    private String status;
    private List<OrderItemPayload> items;
}
