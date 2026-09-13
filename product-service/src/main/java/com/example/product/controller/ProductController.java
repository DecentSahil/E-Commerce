package com.example.product.controller;

import com.example.product.dto.request.CreateProductRequest;
import com.example.product.dto.request.PatchProductRequest;
import com.example.product.dto.request.UpdateProductRequest;
import com.example.product.dto.response.MessageResponse;
import com.example.product.dto.response.PageResponse;
import com.example.product.dto.response.ProductResponse;
import com.example.product.entity.ProductStatus;
import com.example.product.exception.AccessDeniedException;
import com.example.product.service.ProductService;
import com.example.product.specification.ProductFilterCriteria;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public ResponseEntity<PageResponse<ProductResponse>> getProducts(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) String tag,
            @RequestParam(required = false) ProductStatus status,
            @RequestParam(required = false) String search,
            Pageable pageable
    ) {
        ProductFilterCriteria criteria = ProductFilterCriteria.builder()
                .category(category)
                .brand(brand)
                .tag(tag)
                .status(status)
                .search(search)
                .build();

        return ResponseEntity.ok(
                productService.getProducts(criteria, pageable)
        );
    }

    @GetMapping("/{productId}")
    public ResponseEntity<ProductResponse> getProductById(@PathVariable("productId") UUID productId) {
        ProductResponse response = productService.getProductById(productId);
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<ProductResponse> createProduct(
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @Valid @RequestBody CreateProductRequest request
    ) {
        verifyAdminRole(userRole);
        ProductResponse response = productService.createProduct(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{productId}")
    public ResponseEntity<ProductResponse> updateProduct(
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @PathVariable("productId") UUID productId,
            @Valid @RequestBody UpdateProductRequest request
    ) {
        verifyAdminRole(userRole);
        ProductResponse response = productService.updateProduct(productId, request);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{productId}")
    public ResponseEntity<ProductResponse> patchProduct(
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @PathVariable("productId") UUID productId,
            @Valid @RequestBody PatchProductRequest request
    ) {
        verifyAdminRole(userRole);
        ProductResponse response = productService.patchProduct(productId, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{productId}")
    public ResponseEntity<MessageResponse> deleteProduct(
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @PathVariable("productId") UUID productId
    ) {
        verifyAdminRole(userRole);
        productService.deleteProduct(productId);
        return ResponseEntity.ok(new MessageResponse("Product deleted successfully"));
    }

    private void verifyAdminRole(String role) {
        if (role == null || (!"ADMIN".equalsIgnoreCase(role) && !"ROLE_ADMIN".equalsIgnoreCase(role))) {
            throw new AccessDeniedException("Only ADMIN users can manage canonical products in the catalog");
        }
    }
}
