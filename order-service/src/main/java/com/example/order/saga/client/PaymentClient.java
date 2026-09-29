package com.example.order.saga.client;

import com.example.order.saga.dto.PaymentRequest;
import com.example.order.saga.dto.PaymentResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@FeignClient(name = "PAYMENT-SERVICE")
public interface PaymentClient {

    @PostMapping("/internal/payments")
    PaymentResponse processPayment(
            @RequestBody PaymentRequest request
    );

    @PostMapping("/internal/payments/{paymentId}/refund")
    void refundPayment(
            @PathVariable UUID paymentId
    );
}