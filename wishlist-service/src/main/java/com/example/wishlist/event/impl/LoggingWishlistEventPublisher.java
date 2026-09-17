package com.example.wishlist.event.impl;

import com.example.wishlist.event.WishlistEventPublisher;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.UUID;

@Component
@ConditionalOnMissingBean(name = "kafkaWishlistEventPublisher")
public class LoggingWishlistEventPublisher implements WishlistEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(LoggingWishlistEventPublisher.class);

    @Override
    public void publishWishlistAdded(UUID userId, UUID productId) {
        log.info("[EVENT_EMITTED] WISHLIST_ADDED -> eventId: {}, timestamp: {}, userId: {}, productId: {}",
                UUID.randomUUID(), Instant.now(), userId, productId);
    }

    @Override
    public void publishWishlistRemoved(UUID userId, UUID productId) {
        log.info("[EVENT_EMITTED] WISHLIST_REMOVED -> eventId: {}, timestamp: {}, userId: {}, productId: {}",
                UUID.randomUUID(), Instant.now(), userId, productId);
    }
}
