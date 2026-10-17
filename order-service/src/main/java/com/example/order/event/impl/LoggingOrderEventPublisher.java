package com.example.order.event.impl;

import com.example.order.entity.Order;
import com.example.order.entity.OrderStatus;
import com.example.order.event.OrderEventPublisher;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.UUID;


@Slf4j
@Component
public class LoggingOrderEventPublisher implements OrderEventPublisher {

    @Override
    public void publishOrderCreated(Order order) {
        log.info("[EVENT][order.created] orderId={} orderNumber={} userId={} grandTotal={} currency={}",
                order.getId(),
                order.getOrderNumber(),
                order.getAuthUserId(),
                order.getGrandTotal(),
                order.getCurrencyCode());
    }

    @Override
    public void publishOrderConfirmed(Order order) {
        log.info("[EVENT][order.confirmed] orderId={} orderNumber={} userId={} grandTotal={} currency={}",
                order.getId(),
                order.getOrderNumber(),
                order.getAuthUserId(),
                order.getGrandTotal(),
                order.getCurrencyCode());
    }

    @Override
    public void publishOrderStatusChanged(UUID orderId, String orderNumber, UUID authUserId,
                                           OrderStatus fromStatus, OrderStatus toStatus) {
        log.info("[EVENT][order.status.changed] orderId={} orderNumber={} userId={} from={} to={}",
                orderId, orderNumber, authUserId, fromStatus, toStatus);
    }

    @Override
    public void publishOrderRefunded(UUID orderId, String orderNumber, UUID authUserId,
                                     java.math.BigDecimal refundAmount, String currencyCode, String reason) {
        log.info("[EVENT][order.refunded] orderId={} orderNumber={} userId={} refundAmount={} currency={} reason={}",
                orderId, orderNumber, authUserId, refundAmount, currencyCode, reason);
    }

    @Override
    public void publishOrderCancelled(UUID orderId, String orderNumber,
                                      UUID authUserId, String reason) {
        log.info("[EVENT][order.cancelled] orderId={} orderNumber={} userId={} reason={}",
                orderId, orderNumber, authUserId, reason);
    }

    @Override
    public void publishOrderDelivered(UUID orderId, String orderNumber, UUID authUserId) {
        log.info("[EVENT][order.delivered] orderId={} orderNumber={} userId={}",
                orderId, orderNumber, authUserId);
    }
}
