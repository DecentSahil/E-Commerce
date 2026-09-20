package com.example.product.controller;

import com.example.product.dto.request.CreateListingRequest;
import com.example.product.dto.request.UpdateListingRequest;
import com.example.product.dto.response.ListingResponse;
import com.example.product.exception.AccessDeniedException;
import com.example.product.service.ListingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/listings")
@RequiredArgsConstructor
public class ListingController {

    private final ListingService listingService;

    @PostMapping
    public ResponseEntity<ListingResponse> createListing(
            @Valid @RequestBody CreateListingRequest request,
            @RequestHeader("X-User-Id") UUID sellerId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole
    ) {
        verifySellerOrAdminRole(userRole);

        ListingResponse response = listingService.createListing(request, sellerId);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @GetMapping("/my")
    public ResponseEntity<List<ListingResponse>> getMyListings(
            @RequestHeader("X-User-Id") UUID sellerId
    ) {
        return ResponseEntity.ok(
                listingService.getListingsBySellerId(sellerId)
        );
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<List<ListingResponse>> getListingsByProductId(
            @PathVariable UUID productId
    ) {
        return ResponseEntity.ok(
                listingService.getListingsByProductId(productId)
        );
    }

    @GetMapping("/seller/{sellerId}")
    public ResponseEntity<List<ListingResponse>> getListingsBySellerId(
            @PathVariable UUID sellerId
    ) {
        return ResponseEntity.ok(
                listingService.getListingsBySellerId(sellerId)
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<ListingResponse> getListingById(
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(
                listingService.getListingById(id)
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<ListingResponse> updateListing(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateListingRequest request,
            @RequestHeader("X-User-Id") UUID currentUserId,
            @RequestHeader("X-User-Role") String currentUserRole
    ) {
        return ResponseEntity.ok(
                listingService.updateListing(
                        id,
                        request,
                        currentUserId,
                        currentUserRole
                )
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteListing(
            @PathVariable UUID id,
            @RequestHeader("X-User-Id") UUID currentUserId,
            @RequestHeader("X-User-Role") String currentUserRole
    ) {
        listingService.deleteListing(
                id,
                currentUserId,
                currentUserRole
        );

        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/deduct-stock")
    public ResponseEntity<ListingResponse> deductStock(
            @PathVariable UUID id,
            @RequestParam int quantity
    ) {
        return ResponseEntity.ok(listingService.deductStock(id, quantity));
    }

    @PostMapping("/{id}/restore-stock")
    public ResponseEntity<ListingResponse> restoreStock(
            @PathVariable UUID id,
            @RequestParam int quantity
    ) {
        return ResponseEntity.ok(listingService.restoreStock(id, quantity));
    }

    private void verifySellerOrAdminRole(String role) {
        if (role != null && "USER".equalsIgnoreCase(role)) {
            throw new AccessDeniedException("Only SELLER or ADMIN users can create product listings");
        }
    }
}