package com.example.order.controller;

import com.example.order.dto.*;
import com.example.order.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class OrderController {

    private static final String IDEMPOTENCY_KEY_HEADER = "Idempotency-Key";
    private static final String USER_ID_HEADER = "X-User-Id";
    private static final String USER_ROLE_HEADER = "X-User-Role";

    private final OrderService orderService;

    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(
            @Valid @RequestBody CreateOrderRequest request,
            @RequestHeader(value = IDEMPOTENCY_KEY_HEADER, required = false)
            String idempotencyKey,
            @RequestHeader(USER_ID_HEADER) UUID authUserId) {

        OrderResponse response =
                orderService.createOrder(authUserId, idempotencyKey, request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @PostMapping("/checkout")
    public ResponseEntity<OrderResponse> checkoutCart(
            @Valid @RequestBody CheckoutCartRequest request,
            @RequestHeader(value = IDEMPOTENCY_KEY_HEADER, required = false)
            String idempotencyKey,
            @RequestHeader(USER_ID_HEADER) UUID authUserId) {

        OrderResponse response =
                orderService.createOrderFromCart(
                        authUserId,
                        idempotencyKey,
                        request
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @GetMapping
    public ResponseEntity<Page<OrderSummaryResponse>> getMyOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestHeader(USER_ID_HEADER) UUID authUserId) {

        Pageable pageable = PageRequest.of(
                page,
                Math.min(size, 100),
                Sort.by(Sort.Direction.DESC, "createdAt")
        );

        return ResponseEntity.ok(
                orderService.getOrdersForUser(authUserId, pageable)
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> getMyOrder(
            @PathVariable UUID id,
            @RequestHeader(USER_ID_HEADER) UUID authUserId) {

        return ResponseEntity.ok(
                orderService.getOrderForUser(id, authUserId)
        );
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<OrderResponse> cancelOrder(
            @PathVariable UUID id,
            @RequestParam(required = false) String reason,
            @RequestHeader(USER_ID_HEADER) UUID authUserId) {

        return ResponseEntity.ok(
                orderService.cancelOrder(id, authUserId, reason)
        );
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<List<OrderStatusHistoryResponse>> getOrderHistory(
            @RequestHeader(USER_ROLE_HEADER) String role,
            @PathVariable UUID id,
            @RequestHeader(USER_ID_HEADER) UUID authUserId) {

        boolean isAdmin = "ADMIN".equals(role);

        return ResponseEntity.ok(
                orderService.getOrderStatusHistory(
                        id,
                        authUserId,
                        isAdmin
                )
        );
    }

    @GetMapping("/admin/all")
    public ResponseEntity<Page<OrderSummaryResponse>> getAllOrdersAdmin(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(
                page,
                Math.min(size,100),
                Sort.by(Sort.Direction.DESC,"createdAt")
        );

        return ResponseEntity.ok(
                orderService.getAllOrdersAdmin(pageable)
        );
    }

    @GetMapping("/admin/{id}")
    public ResponseEntity<OrderResponse> getOrderAdmin(
            @PathVariable UUID id) {

        return ResponseEntity.ok(
                orderService.getOrderByIdAdmin(id)
        );
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<OrderResponse> updateOrderStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateOrderStatusRequest request,
            @RequestHeader(USER_ID_HEADER) UUID adminId) {

        return ResponseEntity.ok(
                orderService.updateOrderStatusAdmin(
                        id,
                        adminId,
                        request
                )
        );
    }
}