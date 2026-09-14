package com.example.cart.event.impl;

import com.example.cart.event.CartEventPublisher;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.UUID;

@Component
@ConditionalOnMissingBean(name = "kafkaCartEventPublisher")
public class LoggingCartEventPublisher implements CartEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(LoggingCartEventPublisher.class);

    @Override
    public void publishCartItemAdded(UUID userId, UUID productId, UUID listingId, Integer quantity) {
        log.info("[EVENT_EMITTED] CART_ITEM_ADDED -> eventId: {}, timestamp: {}, userId: {}, productId: {}, listingId: {}, quantity: {}",
                UUID.randomUUID(), Instant.now(), userId, productId, listingId, quantity);
    }

    @Override
    public void publishCartItemUpdated(UUID userId, UUID productId, UUID listingId, Integer quantity) {
        log.info("[EVENT_EMITTED] CART_ITEM_UPDATED -> eventId: {}, timestamp: {}, userId: {}, productId: {}, listingId: {}, quantity: {}",
                UUID.randomUUID(), Instant.now(), userId, productId, listingId, quantity);
    }

    @Override
    public void publishCartItemRemoved(UUID userId, UUID productId, UUID listingId) {
        log.info("[EVENT_EMITTED] CART_ITEM_REMOVED -> eventId: {}, timestamp: {}, userId: {}, productId: {}, listingId: {}",
                UUID.randomUUID(), Instant.now(), userId, productId, listingId);
    }
}
