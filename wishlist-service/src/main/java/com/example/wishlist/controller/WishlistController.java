package com.example.wishlist.controller;

import com.example.wishlist.dto.response.WishlistResponse;
import com.example.wishlist.service.WishlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/wishlist")
@RequiredArgsConstructor
public class WishlistController {

    private final WishlistService wishlistService;

    @GetMapping
    public ResponseEntity<WishlistResponse> getWishlist(
            @RequestHeader("X-User-Id") UUID userId) {
        WishlistResponse response = wishlistService.getWishlist(userId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/items/{productId}")
    public ResponseEntity<WishlistResponse> addItemToWishlist(
            @RequestHeader("X-User-Id") UUID userId,
            @PathVariable("productId") UUID productId) {
        WishlistResponse response = wishlistService.addItemToWishlist(userId, productId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/items/{productId}")
    public ResponseEntity<Void> removeItemFromWishlist(
            @RequestHeader("X-User-Id") UUID userId,
            @PathVariable("productId") UUID productId) {
        wishlistService.removeItemFromWishlist(userId, productId);
        return ResponseEntity.noContent().build();
    }
}
