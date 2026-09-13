package com.example.product.mapper;

import com.example.product.dto.response.ListingResponse;
import com.example.product.entity.Listing;
import org.springframework.stereotype.Component;

@Component
public class ListingMapper {

    public ListingResponse toResponse(Listing listing) {
        if (listing == null) {
            return null;
        }

        return ListingResponse.builder()
                .id(listing.getId())
                .productId(listing.getProduct().getId())
                .sellerId(listing.getSellerId())
                .sellingPrice(listing.getSellingPrice())
                .currency(listing.getCurrency())
                .stockQuantity(listing.getStockQuantity())
                .condition(listing.getCondition())
                .status(listing.getStatus())
                .createdAt(listing.getCreatedAt())
                .updatedAt(listing.getUpdatedAt())
                .build();
    }
}