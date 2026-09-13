package com.example.product.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
        name = "listings",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_listing_product_seller",
                        columnNames = {"product_id", "seller_id"}
                )
        },
        indexes = {
                @Index(name = "idx_listings_product_id", columnList = "product_id"),
                @Index(name = "idx_listings_seller_id", columnList = "seller_id"),
                @Index(name = "idx_listings_status", columnList = "status")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Listing {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;


    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "product_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_listings_product")
    )
    private Product product;


    @Column(name = "seller_id", nullable = false)
    private UUID sellerId;

    @Column(
            name = "selling_price",
            nullable = false,
            precision = 12,
            scale = 2
    )
    private BigDecimal sellingPrice;

    @Column(name = "currency", nullable = false, length = 10)
    @Builder.Default
    private String currency = "INR";

    @Column(name = "stock_quantity", nullable = false)
    @Builder.Default
    private Integer stockQuantity = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "condition", nullable = false, length = 30)
    private ListingCondition condition;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private ListingStatus status = ListingStatus.ACTIVE;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {

        if (id == null) {
            id = UUID.randomUUID();
        }

        Instant now = Instant.now();

        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    public boolean isAvailable() {
        return status == ListingStatus.ACTIVE
                && stockQuantity != null
                && stockQuantity > 0;
    }

    public void updateStock(int quantity) {
        if (quantity < 0) {
            throw new IllegalArgumentException(
                    "Stock quantity cannot be negative"
            );
        }

        this.stockQuantity = quantity;

        if (quantity == 0) {
            this.status = ListingStatus.OUT_OF_STOCK;
        } else if (this.status == ListingStatus.OUT_OF_STOCK) {
            this.status = ListingStatus.ACTIVE;
        }
    }
}