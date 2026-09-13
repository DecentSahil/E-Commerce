package com.example.product.controller;

import com.example.product.dto.request.BrandRequest;
import com.example.product.dto.response.BrandResponse;
import com.example.product.dto.response.MessageResponse;
import com.example.product.exception.AccessDeniedException;
import com.example.product.service.BrandService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/brands")
@RequiredArgsConstructor
public class BrandController {

    private final BrandService brandService;

    @GetMapping
    public ResponseEntity<List<BrandResponse>> getAllBrands() {
        return ResponseEntity.ok(brandService.getAllBrands());
    }

    @GetMapping("/{id}")
    public ResponseEntity<BrandResponse> getBrandById(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(brandService.getBrandById(id));
    }

    @PostMapping
    public ResponseEntity<BrandResponse> createBrand(
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @Valid @RequestBody BrandRequest request
    ) {
        verifyAdminRole(userRole);
        BrandResponse response = brandService.createBrand(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<BrandResponse> updateBrand(
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @PathVariable("id") UUID id,
            @Valid @RequestBody BrandRequest request
    ) {
        verifyAdminRole(userRole);
        return ResponseEntity.ok(brandService.updateBrand(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<MessageResponse> deleteBrand(
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @PathVariable("id") UUID id
    ) {
        verifyAdminRole(userRole);
        brandService.deleteBrand(id);
        return ResponseEntity.ok(new MessageResponse("Brand deleted successfully"));
    }

    private void verifyAdminRole(String role) {
        if (role == null || (!"ADMIN".equalsIgnoreCase(role) && !"ROLE_ADMIN".equalsIgnoreCase(role))) {
            throw new AccessDeniedException("Only ADMIN users can manage product brands");
        }
    }
}
