package com.example.order.mapper;

import com.example.order.dto.*;
import com.example.order.entity.Order;
import com.example.order.entity.OrderItem;
import com.example.order.entity.OrderStatusHistory;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;


@Component
public class OrderMapper {

    // ── Entity → Response ─────────────────────────────────────────────────────

    public OrderResponse toOrderResponse(Order order) {
        return OrderResponse.builder()
                .id(order.getId())
                .authUserId(order.getAuthUserId())
                .orderNumber(order.getOrderNumber())
                .status(order.getStatus().name())
                .paymentStatus(order.getPaymentStatus().name())
                .currencyCode(order.getCurrencyCode())
                .subtotal(order.getSubtotal())
                .discountTotal(order.getDiscountTotal())
                .shippingCost(order.getShippingCost())
                .taxTotal(order.getTaxTotal())
                .grandTotal(order.getGrandTotal())
                .shippingAddress(toShippingAddressResponse(order))
                .items(order.getItems().stream()
                        .map(this::toOrderItemResponse)
                        .collect(Collectors.toList()))
                .customerNote(order.getCustomerNote())
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .confirmedAt(order.getConfirmedAt())
                .shippedAt(order.getShippedAt())
                .deliveredAt(order.getDeliveredAt())
                .cancelledAt(order.getCancelledAt())
                .build();
    }

    public OrderSummaryResponse toOrderSummaryResponse(Order order) {
        return OrderSummaryResponse.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .status(order.getStatus().name())
                .paymentStatus(order.getPaymentStatus().name())
                .grandTotal(order.getGrandTotal())
                .currencyCode(order.getCurrencyCode())
                .itemCount(order.getItems() != null ? order.getItems().size() : 0)
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }

    public OrderItemResponse toOrderItemResponse(OrderItem item) {
        return OrderItemResponse.builder()
                .id(item.getId())
                .productId(item.getProductId())
                .listingId(item.getListingId())
                .sellerId(item.getSellerId())
                .productSku(item.getProductSku())
                .productName(item.getProductName())
                .productImageUrl(item.getProductImageUrl())
                .quantity(item.getQuantity())
                .unitPrice(item.getUnitPrice())
                .discountAmount(item.getDiscountAmount())
                .lineTotal(item.getLineTotal())
                .build();
    }

    public OrderStatusHistoryResponse toStatusHistoryResponse(OrderStatusHistory entry) {
        return OrderStatusHistoryResponse.builder()
                .id(entry.getId())
                .fromStatus(entry.getFromStatus() != null ? entry.getFromStatus().name() : null)
                .toStatus(entry.getToStatus().name())
                .changedBy(entry.getChangedBy())
                .reason(entry.getReason())
                .changedAt(entry.getChangedAt())
                .build();
    }

    public List<OrderStatusHistoryResponse> toStatusHistoryResponseList(
            List<OrderStatusHistory> history) {
        return history.stream()
                .map(this::toStatusHistoryResponse)
                .collect(Collectors.toList());
    }

    // ── Shipping Address ───────────────────────────────────────────────────────

    private ShippingAddressResponse toShippingAddressResponse(Order order) {
        return ShippingAddressResponse.builder()
                .fullName(order.getShipFullName())
                .phone(order.getShipPhone())
                .line1(order.getShipLine1())
                .line2(order.getShipLine2())
                .city(order.getShipCity())
                .state(order.getShipState())
                .postalCode(order.getShipPostalCode())
                .countryCode(order.getShipCountryCode())
                .build();
    }
}
