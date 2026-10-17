package com.example.wishlist.mapper;

import com.example.wishlist.client.dto.ProductDto;
import com.example.wishlist.dto.response.WishlistItemResponse;
import com.example.wishlist.dto.response.WishlistResponse;
import com.example.wishlist.entity.Wishlist;
import com.example.wishlist.entity.WishlistItem;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Component
public class WishlistMapper {

    public WishlistResponse toResponse(Wishlist wishlist) {
        return toResponse(wishlist, Collections.emptyMap());
    }

    public WishlistResponse toResponse(Wishlist wishlist, Map<UUID, ProductDto> productDetails) {
        if (wishlist == null) {
            return null;
        }

        List<WishlistItemResponse> itemResponses = wishlist.getItems() != null
                ? wishlist.getItems().stream()
                .map(item -> toItemResponse(item, productDetails != null ? productDetails.get(item.getProductId()) : null))
                .toList()
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
        return toItemResponse(item, null);
    }

    public WishlistItemResponse toItemResponse(WishlistItem item, ProductDto product) {
        if (item == null) {
            return null;
        }

        return WishlistItemResponse.builder()
                .id(item.getId())
                .productId(item.getProductId())
                .productName(product != null ? product.getName() : null)
                .imageUrl(product != null ? product.getImageUrl() : null)
                .createdAt(item.getCreatedAt())
                .build();
    }
}
