package com.example.wishlist.service.impl;

import com.example.wishlist.client.ProductClient;
import com.example.wishlist.dto.response.WishlistResponse;
import com.example.wishlist.entity.Wishlist;
import com.example.wishlist.entity.WishlistItem;
import com.example.wishlist.event.WishlistEventPublisher;
import com.example.wishlist.exception.DuplicateResourceException;
import com.example.wishlist.exception.ResourceNotFoundException;
import com.example.wishlist.mapper.WishlistMapper;
import com.example.wishlist.repository.WishlistItemRepository;
import com.example.wishlist.repository.WishlistRepository;
import com.example.wishlist.service.WishlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WishlistServiceImpl implements WishlistService {

    private final WishlistRepository wishlistRepository;
    private final WishlistItemRepository wishlistItemRepository;
    private final WishlistMapper wishlistMapper;
    private final WishlistEventPublisher eventPublisher;
    private final ProductClient productClient;

    @Override
    @Transactional
    public WishlistResponse getWishlist(UUID userId) {
        Wishlist wishlist = getOrCreateWishlist(userId);
        return wishlistMapper.toResponse(wishlist);
    }

    @Override
    @Transactional
    public WishlistResponse addItemToWishlist(UUID userId, UUID productId) {
        if (!productClient.existsById(productId)) {
            throw new ResourceNotFoundException("Product not found with id: " + productId);
        }

        Wishlist wishlist = getOrCreateWishlist(userId);

        if (wishlistItemRepository.existsByWishlistIdAndProductId(wishlist.getId(), productId)) {
            throw new DuplicateResourceException("Product already exists in your wishlist: " + productId);
        }

        WishlistItem item = WishlistItem.builder()
                .wishlist(wishlist)
                .productId(productId)
                .build();

        wishlist.getItems().add(item);
        wishlistItemRepository.save(item);

        eventPublisher.publishWishlistAdded(userId, productId);

        return wishlistMapper.toResponse(wishlist);
    }

    @Override
    @Transactional
    public void removeItemFromWishlist(UUID userId, UUID productId) {
        Wishlist wishlist = wishlistRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Wishlist not found for user: " + userId));

        WishlistItem item = wishlistItemRepository.findByWishlistIdAndProductId(wishlist.getId(), productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found in wishlist: " + productId));

        wishlist.getItems().remove(item);
        wishlistItemRepository.delete(item);

        eventPublisher.publishWishlistRemoved(userId, productId);
    }

    private Wishlist getOrCreateWishlist(UUID userId) {
        return wishlistRepository.findByUserIdWithItems(userId)
                .orElseGet(() -> wishlistRepository.save(
                        Wishlist.builder()
                                .userId(userId)
                                .build()
                ));
    }
}
