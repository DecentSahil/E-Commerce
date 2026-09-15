package com.example.order.service;

import com.example.order.dto.*;
import com.example.order.entity.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;


public interface OrderService {


    OrderResponse createOrder(UUID authUserId, String idempotencyKey, CreateOrderRequest request);


    OrderResponse createOrderFromCart(UUID authUserId, String idempotencyKey, CheckoutCartRequest request);


    OrderResponse getOrderForUser(UUID orderId, UUID authUserId);


    Page<OrderSummaryResponse> getOrdersForUser(UUID authUserId, Pageable pageable);


    OrderResponse cancelOrder(UUID orderId, UUID authUserId, String reason);


    OrderResponse getOrderByIdAdmin(UUID orderId);


    Page<OrderSummaryResponse> getAllOrdersAdmin(Pageable pageable);


    OrderResponse updateOrderStatusAdmin(UUID orderId, UUID adminId,
                                         UpdateOrderStatusRequest request);


    List<OrderStatusHistoryResponse> getOrderStatusHistory(UUID orderId,
                                                            UUID authUserId,
                                                            boolean isAdmin);
}
