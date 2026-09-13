package com.example.product.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
    name = "product_specifications",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_product_spec_key", columnNames = {"product_id", "spec_key"})
    },
    indexes = {
        @Index(name = "idx_product_spec_product_id", columnList = "product_id"),
        @Index(name = "idx_product_spec_key_val", columnList = "spec_key, spec_value")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductSpecification {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false, foreignKey = @ForeignKey(name = "fk_product_spec_product"))
    private Product product;

    @Column(name = "spec_key", nullable = false, length = 100)
    private String specKey;

    @Column(name = "spec_value", nullable = false, length = 255)
    private String specValue;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.id == null) {
            this.id = UUID.randomUUID();
        }
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
        if (this.specKey != null) {
            this.specKey = this.specKey.trim();
        }
        if (this.specValue != null) {
            this.specValue = this.specValue.trim();
        }
    }
}
