package com.example.wishlist.mapper;

import com.example.wishlist.dto.response.WishlistItemResponse;
import com.example.wishlist.dto.response.WishlistResponse;
import com.example.wishlist.entity.Wishlist;
import com.example.wishlist.entity.WishlistItem;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

@Component
public class WishlistMapper {

    public WishlistResponse toResponse(Wishlist wishlist) {
        if (wishlist == null) {
            return null;
        }

        List<WishlistItemResponse> itemResponses = wishlist.getItems() != null
                ? wishlist.getItems().stream().map(this::toItemResponse).toList()
                : Collections.emptyList();

        return WishlistResponse.builder()
                .id(wishlist.getId())
                .userId(wishlist.getUserId())
                .items(itemResponses)
                .createdAt(wishlist.getCreatedAt())
                .updatedAt(wishlist.getUpdatedAt())
                .build();
    }

    public WishlistItemResponse toItemResponse(WishlistItem item) {
        if (item == null) {
            return null;
        }

        return WishlistItemResponse.builder()
                .id(item.getId())
                .productId(item.getProductId())
                .createdAt(item.getCreatedAt())
                .build();
    }
}
