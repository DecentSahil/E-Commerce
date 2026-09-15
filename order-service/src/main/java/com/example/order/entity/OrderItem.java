package com.example.order.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;


@Entity
@Table(name = "order_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(nullable = false, updatable = false)
    private UUID id;


    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false, updatable = false)
    private Order order;


    @Column(name = "product_id", nullable = false, updatable = false)
    private UUID productId;


    @Column(name = "listing_id")
    private UUID listingId;


    @Column(name = "seller_id")
    private UUID sellerId;


    @Column(name = "product_sku", length = 100)
    private String productSku;


    @Column(name = "product_name", nullable = false, length = 300)
    private String productName;


    @Column(name = "product_image_url", length = 2048)
    private String productImageUrl;

    @Column(nullable = false)
    private Integer quantity;


    @Column(name = "unit_price", nullable = false, precision = 19, scale = 4)
    private BigDecimal unitPrice;


    @Column(name = "discount_amount", nullable = false, precision = 19, scale = 4)
    @Builder.Default
    private BigDecimal discountAmount = BigDecimal.ZERO;


    @Column(name = "line_total", nullable = false, precision = 19, scale = 4)
    private BigDecimal lineTotal;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;


    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        if (discountAmount == null) discountAmount = BigDecimal.ZERO;
        lineTotal = unitPrice.subtract(discountAmount).multiply(BigDecimal.valueOf(quantity));
    }
}
