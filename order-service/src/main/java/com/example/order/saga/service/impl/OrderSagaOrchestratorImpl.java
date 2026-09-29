package com.example.order.saga.service.impl;

import com.example.order.dto.request.CreateOrderRequest;
import com.example.order.dto.response.OrderResponse;
import com.example.order.entity.Order;
import com.example.order.saga.client.ProductClient;
import com.example.order.saga.client.PaymentClient;
import com.example.order.saga.dto.*;
import com.example.order.saga.service.OrderSagaOrchestrator;
import com.example.order.service.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderSagaOrchestratorImpl
        implements OrderSagaOrchestrator {

    private final OrderService orderService;
    private final PaymentClient paymentClient;
    private final ProductClient productClient;

    @Override
    public OrderResponse createOrder(
            UUID authUserId,
            String idempotencyKey,
            CreateOrderRequest request) {

        Order order = null;
//        PaymentResponse payment = null;
        InventoryResponse inventory = null;

        try {

            order = orderService.createPendingOrderForSaga(
                    authUserId,
                    idempotencyKey,
                    request
            );

            log.info(
                    "Saga STEP 1 completed: orderId={}",
                    order.getId()
            );

//            payment = paymentClient.processPayment(
//                    new PaymentRequest(
//                            order.getId(),
//                            order.getGrandTotal(),
//                            order.getCurrencyCode()
//                    )
//            );

//            log.info(
//                    "Saga STEP 2 completed: paymentId={} orderId={}",
//                    payment.getPaymentId(),
//                    order.getId()
//            );

            List<InventoryItemRequest> items = order.getItems()
                    .stream()
                    .map(item -> new InventoryItemRequest(
                            item.getProductId(),
                            item.getListingId(),
                            item.getQuantity()
                    ))
                    .toList();

            inventory = productClient.reserveInventory(
                    new InventoryRequest(order.getId(), items)
            );

            log.info(
                    "Saga STEP 3 completed: reservationId={} orderId={}",
                    inventory.getReservationId(),
                    order.getId()
            );

            orderService.confirmOrderForSaga(
                    order.getId()
            );


            log.info(
                    "Saga completed successfully: orderId={}",
                    order.getId()
            );


            return orderService.getOrderForUser(
                    order.getId(),
                    authUserId
            );

        } catch (Exception e) {

            log.error(
                    "Order Saga failed: orderId={}",
                    order != null ? order.getId() : null,
                    e
            );

            compensate(
                    order,
//                    payment,
                    inventory
            );

            throw new RuntimeException(
                    "Order creation failed",
                    e
            );
        }
    }


    private void compensate(
            Order order,
//            PaymentResponse payment,
            InventoryResponse inventory) {

        UUID orderId =
                order != null ? order.getId() : null;

        log.warn(
                "Starting Saga compensation: orderId={}",
                orderId
        );

        if (inventory != null) {

            try {

                productClient.releaseInventory(
                        inventory.getReservationId()
                );

                log.info(
                        "Inventory compensation completed: reservationId={}",
                        inventory.getReservationId()
                );

            } catch (Exception e) {

                log.error(
                        "Inventory compensation failed: reservationId={}",
                        inventory.getReservationId(),
                        e
                );
            }
        }

//        if (payment != null) {
//
//            try {
//
//                paymentClient.refundPayment(
//                        payment.getPaymentId()
//                );
//
//                log.info(
//                        "Payment compensation completed: paymentId={}",
//                        payment.getPaymentId()
//                );
//
//            } catch (Exception e) {
//
//                log.error(
//                        "Payment compensation failed: paymentId={}",
//                        payment.getPaymentId(),
//                        e
//                );
//            }
//        }

        if (order != null) {

            try {

                orderService.cancelOrderForSaga(
                        order.getId()
                );

                log.info(
                        "Order compensation completed: orderId={}",
                        order.getId()
                );

            } catch (Exception e) {

                log.error(
                        "Order compensation failed: orderId={}",
                        order.getId(),
                        e
                );
            }
        }
    }
}