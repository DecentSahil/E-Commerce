package com.example.order.repository;

import com.example.order.entity.Order;
import com.example.order.entity.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;


@Repository
public interface OrderRepository extends JpaRepository<Order, UUID>, JpaSpecificationExecutor<Order> {


    Page<Order> findByAuthUserId(UUID authUserId, Pageable pageable);


    Optional<Order> findByIdAndAuthUserId(UUID id, UUID authUserId);


    Optional<Order> findByOrderNumber(String orderNumber);


    boolean existsByIdempotencyKey(String idempotencyKey);


    Optional<Order> findByIdempotencyKey(String idempotencyKey);


    Page<Order> findAllByOrderByCreatedAtDesc(Pageable pageable);


    Page<Order> findByStatus(OrderStatus status, Pageable pageable);


    long countByAuthUserId(UUID authUserId);


    @Query("SELECT o FROM Order o LEFT JOIN FETCH o.items WHERE o.id = :id")
    Optional<Order> findByIdWithItems(@Param("id") UUID id);


    @Query("SELECT o FROM Order o LEFT JOIN FETCH o.items WHERE o.id = :id AND o.authUserId = :authUserId")
    Optional<Order> findByIdAndAuthUserIdWithItems(@Param("id") UUID id,
                                                   @Param("authUserId") UUID authUserId);
}
