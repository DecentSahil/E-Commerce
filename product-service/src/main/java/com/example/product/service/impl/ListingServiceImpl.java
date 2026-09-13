package com.example.product.service.impl;

import com.example.product.dto.request.CreateListingRequest;
import com.example.product.dto.request.UpdateListingRequest;
import com.example.product.dto.response.ListingResponse;
import com.example.product.entity.Listing;
import com.example.product.entity.ListingStatus;
import com.example.product.entity.Product;
import com.example.product.entity.ProductStatus;
import com.example.product.event.ProductEventPublisher;
import com.example.product.exception.AccessDeniedException;
import com.example.product.exception.ResourceNotFoundException;
import com.example.product.mapper.ListingMapper;
import com.example.product.repository.ListingRepository;
import com.example.product.repository.ProductRepository;
import com.example.product.service.ListingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class ListingServiceImpl implements ListingService {

    private final ListingRepository listingRepository;
    private final ProductRepository productRepository;
    private final ListingMapper listingMapper;
    private final ProductEventPublisher productEventPublisher;

    @Override
    public ListingResponse createListing(
            CreateListingRequest request,
            UUID sellerId
    ) {

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Product not found with id: " + request.getProductId()
                        )
                );

        if (product.getStatus() != ProductStatus.ACTIVE) {
            throw new IllegalStateException(
                    "Cannot create listing for an inactive or discontinued product"
            );
        }

        if (listingRepository.existsByProductIdAndSellerId(
                request.getProductId(),
                sellerId
        )) {
            throw new IllegalStateException(
                    "You already have a listing for this product"
            );
        }

        Listing listing = Listing.builder()
                .product(product)
                .sellerId(sellerId)
                .sellingPrice(request.getSellingPrice())
                .currency(request.getCurrency().toUpperCase())
                .stockQuantity(request.getStockQuantity())
                .condition(request.getCondition())
                .status(
                        request.getStockQuantity() > 0
                                ? ListingStatus.ACTIVE
                                : ListingStatus.OUT_OF_STOCK
                )
                .build();

        Listing savedListing = listingRepository.save(listing);

        productEventPublisher.publishListingCreated(
                savedListing.getId(),
                savedListing.getProduct().getId(),
                savedListing.getSellerId()
        );

        return listingMapper.toResponse(savedListing);
    }

    @Override
    @Transactional(readOnly = true)
    public ListingResponse getListingById(UUID id) {

        Listing listing = findListingById(id);

        return listingMapper.toResponse(listing);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ListingResponse> getListingsByProductId(UUID productId) {

        return listingRepository.findByProductId(productId)
                .stream()
                .map(listingMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ListingResponse> getListingsBySellerId(UUID sellerId) {

        return listingRepository.findBySellerId(sellerId)
                .stream()
                .map(listingMapper::toResponse)
                .toList();
    }

    @Override
    public ListingResponse updateListing(
            UUID id,
            UpdateListingRequest request,
            UUID currentUserId,
            String currentUserRole
    ) {

        Listing listing = findListingForModification(
                id,
                currentUserId,
                currentUserRole
        );

        Integer oldStock = listing.getStockQuantity();

        if (request.getSellingPrice() != null) {
            listing.setSellingPrice(request.getSellingPrice());
        }

        if (request.getCurrency() != null) {
            listing.setCurrency(request.getCurrency().toUpperCase());
        }

        if (request.getStockQuantity() != null) {
            listing.updateStock(request.getStockQuantity());
        }

        if (request.getCondition() != null) {
            listing.setCondition(request.getCondition());
        }

        Listing updatedListing = listingRepository.save(listing);

        productEventPublisher.publishListingUpdated(
                updatedListing.getId(),
                updatedListing.getProduct().getId(),
                updatedListing.getSellerId()
        );

        if (request.getStockQuantity() != null
                && !oldStock.equals(updatedListing.getStockQuantity())) {

            productEventPublisher.publishListingStockChanged(
                    updatedListing.getId(),
                    updatedListing.getProduct().getId(),
                    updatedListing.getSellerId(),
                    oldStock,
                    updatedListing.getStockQuantity()
            );
        }

        return listingMapper.toResponse(updatedListing);
    }

    @Override
    public void deleteListing(
            UUID id,
            UUID currentUserId,
            String currentUserRole
    ) {

        Listing listing = findListingForModification(
                id,
                currentUserId,
                currentUserRole
        );

        productEventPublisher.publishListingDeleted(
                listing.getId(),
                listing.getProduct().getId(),
                listing.getSellerId()
        );

        listingRepository.delete(listing);
    }

    private Listing findListingById(UUID id) {

        return listingRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Listing not found with id: " + id
                        )
                );
    }

    private Listing findListingForModification(
            UUID id,
            UUID currentUserId,
            String currentUserRole
    ) {

        if ("ADMIN".equalsIgnoreCase(currentUserRole)) {
            return findListingById(id);
        }

        return listingRepository
                .findByIdAndSellerId(id, currentUserId)
                .orElseThrow(() ->
                        new AccessDeniedException(
                                "You are not allowed to modify this listing"
                        )
                );
    }
}