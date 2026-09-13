package com.example.product.service;

import com.example.product.dto.request.CreateListingRequest;
import com.example.product.dto.request.UpdateListingRequest;
import com.example.product.dto.response.ListingResponse;

import java.util.List;
import java.util.UUID;

public interface ListingService {

    ListingResponse createListing(
            CreateListingRequest request,
            UUID sellerId
    );

    ListingResponse getListingById(UUID id);

    List<ListingResponse> getListingsByProductId(UUID productId);

    List<ListingResponse> getListingsBySellerId(UUID sellerId);


    ListingResponse updateListing(
            UUID id,
            UpdateListingRequest request,
            UUID currentUserId,
            String currentUserRole
    );

    void deleteListing(
            UUID id,
            UUID currentUserId,
            String currentUserRole
    );
}