package com.example.cart.service.impl;

import com.example.cart.client.ProductListingClient;
import com.example.cart.client.dto.ListingDto;
import com.example.cart.dto.request.AddToCartRequest;
import com.example.cart.dto.request.UpdateCartItemRequest;
import com.example.cart.dto.response.CartResponse;
import com.example.cart.entity.Cart;
import com.example.cart.entity.CartItem;
import com.example.cart.event.CartEventPublisher;
import com.example.cart.exception.InsufficientStockException;
import com.example.cart.exception.InvalidListingException;
import com.example.cart.exception.ResourceNotFoundException;
import com.example.cart.mapper.CartMapper;
import com.example.cart.repository.CartItemRepository;
import com.example.cart.repository.CartRepository;
import com.example.cart.service.CartService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CartServiceImpl implements CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final CartMapper cartMapper;
    private final CartEventPublisher eventPublisher;
    private final ProductListingClient listingClient;

    @Override
    @Transactional
    public CartResponse getCart(UUID userId) {
        Cart cart = getOrCreateCart(userId);
        Map<UUID, ListingDto> listingDetails = fetchListingDetails(cart);
        return cartMapper.toResponse(cart, listingDetails);
    }

    @Override
    @Transactional
    public CartResponse addItemToCart(UUID userId, AddToCartRequest request) {
        ListingDto listing = validateListing(request.getProductId(), request.getListingId());

        Cart cart = getOrCreateCart(userId);

        Optional<CartItem> existingItemOpt = cartItemRepository.findByCartIdAndListingId(
                cart.getId(), request.getListingId());

        if (existingItemOpt.isPresent()) {
            CartItem existingItem = existingItemOpt.get();
            int newQuantity = existingItem.getQuantity() + request.getQuantity();

            if (listing.getStockQuantity() != null && listing.getStockQuantity() < newQuantity) {
                throw new InsufficientStockException("Insufficient stock. Available: "
                        + listing.getStockQuantity() + ", requested total: " + newQuantity);
            }

            existingItem.setQuantity(newQuantity);
            cartItemRepository.save(existingItem);
            eventPublisher.publishCartItemUpdated(userId, request.getProductId(), request.getListingId(), newQuantity);
        } else {
            if (listing.getStockQuantity() != null && listing.getStockQuantity() < request.getQuantity()) {
                throw new InsufficientStockException("Insufficient stock. Available: "
                        + listing.getStockQuantity() + ", requested: " + request.getQuantity());
            }

            CartItem newItem = CartItem.builder()
                    .cart(cart)
                    .productId(request.getProductId())
                    .listingId(request.getListingId())
                    .quantity(request.getQuantity())
                    .build();

            cart.getItems().add(newItem);
            cartItemRepository.save(newItem);
            eventPublisher.publishCartItemAdded(userId, request.getProductId(), request.getListingId(), request.getQuantity());
        }

        Map<UUID, ListingDto> listingDetails = fetchListingDetails(cart);
        return cartMapper.toResponse(cart, listingDetails);
    }

    @Override
    @Transactional
    public CartResponse updateCartItem(UUID userId, UUID itemId, UpdateCartItemRequest request) {
        Cart cart = cartRepository.findByUserIdWithItems(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart not found for user: " + userId));

        CartItem item = cartItemRepository.findByIdAndCartId(itemId, cart.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found with id: " + itemId));

        ListingDto listing = validateListing(item.getProductId(), item.getListingId());

        if (listing.getStockQuantity() != null && listing.getStockQuantity() < request.getQuantity()) {
            throw new InsufficientStockException("Insufficient stock. Available: "
                    + listing.getStockQuantity() + ", requested: " + request.getQuantity());
        }

        item.setQuantity(request.getQuantity());
        cartItemRepository.save(item);

        eventPublisher.publishCartItemUpdated(userId, item.getProductId(), item.getListingId(), request.getQuantity());

        Map<UUID, ListingDto> listingDetails = fetchListingDetails(cart);
        return cartMapper.toResponse(cart, listingDetails);
    }

    @Override
    @Transactional
    public CartResponse removeCartItem(UUID userId, UUID itemId) {
        Cart cart = cartRepository.findByUserIdWithItems(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart not found for user: " + userId));

        CartItem item = cartItemRepository.findByIdAndCartId(itemId, cart.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found with id: " + itemId));

        cart.getItems().remove(item);
        cartItemRepository.delete(item);

        eventPublisher.publishCartItemRemoved(userId, item.getProductId(), item.getListingId());

        Map<UUID, ListingDto> listingDetails = fetchListingDetails(cart);
        return cartMapper.toResponse(cart, listingDetails);
    }

    @Override
    @Transactional
    public void clearCart(UUID userId) {
        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart not found for user: " + userId));

        cartItemRepository.deleteAllByCartId(cart.getId());
        cart.getItems().clear();
    }

    private Cart getOrCreateCart(UUID userId) {
        return cartRepository.findByUserIdWithItems(userId)
                .orElseGet(() -> cartRepository.save(
                        Cart.builder()
                                .userId(userId)
                                .build()
                ));
    }

    private ListingDto validateListing(UUID productId, UUID listingId) {
        ListingDto listing = listingClient.getListing(productId, listingId)
                .orElseThrow(() -> new InvalidListingException("Listing not found with id: " + listingId));

        if (listing.getProductId() != null && !listing.getProductId().equals(productId)) {
            throw new InvalidListingException("Listing does not belong to product: " + productId);
        }

        if (listing.getStatus() != null && !"ACTIVE".equalsIgnoreCase(listing.getStatus())) {
            throw new InvalidListingException("Listing is not active. Current status: " + listing.getStatus());
        }

        return listing;
    }

    private Map<UUID, ListingDto> fetchListingDetails(Cart cart) {
        Map<UUID, ListingDto> map = new HashMap<>();
        if (cart.getItems() != null) {
            for (CartItem item : cart.getItems()) {
                listingClient.getListing(item.getProductId(), item.getListingId())
                        .ifPresent(dto -> map.put(item.getListingId(), dto));
            }
        }
        return map;
    }
}
