package com.example.product.controller;

import com.example.product.dto.request.CategoryRequest;
import com.example.product.dto.response.CategoryResponse;
import com.example.product.dto.response.MessageResponse;
import com.example.product.exception.AccessDeniedException;
import com.example.product.service.CategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public ResponseEntity<List<CategoryResponse>> getAllCategories() {
        return ResponseEntity.ok(categoryService.getAllCategories());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CategoryResponse> getCategoryById(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(categoryService.getCategoryById(id));
    }

    @PostMapping
    public ResponseEntity<CategoryResponse> createCategory(
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @Valid @RequestBody CategoryRequest request
    ) {
        verifyAdminRole(userRole);
        CategoryResponse response = categoryService.createCategory(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CategoryResponse> updateCategory(
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @PathVariable("id") UUID id,
            @Valid @RequestBody CategoryRequest request
    ) {
        verifyAdminRole(userRole);
        return ResponseEntity.ok(categoryService.updateCategory(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<MessageResponse> deleteCategory(
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @PathVariable("id") UUID id
    ) {
        verifyAdminRole(userRole);
        categoryService.deleteCategory(id);
        return ResponseEntity.ok(new MessageResponse("Category deleted successfully"));
    }

    private void verifyAdminRole(String role) {
        if (role == null || (!"ADMIN".equalsIgnoreCase(role) && !"ROLE_ADMIN".equalsIgnoreCase(role))) {
            throw new AccessDeniedException("Only ADMIN users can manage product categories");
        }
    }
}
