//package com.example.order.saga;
//
//import com.example.order.dto.request.CreateOrderRequest;
//import com.example.order.dto.response.OrderResponse;
//import com.example.order.entity.Order;
//import com.example.order.saga.client.InventoryClient;
//import com.example.order.saga.client.PaymentClient;
//import com.example.order.saga.dto.InventoryResponse;
//import com.example.order.saga.dto.PaymentRequest;
//import com.example.order.saga.dto.PaymentResponse;
//import com.example.order.service.OrderService;
//import lombok.RequiredArgsConstructor;
//import org.springframework.stereotype.Service;
//
//@Service
//@RequiredArgsConstructor
//public class OrderSagaOrchestrator {
//
//    private final OrderService orderService;
//    private final PaymentClient paymentClient;
//    private final InventoryClient inventoryClient;
//
//    public OrderResponse createOrder(CreateOrderRequest request) {
//
//        Order order = null;
//        PaymentResponse payment = null;
//        InventoryResponse inventory = null;
//
//        try {
//
//            // STEP 1
//            order = orderService.createPendingOrder(request);
//
//            // STEP 2
//            payment = paymentClient.processPayment(
//                    new PaymentRequest(
//                            order.getId(),
//                            request.getAmount()
//                    )
//            );
//
//            // STEP 3
//            inventory = inventoryClient.reserveInventory(
//                    new InventoryRequest(
//                            order.getId(),
//                            request.getProductId(),
//                            request.getQuantity()
//                    )
//            );
//
//            // STEP 4
//            orderService.confirmOrder(order.getId());
//
//            return new OrderResponse(
//                    order.getId(),
//                    "ORDER_CONFIRMED"
//            );
//
//        } catch (Exception e) {
//
//            compensate(
//                    order,
//                    payment,
//                    inventory
//            );
//
//            throw new RuntimeException(
//                    "Order Saga failed",
//                    e
//            );
//        }
//    }
//
//    private void compensate(
//            Order order,
//            PaymentResponse payment,
//            InventoryResponse inventory) {
//
//        // Release inventory if it was reserved
//        if (inventory != null) {
//
//            inventoryClient.releaseInventory(
//                    inventory.getReservationId()
//            );
//        }
//
//        // Refund payment if payment succeeded
//        if (payment != null) {
//
//            paymentClient.refundPayment(
//                    payment.getPaymentId()
//            );
//        }
//
//        // Cancel order
//        if (order != null) {
//
//            orderService.cancelOrder(
//                    order.getId()
//            );
//        }
//    }
//}