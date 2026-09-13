package com.example.product.dto.request;

import com.example.product.entity.ProductStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateProductRequest {

    @NotBlank(message = "Product name is required")
    @Size(max = 255, message = "Product name must not exceed 255 characters")
    private String name;

    private String description;

    @NotNull(message = "category_id is required")
    private UUID categoryId;

    @NotNull(message = "brand_id is required")
    private UUID brandId;

    @Builder.Default
    private ProductStatus status = ProductStatus.ACTIVE;

    private Set<String> tags;

    @Valid
    private List<ProductSpecificationRequest> specifications;
}
