package com.example.wishlist.repository;

import com.example.wishlist.entity.Wishlist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface WishlistRepository extends JpaRepository<Wishlist, UUID> {

    Optional<Wishlist> findByUserId(UUID userId);

    @Query("SELECT w FROM Wishlist w LEFT JOIN FETCH w.items WHERE w.userId = :userId")
    Optional<Wishlist> findByUserIdWithItems(@Param("userId") UUID userId);
}
