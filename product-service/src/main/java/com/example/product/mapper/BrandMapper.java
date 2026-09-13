package com.example.product.mapper;

import com.example.product.dto.response.BrandResponse;
import com.example.product.entity.Brand;
import org.springframework.stereotype.Component;

@Component
public class BrandMapper {

    public BrandResponse toResponse(Brand brand) {
        if (brand == null) {
            return null;
        }
        return BrandResponse.builder()
                .id(brand.getId())
                .name(brand.getName())
                .createdAt(brand.getCreatedAt())
                .updatedAt(brand.getUpdatedAt())
                .build();
    }
}
