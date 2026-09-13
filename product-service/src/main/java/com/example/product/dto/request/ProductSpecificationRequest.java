package com.example.product.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductSpecificationRequest {

    @NotBlank(message = "Specification key is required")
    @Size(max = 100, message = "Specification key must not exceed 100 characters")
    private String key;

    @NotBlank(message = "Specification value is required")
    @Size(max = 255, message = "Specification value must not exceed 255 characters")
    private String value;
}
