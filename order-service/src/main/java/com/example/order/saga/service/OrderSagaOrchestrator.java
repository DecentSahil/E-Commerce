package com.example.order.saga.service;

import com.example.order.dto.request.CreateOrderRequest;
import com.example.order.dto.response.OrderResponse;

import java.util.UUID;

public interface OrderSagaOrchestrator {

    OrderResponse createOrder(
            UUID authUserId,
            String idempotencyKey,
            CreateOrderRequest request
    );
}