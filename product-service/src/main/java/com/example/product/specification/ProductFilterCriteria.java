package com.example.product.specification;

import com.example.product.entity.ProductStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductFilterCriteria {

    private String category;

    private String brand;

    private String tag;

    private ProductStatus status;

    private String search;
}