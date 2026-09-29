package com.example.order.service;

import com.example.order.dto.request.CheckoutCartRequest;
import com.example.order.dto.request.CreateOrderRequest;
import com.example.order.dto.request.UpdateOrderStatusRequest;
import com.example.order.dto.response.OrderResponse;
import com.example.order.dto.response.OrderStatusHistoryResponse;
import com.example.order.dto.response.OrderSummaryResponse;
import com.example.order.entity.Order;
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

    Order createPendingOrderForSaga(
            UUID authUserId,
            String idempotencyKey,
            CreateOrderRequest request
    );

    void confirmOrderForSaga(UUID orderId);

    void cancelOrderForSaga(UUID orderId);

    List<OrderStatusHistoryResponse> getOrderStatusHistory(UUID orderId,
                                                           UUID authUserId,
                                                           boolean isAdmin);
}
