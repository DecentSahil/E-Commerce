package com.example.order.service.impl;

import com.example.order.client.CartClient;
import com.example.order.client.ProductClient;
import com.example.order.client.UserClient;
import com.example.order.client.dto.*;
import com.example.order.dto.request.CheckoutCartRequest;
import com.example.order.dto.request.CreateOrderRequest;
import com.example.order.dto.request.OrderItemRequest;
import com.example.order.dto.request.UpdateOrderStatusRequest;
import com.example.order.dto.response.OrderResponse;
import com.example.order.dto.response.OrderStatusHistoryResponse;
import com.example.order.dto.response.OrderSummaryResponse;
import com.example.order.entity.*;
import com.example.order.event.OrderEventPublisher;
import com.example.order.exception.DuplicateIdempotencyKeyException;
import com.example.order.exception.InvalidOrderStateException;
import com.example.order.exception.OrderNotFoundException;
import com.example.order.mapper.OrderMapper;
import com.example.order.repository.OrderRepository;
import com.example.order.repository.OrderStatusHistoryRepository;
import com.example.order.service.OrderService;
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

    private final OrderRepository orderRepository;
    private final OrderStatusHistoryRepository historyRepository;
    private final OrderMapper  orderMapper;
    private final ProductClient productClient;
    private final CartClient cartClient;
    private final OrderEventPublisher eventPublisher;
    private final UserClient userClient;


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

        java.util.List<OrderItem> deductedItems = new java.util.ArrayList<>();
        try {
            for (CartItemDto cartItem : cart.getItems()) {
                com.example.order.client.dto.ListingDto listing = null;
                if (cartItem.getListingId() != null) {
                    listing = productClient.getListing(cartItem.getListingId())
                            .orElseThrow(() -> new InvalidOrderStateException("Listing not found: " + cartItem.getListingId()));

                    if (!"ACTIVE".equalsIgnoreCase(listing.getStatus())) {
                        throw new InvalidOrderStateException("Listing " + cartItem.getListingId() + " is not active");
                    }

                    if (listing.getStockQuantity() == null || listing.getStockQuantity() < cartItem.getQuantity()) {
                        throw new InvalidOrderStateException("Insufficient stock for listing " + cartItem.getListingId()
                                + ". Available: " + listing.getStockQuantity() + ", requested: " + cartItem.getQuantity());
                    }

                    productClient.deductStock(cartItem.getListingId(), cartItem.getQuantity());
                } else {
                    boolean available = productClient.checkAvailability(cartItem.getProductId(), cartItem.getQuantity());
                    if (!available) {
                        throw new InvalidOrderStateException("Product (ID: " + cartItem.getProductId()
                                + ") is not available in requested quantity: " + cartItem.getQuantity());
                    }
                }

                BigDecimal unitPrice = (listing != null && listing.getSellingPrice() != null)
                        ? listing.getSellingPrice()
                        : (cartItem.getUnitPrice() != null ? cartItem.getUnitPrice() : BigDecimal.ZERO);
                BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(cartItem.getQuantity()));

                UUID sellerId = listing != null && listing.getSellerId() != null ? listing.getSellerId() : cartItem.getSellerId();
                UUID listingId = listing != null ? listing.getId() : cartItem.getListingId();

                OrderItem orderItem = OrderItem.builder()
                        .productId(cartItem.getProductId())
                        .listingId(listingId)
                        .sellerId(sellerId)
                        .productSku("SKU-" + cartItem.getProductId().toString().substring(0, 8))
                        .productName("Product " + cartItem.getProductId())
                        .quantity(cartItem.getQuantity())
                        .unitPrice(unitPrice)
                        .discountAmount(BigDecimal.ZERO)
                        .lineTotal(lineTotal)
                        .build();

                order.addItem(orderItem);
                deductedItems.add(orderItem);
                subtotal = subtotal.add(lineTotal);
            }
        } catch (Exception ex) {
            // Compensate already deducted stock
            for (OrderItem item : deductedItems) {
                if (item.getListingId() != null && item.getQuantity() != null) {
                    try {
                        productClient.restoreStock(item.getListingId(), item.getQuantity());
                    } catch (Exception restoreEx) {
                        log.error("Failed to restore stock for listing {}: {}", item.getListingId(), restoreEx.getMessage());
                    }
                }
            }
            throw ex;
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


    private Order buildOrderEntity(
            UUID authUserId,
            String idempotencyKey,
            CreateOrderRequest request) {

        AddressDto address = userClient
                .getAddress(
                        authUserId,
                        request.getShippingAddressId()
                )
                .orElseThrow(() ->
                        new InvalidOrderStateException(
                                "Shipping address not found: "
                                        + request.getShippingAddressId()
                        )
                );

        if (address.getRecipientName() == null
                || address.getRecipientName().isBlank()) {

            throw new InvalidOrderStateException(
                    "Recipient name is missing from shipping address"
            );
        }

        if (address.getAddressLine1() == null
                || address.getAddressLine1().isBlank()) {

            throw new InvalidOrderStateException(
                    "Address line 1 is missing"
            );
        }

        if (address.getCity() == null
                || address.getCity().isBlank()) {

            throw new InvalidOrderStateException(
                    "City is missing from shipping address"
            );
        }

        if (address.getPostalCode() == null
                || address.getPostalCode().isBlank()) {

            throw new InvalidOrderStateException(
                    "Postal code is missing from shipping address"
            );
        }

        if (address.getCountryCode() == null
                || address.getCountryCode().isBlank()) {

            throw new InvalidOrderStateException(
                    "Country code is missing from shipping address"
            );
        }

        Order order = Order.builder()
                .authUserId(authUserId)

                .orderNumber(generateOrderNumber())

                .idempotencyKey(
                        StringUtils.hasText(idempotencyKey)
                                ? idempotencyKey
                                : UUID.randomUUID().toString()
                )

                .status(OrderStatus.PENDING)
                .paymentStatus(PaymentStatus.PENDING)

                .shippingCost(BigDecimal.ZERO)
                .taxTotal(BigDecimal.ZERO)
                .discountTotal(BigDecimal.ZERO)

                .customerNote(request.getCustomerNote())

                .subtotal(BigDecimal.ZERO)
                .grandTotal(BigDecimal.ZERO)

                .shipFullName(address.getRecipientName())
                .shipPhone(address.getPhone())
                .shipLine1(address.getAddressLine1())
                .shipLine2(address.getAddressLine2())
                .shipCity(address.getCity())
                .shipState(address.getState())
                .shipPostalCode(address.getPostalCode())
                .shipCountryCode(address.getCountryCode())

                .build();


        BigDecimal subtotal = BigDecimal.ZERO;

        String orderCurrency = null;

        for (OrderItemRequest itemRequest : request.getItems()) {

            UUID listingId = itemRequest.getListingId();

            ListingDto listing = productClient
                    .getListing(listingId)
                    .orElseThrow(() ->
                            new InvalidOrderStateException(
                                    "Listing not found: " + listingId
                            )
                    );

            if (!"ACTIVE".equalsIgnoreCase(listing.getStatus())) {

                throw new InvalidOrderStateException(
                        "Listing is not active: " + listingId
                );
            }


            if (listing.getProductId() == null) {

                throw new InvalidOrderStateException(
                        "Listing has no product: " + listingId
                );
            }

            if (listing.getSellerId() == null) {

                throw new InvalidOrderStateException(
                        "Listing has no seller: " + listingId
                );
            }

            if (listing.getSellingPrice() == null
                    || listing.getSellingPrice().signum() < 0) {

                throw new InvalidOrderStateException(
                        "Invalid selling price for listing: " + listingId
                );
            }

            if (listing.getStockQuantity() == null
                    || listing.getStockQuantity()
                    < itemRequest.getQuantity()) {

                throw new InvalidOrderStateException(
                        "Insufficient stock for listing "
                                + listingId
                                + ". Available: "
                                + listing.getStockQuantity()
                                + ", requested: "
                                + itemRequest.getQuantity()
                );
            }

            ProductDto product = productClient
                    .getProduct(listing.getProductId())
                    .orElseThrow(() ->
                            new InvalidOrderStateException(
                                    "Product not found: "
                                            + listing.getProductId()
                            )
                    );

            if (product.getName() == null
                    || product.getName().isBlank()) {

                throw new InvalidOrderStateException(
                        "Product name is missing for product: "
                                + listing.getProductId()
                );
            }

            if (listing.getCurrency() == null
                    || listing.getCurrency().isBlank()) {

                throw new InvalidOrderStateException(
                        "Currency is missing for listing: " + listingId
                );
            }

            if (orderCurrency == null) {

                orderCurrency = listing.getCurrency();

            } else if (!orderCurrency.equalsIgnoreCase(
                    listing.getCurrency())) {

                throw new InvalidOrderStateException(
                        "All items in an order must use the same currency"
                );
            }



            BigDecimal unitPrice = listing.getSellingPrice();

            BigDecimal lineTotal =
                    unitPrice.multiply(
                            BigDecimal.valueOf(
                                    itemRequest.getQuantity()
                            )
                    );

            OrderItem orderItem = OrderItem.builder()

                    .productId(listing.getProductId())

                    .listingId(listing.getId())

                    .sellerId(listing.getSellerId())

                    .productSku(null)

                    .productName(product.getName())

                    .productImageUrl(null)

                    .quantity(itemRequest.getQuantity())

                    .unitPrice(unitPrice)

                    .discountAmount(BigDecimal.ZERO)

                    .lineTotal(lineTotal)

                    .build();


            order.addItem(orderItem);

            subtotal = subtotal.add(lineTotal);
        }


        order.setCurrencyCode(orderCurrency);

        order.setSubtotal(subtotal);

        order.setDiscountTotal(BigDecimal.ZERO);

        order.setGrandTotal(
                subtotal
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

        // Synchronously restore stock for all items
        if (saved.getItems() != null) {
            for (OrderItem item : saved.getItems()) {
                if (item.getListingId() != null && item.getQuantity() != null && item.getQuantity() > 0) {
                    try {
                        productClient.restoreStock(item.getListingId(), item.getQuantity());
                        log.info("Restored stock for listingId={} qty={} upon order cancellation", item.getListingId(), item.getQuantity());
                    } catch (Exception e) {
                        log.error("Failed to restore stock for listing {}: {}", item.getListingId(), e.getMessage());
                    }
                }
            }
        }

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
    @Transactional
    public Order createPendingOrderForSaga(
            UUID authUserId,
            String idempotencyKey,
            CreateOrderRequest request) {

        Optional<Order> existingOrder =
                orderRepository.findByIdempotencyKey(idempotencyKey);

        if (existingOrder.isPresent()) {
            throw new DuplicateIdempotencyKeyException(
                    "Idempotency key '" + idempotencyKey +
                            "' has already been used."
            );
        }

        Order order = buildOrderEntity(
                authUserId,
                idempotencyKey,
                request
        );


        order.setStatus(OrderStatus.PENDING);
        order.setPaymentStatus(PaymentStatus.PENDING);

        OrderStatusHistory history = OrderStatusHistory.builder()
                .fromStatus(null)
                .toStatus(OrderStatus.PENDING)
                .changedBy(authUserId)
                .reason("Order created as part of checkout Saga")
                .build();

        order.addStatusHistory(history);

        Order saved = orderRepository.save(order);

        log.info(
                "Saga order created: orderId={} orderNumber={} userId={}",
                saved.getId(),
                saved.getOrderNumber(),
                authUserId
        );

        return saved;
    }

    @Override
    @Transactional
    public void confirmOrderForSaga(UUID orderId) {

        Order order = orderRepository.findByIdWithItems(orderId)
                .orElseThrow(() ->
                        new OrderNotFoundException(
                                "Order not found: " + orderId
                        )
                );

        if (order.getStatus() != OrderStatus.PENDING) {
            throw new InvalidOrderStateException(
                    "Only PENDING orders can be confirmed. " +
                            "Current status: " + order.getStatus()
            );
        }

        OrderStatus previousStatus = order.getStatus();

        order.setStatus(OrderStatus.CONFIRMED);
        order.setConfirmedAt(Instant.now());

        OrderStatusHistory history = OrderStatusHistory.builder()
                .fromStatus(previousStatus)
                .toStatus(OrderStatus.CONFIRMED)
                .reason("Order confirmed after successful Saga")
                .build();

        order.addStatusHistory(history);

        Order saved = orderRepository.save(order);

        log.info(
                "Saga order confirmed: orderId={}",
                saved.getId()
        );

        eventPublisher.publishOrderStatusChanged(
                saved.getId(),
                saved.getOrderNumber(),
                previousStatus,
                OrderStatus.CONFIRMED
        );
    }

    @Override
    @Transactional
    public void cancelOrderForSaga(UUID orderId) {

        Order order = orderRepository.findByIdWithItems(orderId)
                .orElseThrow(() ->
                        new OrderNotFoundException(
                                "Order not found: " + orderId
                        )
                );

        if (order.getStatus() == OrderStatus.CANCELLED) {
            return;
        }

        OrderStatus previousStatus = order.getStatus();

        order.setStatus(OrderStatus.CANCELLED);
        order.setCancelledAt(Instant.now());

        OrderStatusHistory history = OrderStatusHistory.builder()
                .fromStatus(previousStatus)
                .toStatus(OrderStatus.CANCELLED)
                .reason("Order cancelled due to Saga compensation")
                .build();

        order.addStatusHistory(history);

        Order saved = orderRepository.save(order);

        log.info(
                "Saga compensation cancelled order: orderId={}",
                saved.getId()
        );

        eventPublisher.publishOrderCancelled(
                saved.getId(),
                saved.getOrderNumber(),
                saved.getAuthUserId(),
                "Saga compensation"
        );
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
