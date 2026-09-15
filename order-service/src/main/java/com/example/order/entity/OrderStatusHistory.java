package com.example.order.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;

import java.time.Instant;
import java.util.UUID;

import static org.hibernate.type.SqlTypes.NAMED_ENUM;


@Entity
@Table(name = "order_status_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderStatusHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(nullable = false, updatable = false)
    private UUID id;


    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false, updatable = false)
    private Order order;


    @Enumerated(EnumType.STRING)
    @Column(name = "from_status", columnDefinition = "order_status")
    @JdbcTypeCode(NAMED_ENUM)
    private OrderStatus fromStatus;


    @Enumerated(EnumType.STRING)
    @Column(name = "to_status", nullable = false, columnDefinition = "order_status")
    @JdbcTypeCode(NAMED_ENUM)
    private OrderStatus toStatus;


    @Column(name = "changed_by")
    private UUID changedBy;


    @Column(length = 500)
    private String reason;

    @Column(name = "changed_at", nullable = false, updatable = false)
    private Instant changedAt;

    @PrePersist
    protected void onCreate() {
        changedAt = Instant.now();
    }
}
