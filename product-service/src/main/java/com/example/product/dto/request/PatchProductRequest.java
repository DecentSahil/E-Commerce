package com.example.product.dto.request;

import com.example.product.entity.ProductStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatchProductRequest {

    @Size(
            max = 255,
            message = "Product name must not exceed 255 characters"
    )
    private String name;

    private String description;
    
    @Size(max = 1000, message = "Image URL must not exceed 1000 characters")
    private String imageUrl;

    private UUID categoryId;

    private UUID brandId;

    private ProductStatus status;

    private Set<String> tags;

    @Valid
    private List<ProductSpecificationRequest> specifications;
}