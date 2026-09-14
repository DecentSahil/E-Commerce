package com.example.cart.mapper;

import com.example.cart.client.dto.ListingDto;
import com.example.cart.dto.response.CartItemResponse;
import com.example.cart.dto.response.CartResponse;
import com.example.cart.entity.Cart;
import com.example.cart.entity.CartItem;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Component
public class CartMapper {

    public CartResponse toResponse(Cart cart, Map<UUID, ListingDto> listingDetails) {
        if (cart == null) {
            return null;
        }

        List<CartItemResponse> itemResponses = cart.getItems() != null
                ? cart.getItems().stream()
                .map(item -> toItemResponse(item, listingDetails.get(item.getListingId())))
                .toList()
                : Collections.emptyList();

        BigDecimal totalAmount = itemResponses.stream()
                .map(CartItemResponse::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        int totalQuantity = itemResponses.stream()
                .mapToInt(CartItemResponse::getQuantity)
                .sum();

        return CartResponse.builder()
                .id(cart.getId())
                .userId(cart.getUserId())
                .items(itemResponses)
                .totalAmount(totalAmount)
                .totalItems(totalQuantity)
                .createdAt(cart.getCreatedAt())
                .updatedAt(cart.getUpdatedAt())
                .build();
    }

    public CartItemResponse toItemResponse(CartItem item, ListingDto listing) {
        if (item == null) {
            return null;
        }

        BigDecimal price = (listing != null && listing.getSellingPrice() != null)
                ? listing.getSellingPrice()
                : BigDecimal.ZERO;
        String currency = (listing != null && listing.getCurrency() != null)
                ? listing.getCurrency()
                : "INR";
        UUID sellerId = (listing != null) ? listing.getSellerId() : null;

        BigDecimal subtotal = price.multiply(BigDecimal.valueOf(item.getQuantity()));

        return CartItemResponse.builder()
                .id(item.getId())
                .productId(item.getProductId())
                .listingId(item.getListingId())
                .sellerId(sellerId)
                .quantity(item.getQuantity())
                .unitPrice(price)
                .subtotal(subtotal)
                .currency(currency)
                .createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt())
                .build();
    }
}
