CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_categories_name UNIQUE (name)
);

CREATE INDEX IF NOT EXISTS idx_categories_name ON categories (LOWER(name));

CREATE TABLE IF NOT EXISTS brands (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_brands_name UNIQUE (name)
);

CREATE INDEX IF NOT EXISTS idx_brands_name ON brands (LOWER(name));

CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_tags_name UNIQUE (name)
);

CREATE INDEX IF NOT EXISTS idx_tags_name ON tags (LOWER(name));

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(1000),
    category_id UUID NOT NULL,
    brand_id UUID NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories (id),
    CONSTRAINT fk_products_brand FOREIGN KEY (brand_id) REFERENCES brands (id)
);

CREATE INDEX IF NOT EXISTS idx_products_category_id ON products (category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON products (brand_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products (status);
CREATE INDEX IF NOT EXISTS idx_products_name ON products (LOWER(name));

CREATE TABLE IF NOT EXISTS listings (
    id UUID PRIMARY KEY,
    product_id UUID NOT NULL,
    seller_id UUID NOT NULL,
    selling_price NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    stock_quantity INT NOT NULL DEFAULT 0,
    condition VARCHAR(30) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    version BIGINT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_listings_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
    CONSTRAINT uk_listing_product_seller UNIQUE (product_id, seller_id)
);

CREATE INDEX IF NOT EXISTS idx_listings_product_id ON listings (product_id);
CREATE INDEX IF NOT EXISTS idx_listings_seller_id ON listings (seller_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings (status);

CREATE TABLE IF NOT EXISTS product_tags (
    product_id UUID NOT NULL,
    tag_id UUID NOT NULL,
    PRIMARY KEY (product_id, tag_id),
    CONSTRAINT fk_product_tags_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
    CONSTRAINT fk_product_tags_tag FOREIGN KEY (tag_id) REFERENCES tags (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_product_tags_product ON product_tags (product_id);
CREATE INDEX IF NOT EXISTS idx_product_tags_tag ON product_tags (tag_id);

CREATE TABLE IF NOT EXISTS product_specifications (
    id UUID PRIMARY KEY,
    product_id UUID NOT NULL,
    spec_key VARCHAR(100) NOT NULL,
    spec_value VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_product_spec_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
    CONSTRAINT uk_product_spec_key UNIQUE (product_id, spec_key)
);

CREATE INDEX IF NOT EXISTS idx_product_spec_product_id ON product_specifications (product_id);
CREATE INDEX IF NOT EXISTS idx_product_spec_key_val ON product_specifications (LOWER(spec_key), LOWER(spec_value));
