CREATE TYPE order_status AS ENUM (
    'PENDING',
    'CONFIRMED',
    'PROCESSING',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
    'REFUNDED',
    'FAILED'
);

CREATE TYPE payment_status AS ENUM (
    'PENDING',
    'PAID',
    'FAILED',
    'REFUNDED',
    'PARTIALLY_REFUNDED'
);

CREATE TABLE orders (
    id                  UUID            NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,

    auth_user_id        UUID            NOT NULL,

    order_number        VARCHAR(64)     NOT NULL UNIQUE,

    idempotency_key     VARCHAR(128)    NOT NULL UNIQUE,

    status              order_status    NOT NULL DEFAULT 'PENDING',
    payment_status      payment_status  NOT NULL DEFAULT 'PENDING',

    subtotal            NUMERIC(19, 4)  NOT NULL CHECK (subtotal >= 0),
    discount_total      NUMERIC(19, 4)  NOT NULL DEFAULT 0 CHECK (discount_total >= 0),
    shipping_cost       NUMERIC(19, 4)  NOT NULL DEFAULT 0 CHECK (shipping_cost >= 0),
    tax_total           NUMERIC(19, 4)  NOT NULL DEFAULT 0 CHECK (tax_total >= 0),
    grand_total         NUMERIC(19, 4)  NOT NULL CHECK (grand_total >= 0),

    currency_code       VARCHAR(3)      NOT NULL DEFAULT 'USD',

    ship_full_name      VARCHAR(150)    NOT NULL,
    ship_phone          VARCHAR(30),
    ship_line1          VARCHAR(255)    NOT NULL,
    ship_line2          VARCHAR(255),
    ship_city           VARCHAR(100)    NOT NULL,
    ship_state          VARCHAR(100),
    ship_postal_code    VARCHAR(20)     NOT NULL,
    ship_country_code   VARCHAR(3)      NOT NULL DEFAULT 'US',

    customer_note       TEXT,
    internal_note       TEXT,

    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    confirmed_at        TIMESTAMPTZ,
    shipped_at          TIMESTAMPTZ,
    delivered_at        TIMESTAMPTZ,
    cancelled_at        TIMESTAMPTZ
);

CREATE TABLE order_items (
    id                  UUID            NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id            UUID            NOT NULL REFERENCES orders(id) ON DELETE CASCADE,

    product_id          UUID            NOT NULL,
    listing_id          UUID,
    seller_id           UUID,
    product_sku         VARCHAR(100),

    product_name        VARCHAR(300)    NOT NULL,
    product_image_url   VARCHAR(2048),

    quantity            INTEGER         NOT NULL CHECK (quantity > 0),
    unit_price          NUMERIC(19, 4)  NOT NULL CHECK (unit_price >= 0),
    discount_amount     NUMERIC(19, 4)  NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    line_total          NUMERIC(19, 4)  NOT NULL CHECK (line_total >= 0),

    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE TABLE order_status_history (
    id              UUID            NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id        UUID            NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    from_status     order_status,
    to_status       order_status    NOT NULL,
    changed_by      UUID,
    reason          VARCHAR(500),
    changed_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);


CREATE INDEX idx_orders_auth_user_id     ON orders(auth_user_id);
CREATE INDEX idx_orders_status           ON orders(status);
CREATE INDEX idx_orders_payment_status   ON orders(payment_status);
CREATE INDEX idx_orders_created_at       ON orders(created_at DESC);
CREATE INDEX idx_orders_order_number     ON orders(order_number);

CREATE INDEX idx_order_items_order_id    ON order_items(order_id);
CREATE INDEX idx_order_items_product_id  ON order_items(product_id);

CREATE INDEX idx_order_status_history_order_id ON order_status_history(order_id);
CREATE INDEX idx_order_status_history_changed_at ON order_status_history(changed_at DESC);

CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_orders_updated_at();
