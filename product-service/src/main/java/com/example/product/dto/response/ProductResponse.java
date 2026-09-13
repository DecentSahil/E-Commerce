package com.example.product.dto.response;

import com.example.product.entity.ProductStatus;
import lombok.*;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductResponse {

    private UUID id;

    private String name;

    private String description;

    private CategoryResponse category;

    private BrandResponse brand;

    private ProductStatus status;

    private Set<String> tags;

    private List<ProductSpecificationResponse> specifications;

    private Instant createdAt;

    private Instant updatedAt;
}