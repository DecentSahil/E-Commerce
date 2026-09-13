package com.example.product.service;

import com.example.product.dto.request.CreateProductRequest;
import com.example.product.dto.request.PatchProductRequest;
import com.example.product.dto.request.UpdateProductRequest;
import com.example.product.dto.response.PageResponse;
import com.example.product.dto.response.ProductResponse;
import com.example.product.specification.ProductFilterCriteria;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface ProductService {

    ProductResponse createProduct(CreateProductRequest request);

    ProductResponse getProductById(UUID id);

    PageResponse<ProductResponse> getProducts(ProductFilterCriteria criteria, Pageable pageable);

    ProductResponse updateProduct(UUID id, UpdateProductRequest request);

    ProductResponse patchProduct(UUID id, PatchProductRequest request);

    void deleteProduct(UUID id);
}
