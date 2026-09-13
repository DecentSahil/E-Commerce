package com.example.product.mapper;

import com.example.product.dto.response.ProductResponse;
import com.example.product.dto.response.ProductSpecificationResponse;
import com.example.product.entity.Product;
import com.example.product.entity.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class ProductMapper {

    private final CategoryMapper categoryMapper;
    private final BrandMapper brandMapper;

    public ProductResponse toResponse(Product product) {

        if (product == null) {
            return null;
        }

        Set<String> tagNames = product.getTags() != null
                ? product.getTags()
                .stream()
                .map(Tag::getName)
                .collect(Collectors.toSet())
                : Collections.emptySet();

        List<ProductSpecificationResponse> specificationResponses =
                product.getSpecifications() != null
                        ? product.getSpecifications()
                        .stream()
                        .map(specification ->
                                ProductSpecificationResponse.builder()
                                        .id(specification.getId())
                                        .key(specification.getSpecKey())
                                        .value(specification.getSpecValue())
                                        .build()
                        )
                        .toList()
                        : Collections.emptyList();

        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .description(product.getDescription())
                .category(categoryMapper.toResponse(product.getCategory()))
                .brand(brandMapper.toResponse(product.getBrand()))
                .status(product.getStatus())
                .tags(tagNames)
                .specifications(specificationResponses)
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .build();
    }
}