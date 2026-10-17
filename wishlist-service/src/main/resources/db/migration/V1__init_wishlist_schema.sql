-- =============================================================================
-- Migration: V1__init_wishlist_schema.sql
-- Description: Create initial schema for Wishlist Service (User Wishlists & Items)
-- =============================================================================

-- Table: wishlists
CREATE TABLE IF NOT EXISTS wishlists (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_wishlists_user_id UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON wishlists (user_id);

-- Table: wishlist_items
CREATE TABLE IF NOT EXISTS wishlist_items (
    id UUID PRIMARY KEY,
    wishlist_id UUID NOT NULL,
    product_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_wishlist_items_wishlist FOREIGN KEY (wishlist_id) REFERENCES wishlists (id) ON DELETE CASCADE,
    CONSTRAINT uk_wishlist_items_wishlist_product UNIQUE (wishlist_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlist_items_wishlist_id ON wishlist_items (wishlist_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_product_id ON wishlist_items (product_id);
