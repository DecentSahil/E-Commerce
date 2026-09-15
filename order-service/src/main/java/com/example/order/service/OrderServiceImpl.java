package com.example.order.service;

import com.example.order.client.CartClient;
import com.example.order.client.ProductClient;
import com.example.order.client.dto.CartDto;
import com.example.order.client.dto.CartItemDto;
import com.example.order.dto.*;
import com.example.order.entity.*;
import com.example.order.event.OrderEventPublisher;
import com.example.order.exception.InvalidOrderStateException;
import com.example.order.exception.OrderNotFoundException;
import com.example.order.mapper.OrderMapper;
import com.example.order.repository.OrderRepository;
import com.example.order.repository.OrderStatusHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;


@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OrderServiceImpl implements OrderService {

    private static final Set<OrderStatus> TERMINAL_STATES =
            Set.of(OrderStatus.DELIVERED, OrderStatus.CANCELLED, OrderStatus.FAILED);

    private static final Set<OrderStatus> CUSTOMER_CANCELLABLE_STATES =
            Set.of(OrderStatus.PENDING, OrderStatus.CONFIRMED);

    private final OrderRepository            orderRepository;
    private final OrderStatusHistoryRepository historyRepository;
    private final OrderMapper                orderMapper;
    private final ProductClient              productClient;
    private final CartClient                 cartClient;
    private final OrderEventPublisher        eventPublisher;

    private final AtomicLong orderSequence = new AtomicLong(System.currentTimeMillis() % 100_000);


    @Override
    @Transactional
    public OrderResponse createOrder(UUID authUserId, String idempotencyKey,
                                     CreateOrderRequest request) {
        if (StringUtils.hasText(idempotencyKey)) {
            return orderRepository.findByIdempotencyKey(idempotencyKey)
                    .map(existing -> {
                        log.info("Idempotent order found for key={} orderId={}", idempotencyKey, existing.getId());
                        return orderRepository.findByIdWithItems(existing.getId())
                                .map(orderMapper::toOrderResponse)
                                .orElseGet(() -> orderMapper.toOrderResponse(existing));
                    })
                    .orElseGet(() -> doCreateOrder(authUserId, idempotencyKey, request));
        }

        return doCreateOrder(authUserId, idempotencyKey, request);
    }

    private OrderResponse doCreateOrder(UUID authUserId, String idempotencyKey,
                                        CreateOrderRequest request) {

        Order order = buildOrderEntity(authUserId, idempotencyKey, request);

        OrderStatusHistory initialHistory = OrderStatusHistory.builder()
                .fromStatus(null)
                .toStatus(OrderStatus.PENDING)
                .changedBy(authUserId)
                .reason("Order placed by customer")
                .build();
        order.addStatusHistory(initialHistory);

        Order saved = orderRepository.save(order);

        log.info("Order created: orderId={} orderNumber={} userId={} grandTotal={}",
                saved.getId(), saved.getOrderNumber(), authUserId, saved.getGrandTotal());

        eventPublisher.publishOrderCreated(saved);

        return orderMapper.toOrderResponse(saved);
    }

    @Override
    @Transactional
    public OrderResponse createOrderFromCart(UUID authUserId, String idempotencyKey, CheckoutCartRequest request) {
        if (StringUtils.hasText(idempotencyKey)) {
            Optional<Order> existing = orderRepository.findByIdempotencyKey(idempotencyKey);
            if (existing.isPresent()) {
                log.info("Duplicate order checkout detected for idempotencyKey: {}. Returning existing order.", idempotencyKey);
                return orderMapper.toOrderResponse(existing.get());
            }
        }

        CartDto cart = cartClient.getCart(authUserId)
                .orElseThrow(() -> new InvalidOrderStateException("Cart could not be retrieved for user: " + authUserId));

        if (cart.getItems() == null || cart.getItems().isEmpty()) {
            throw new InvalidOrderStateException("Cannot create order from an empty cart");
        }

        BigDecimal subtotal = BigDecimal.ZERO;

        Order order = Order.builder()
                .authUserId(authUserId)
                .orderNumber(generateOrderNumber())
                .idempotencyKey(StringUtils.hasText(idempotencyKey) ? idempotencyKey : UUID.randomUUID().toString())
                .status(OrderStatus.PENDING)
                .paymentStatus(PaymentStatus.PENDING)
                .shippingCost(BigDecimal.ZERO)
                .taxTotal(BigDecimal.ZERO)
                .currencyCode(StringUtils.hasText(request.getCurrencyCode()) ? request.getCurrencyCode() : "INR")
                .shipFullName(request.getShippingAddress().getFullName())
                .shipPhone(request.getShippingAddress().getPhone())
                .shipLine1(request.getShippingAddress().getLine1())
                .shipLine2(request.getShippingAddress().getLine2())
                .shipCity(request.getShippingAddress().getCity())
                .shipState(request.getShippingAddress().getState())
                .shipPostalCode(request.getShippingAddress().getPostalCode())
                .shipCountryCode(request.getShippingAddress().getCountryCode())
                .customerNote(request.getCustomerNote())
                .subtotal(BigDecimal.ZERO)
                .discountTotal(BigDecimal.ZERO)
                .grandTotal(BigDecimal.ZERO)
                .build();

        for (CartItemDto cartItem : cart.getItems()) {
            boolean available = productClient.checkAvailability(cartItem.getProductId(), cartItem.getQuantity());
            if (!available) {
                throw new InvalidOrderStateException("Product (ID: " + cartItem.getProductId()
                        + ") is not available in requested quantity: " + cartItem.getQuantity());
            }

            BigDecimal unitPrice = cartItem.getUnitPrice() != null ? cartItem.getUnitPrice() : BigDecimal.ZERO;
            BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(cartItem.getQuantity()));

            OrderItem orderItem = OrderItem.builder()
                    .productId(cartItem.getProductId())
                    .listingId(cartItem.getListingId())
                    .sellerId(cartItem.getSellerId())
                    .productSku("SKU-" + cartItem.getProductId().toString().substring(0, 8))
                    .productName("Product " + cartItem.getProductId())
                    .quantity(cartItem.getQuantity())
                    .unitPrice(unitPrice)
                    .discountAmount(BigDecimal.ZERO)
                    .lineTotal(lineTotal)
                    .build();

            order.addItem(orderItem);
            subtotal = subtotal.add(lineTotal);
        }

        order.setSubtotal(subtotal);
        order.setGrandTotal(subtotal);

        Order saved = orderRepository.save(order);

        cartClient.clearCart(authUserId);

        log.info("Order created from cart: orderId={} orderNumber={} userId={} grandTotal={}",
                saved.getId(), saved.getOrderNumber(), authUserId, saved.getGrandTotal());

        eventPublisher.publishOrderCreated(saved);

        return orderMapper.toOrderResponse(saved);
    }

    private Order buildOrderEntity(UUID authUserId, String idempotencyKey,
                                   CreateOrderRequest request) {

        BigDecimal subtotal      = BigDecimal.ZERO;
        BigDecimal discountTotal = BigDecimal.ZERO;

        Order order = Order.builder()
                .authUserId(authUserId)
                .orderNumber(generateOrderNumber())
                .idempotencyKey(
                        StringUtils.hasText(idempotencyKey) ? idempotencyKey : UUID.randomUUID().toString())
                .status(OrderStatus.PENDING)
                .paymentStatus(PaymentStatus.PENDING)
                .shippingCost(
                        request.getShippingCost() != null ? request.getShippingCost() : BigDecimal.ZERO)
                .taxTotal(
                        request.getTaxTotal() != null ? request.getTaxTotal() : BigDecimal.ZERO)
                .currencyCode(
                        StringUtils.hasText(request.getCurrencyCode()) ? request.getCurrencyCode() : "USD")
                .shipFullName(request.getShippingAddress().getFullName())
                .shipPhone(request.getShippingAddress().getPhone())
                .shipLine1(request.getShippingAddress().getLine1())
                .shipLine2(request.getShippingAddress().getLine2())
                .shipCity(request.getShippingAddress().getCity())
                .shipState(request.getShippingAddress().getState())
                .shipPostalCode(request.getShippingAddress().getPostalCode())
                .shipCountryCode(request.getShippingAddress().getCountryCode())
                .customerNote(request.getCustomerNote())
                .subtotal(BigDecimal.ZERO)   // will be set below
                .grandTotal(BigDecimal.ZERO) // will be set below
                .build();

        for (OrderItemRequest itemReq : request.getItems()) {


            boolean available = productClient.checkAvailability(itemReq.getProductId(), itemReq.getQuantity());
            if (!available) {
                throw new InvalidOrderStateException(
                        "Product '" + itemReq.getProductName() + "' (ID: " + itemReq.getProductId()
                        + ") is not available in the requested quantity: " + itemReq.getQuantity());
            }

            BigDecimal discount     = itemReq.getDiscountAmount() != null
                                      ? itemReq.getDiscountAmount() : BigDecimal.ZERO;
            BigDecimal effectivePrice = itemReq.getUnitPrice().subtract(discount);
            BigDecimal lineTotal      = effectivePrice.multiply(BigDecimal.valueOf(itemReq.getQuantity()));

            OrderItem item = OrderItem.builder()
                    .productId(itemReq.getProductId())
                    .listingId(itemReq.getListingId())
                    .sellerId(itemReq.getSellerId())
                    .productSku(itemReq.getProductSku())
                    .productName(itemReq.getProductName())
                    .productImageUrl(itemReq.getProductImageUrl())
                    .quantity(itemReq.getQuantity())
                    .unitPrice(itemReq.getUnitPrice())
                    .discountAmount(discount)
                    .lineTotal(lineTotal)
                    .build();

            order.addItem(item);
            subtotal      = subtotal.add(itemReq.getUnitPrice().multiply(BigDecimal.valueOf(itemReq.getQuantity())));
            discountTotal = discountTotal.add(discount.multiply(BigDecimal.valueOf(itemReq.getQuantity())));
        }

        order.setSubtotal(subtotal);
        order.setDiscountTotal(discountTotal);
        order.setGrandTotal(
                subtotal
                .subtract(discountTotal)
                .add(order.getShippingCost())
                .add(order.getTaxTotal())
        );

        return order;
    }

    private String generateOrderNumber() {
        String datePart = DateTimeFormatter.ofPattern("yyyyMMdd")
                .withZone(ZoneOffset.UTC)
                .format(Instant.now());
        long seq = orderSequence.incrementAndGet() % 100_000;
        return String.format("ORD-%s-%05d", datePart, seq);
    }


    @Override
    public OrderResponse getOrderForUser(UUID orderId, UUID authUserId) {
        return orderRepository.findByIdAndAuthUserIdWithItems(orderId, authUserId)
                .map(orderMapper::toOrderResponse)
                .orElseThrow(() -> new OrderNotFoundException(
                        "Order not found: " + orderId));
    }

    @Override
    public Page<OrderSummaryResponse> getOrdersForUser(UUID authUserId, Pageable pageable) {
        return orderRepository.findByAuthUserId(authUserId, pageable)
                .map(orderMapper::toOrderSummaryResponse);
    }

    @Override
    @Transactional
    public OrderResponse cancelOrder(UUID orderId, UUID authUserId, String reason) {
        Order order = orderRepository.findByIdAndAuthUserId(orderId, authUserId)
                .orElseThrow(() -> new OrderNotFoundException("Order not found: " + orderId));

        if (!CUSTOMER_CANCELLABLE_STATES.contains(order.getStatus())) {
            throw new InvalidOrderStateException(
                    "Order cannot be cancelled in its current state: " + order.getStatus()
                    + ". Only PENDING or CONFIRMED orders can be cancelled by the customer.");
        }

        OrderStatus fromStatus = order.getStatus();
        order.setStatus(OrderStatus.CANCELLED);
        order.setCancelledAt(Instant.now());

        OrderStatusHistory history = OrderStatusHistory.builder()
                .fromStatus(fromStatus)
                .toStatus(OrderStatus.CANCELLED)
                .changedBy(authUserId)
                .reason(StringUtils.hasText(reason) ? reason : "Cancelled by customer")
                .build();
        order.addStatusHistory(history);

        Order saved = orderRepository.save(order);
        eventPublisher.publishOrderCancelled(saved.getId(), saved.getOrderNumber(), authUserId, reason);

        log.info("Order cancelled: orderId={} userId={}", orderId, authUserId);
        return orderMapper.toOrderResponse(saved);
    }


    @Override
    public OrderResponse getOrderByIdAdmin(UUID orderId) {
        return orderRepository.findByIdWithItems(orderId)
                .map(orderMapper::toOrderResponse)
                .orElseThrow(() -> new OrderNotFoundException("Order not found: " + orderId));
    }

    @Override
    public Page<OrderSummaryResponse> getAllOrdersAdmin(Pageable pageable) {
        return orderRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(orderMapper::toOrderSummaryResponse);
    }

    @Override
    @Transactional
    public OrderResponse updateOrderStatusAdmin(UUID orderId, UUID adminId,
                                                UpdateOrderStatusRequest request) {
        Order order = orderRepository.findByIdWithItems(orderId)
                .orElseThrow(() -> new OrderNotFoundException("Order not found: " + orderId));

        OrderStatus currentStatus = order.getStatus();
        OrderStatus newStatus     = request.getStatus();

        if (TERMINAL_STATES.contains(currentStatus) && newStatus != OrderStatus.REFUNDED) {
            throw new InvalidOrderStateException(
                    "Cannot change order status from terminal state '" + currentStatus
                    + "' to '" + newStatus + "'.");
        }

        if (currentStatus == newStatus) {
            throw new InvalidOrderStateException(
                    "Order is already in status: " + currentStatus);
        }

        order.setStatus(newStatus);
        applyTimestampForStatus(order, newStatus);

        OrderStatusHistory history = OrderStatusHistory.builder()
                .fromStatus(currentStatus)
                .toStatus(newStatus)
                .changedBy(adminId)
                .reason(request.getReason())
                .build();
        order.addStatusHistory(history);

        Order saved = orderRepository.save(order);

        eventPublisher.publishOrderStatusChanged(saved.getId(), saved.getOrderNumber(),
                currentStatus, newStatus);

        if (newStatus == OrderStatus.DELIVERED) {
            eventPublisher.publishOrderDelivered(saved.getId(), saved.getOrderNumber(), saved.getAuthUserId());
        } else if (newStatus == OrderStatus.CANCELLED) {
            eventPublisher.publishOrderCancelled(saved.getId(), saved.getOrderNumber(),
                    saved.getAuthUserId(), request.getReason());
        }

        log.info("Admin updated order status: orderId={} from={} to={} adminId={}",
                orderId, currentStatus, newStatus, adminId);
        return orderMapper.toOrderResponse(saved);
    }

    @Override
    public List<OrderStatusHistoryResponse> getOrderStatusHistory(UUID orderId, UUID authUserId,
                                                                   boolean isAdmin) {

        if (!isAdmin) {
            orderRepository.findByIdAndAuthUserId(orderId, authUserId)
                    .orElseThrow(() -> new OrderNotFoundException("Order not found: " + orderId));
        } else {
            orderRepository.findById(orderId)
                    .orElseThrow(() -> new OrderNotFoundException("Order not found: " + orderId));
        }

        List<OrderStatusHistory> history =
                historyRepository.findByOrderIdOrderByChangedAtAsc(orderId);
        return orderMapper.toStatusHistoryResponseList(history);
    }

    private void applyTimestampForStatus(Order order, OrderStatus status) {
        Instant now = Instant.now();
        switch (status) {
            case CONFIRMED  -> order.setConfirmedAt(now);
            case SHIPPED    -> order.setShippedAt(now);
            case DELIVERED  -> order.setDeliveredAt(now);
            case CANCELLED  -> order.setCancelledAt(now);
            default         -> {  }
        }
    }
}
