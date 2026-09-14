package com.example.cart.repository;

import com.example.cart.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, UUID> {

    Optional<CartItem> findByCartIdAndListingId(UUID cartId, UUID listingId);

    Optional<CartItem> findByIdAndCartId(UUID id, UUID cartId);

    void deleteAllByCartId(UUID cartId);
}
