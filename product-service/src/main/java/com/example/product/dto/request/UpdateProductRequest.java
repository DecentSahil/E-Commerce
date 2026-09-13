package com.example.product.dto.request;

import com.example.product.entity.ProductStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProductRequest {

    @NotBlank(message = "Product name is required")
    @Size(
            max = 255,
            message = "Product name must not exceed 255 characters"
    )
    private String name;

    private String description;

    @NotNull(message = "Category ID is required")
    private UUID categoryId;

    @NotNull(message = "Brand ID is required")
    private UUID brandId;

    @NotNull(message = "Product status is required")
    private ProductStatus status;

    private Set<String> tags;

    @Valid
    private List<ProductSpecificationRequest> specifications;
}