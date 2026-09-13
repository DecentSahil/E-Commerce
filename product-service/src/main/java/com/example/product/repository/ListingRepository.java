package com.example.product.repository;

import com.example.product.entity.Listing;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ListingRepository extends JpaRepository<Listing, UUID> {

    Optional<Listing> findByProductIdAndSellerId(
            UUID productId,
            UUID sellerId
    );

    Optional<Listing> findByIdAndSellerId(
            UUID id,
            UUID sellerId
    );

    List<Listing> findByProductId(UUID productId);

    List<Listing> findBySellerId(UUID sellerId);

    boolean existsByProductIdAndSellerId(
            UUID productId,
            UUID sellerId
    );
}