-- USERS TABLE
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'customer',
    is_banned BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP,
    deleted_reason TEXT,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    last_login TIMESTAMP,
    google_id VARCHAR(255) UNIQUE,
    reset_token_hash VARCHAR(255),
    reset_token_expires TIMESTAMP,
    CONSTRAINT users_role_check CHECK (role IN ('customer', 'admin'))
);

-- Indexes for users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_deleted ON users(is_deleted);
CREATE INDEX idx_users_reset_token_hash ON users(reset_token_hash);

-- PRODUCTS TABLE
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    stock INTEGER DEFAULT 0,
    images TEXT[],
    rating NUMERIC(2,1) DEFAULT 0,
    reviews INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for products
CREATE INDEX idx_products_category ON products(category);

-- ADDRESSES TABLE
CREATE TABLE addresses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    recipient_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    subdistrict VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    province VARCHAR(100) NOT NULL,
    postal_code VARCHAR(10) NOT NULL,
    is_default BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- Indexes for addresses
CREATE INDEX idx_addresses_user ON addresses(user_id);
CREATE INDEX idx_addresses_default ON addresses(user_id, is_default);
CREATE UNIQUE INDEX unique_default_per_user ON addresses(user_id) WHERE is_default = true;

-- CARTS TABLE
CREATE TABLE carts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT carts_user_id_fkey FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE
);

-- CART_ITEMS TABLE
CREATE TABLE cart_items (
    id SERIAL PRIMARY KEY,
    cart_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT cart_items_cart_id_fkey FOREIGN KEY (cart_id) 
        REFERENCES carts(id) ON DELETE CASCADE,
    CONSTRAINT cart_items_product_id_fkey FOREIGN KEY (product_id) 
        REFERENCES products(id) ON DELETE CASCADE
);

-- Indexes for cart_items
CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);

-- ORDERS TABLE
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    shipping_recipient_name VARCHAR(100) NOT NULL,
    shipping_phone VARCHAR(20) NOT NULL,
    shipping_address_line1 VARCHAR(255) NOT NULL,
    shipping_address_line2 VARCHAR(255),
    shipping_subdistrict VARCHAR(100) NOT NULL,
    shipping_district VARCHAR(100) NOT NULL,
    shipping_province VARCHAR(100) NOT NULL,
    shipping_postal_code VARCHAR(10) NOT NULL,
    subtotal NUMERIC(10,2) NOT NULL,
    shipping_fee NUMERIC(10,2) DEFAULT 0,
    total NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    cancelled_at TIMESTAMP,
    delivered_at TIMESTAMP,
    shipped_at TIMESTAMP,
    tracking_number TEXT,
    courier TEXT,
    CONSTRAINT orders_status_check CHECK (status IN (
        'pending_payment', 'paid', 'preparing', 'ready_to_ship', 
        'shipping', 'completed', 'cancelled'
    ))
);

-- Indexes for orders
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_number ON orders(order_number);

-- ORDER_ITEMS TABLE
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    product_price NUMERIC(10,2) NOT NULL,
    quantity INTEGER NOT NULL,
    subtotal NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT now(),
    CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) 
        REFERENCES orders(id) ON DELETE CASCADE
);

-- Indexes for order_items
CREATE INDEX idx_order_items_order ON order_items(order_id);

-- PAYMENTS TABLE
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'pending',
    transaction_id VARCHAR(100),
    payment_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    CONSTRAINT payments_payment_status_check CHECK (payment_status IN (
        'pending', 'success', 'failed', 'refunded'
    )),
    CONSTRAINT payments_order_id_fkey FOREIGN KEY (order_id) 
        REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT payments_user_id_fkey FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for payments
CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(payment_status);

-- PRODUCT_REVIEWS TABLE
CREATE TABLE product_reviews (
    id SERIAL PRIMARY KEY,
    product_id INTEGER,
    user_name TEXT NOT NULL,
    rating SMALLINT,
    comment TEXT,
    created_at TIMESTAMP DEFAULT now(),
    CONSTRAINT product_reviews_rating_check CHECK (rating >= 1 AND rating <= 5),
    CONSTRAINT product_reviews_product_id_fkey FOREIGN KEY (product_id) 
        REFERENCES products(id) ON DELETE CASCADE
);

-- REFRESH_TOKENS TABLE
CREATE TABLE refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT now(),
    revoked BOOLEAN DEFAULT false,
    token_hash VARCHAR(128),
    replaced_by INTEGER,
    CONSTRAINT fk_refresh_tokens_replaced_by FOREIGN KEY (replaced_by) 
        REFERENCES refresh_tokens(id) ON DELETE SET NULL
);

-- Indexes for refresh_tokens
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);

-- AUDIT_LOGS TABLE
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    action VARCHAR(100) NOT NULL,
    details JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT now()
);

-- Indexes for audit_logs
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- VIEWS

-- User Cart View
CREATE VIEW user_cart_view AS
SELECT 
    c.user_id,
    ci.product_id,
    p.name AS product_name,
    p.price AS product_price,
    ci.quantity,
    p.price * ci.quantity::numeric AS total_price
FROM cart_items ci
JOIN carts c ON ci.cart_id = c.id
JOIN products p ON ci.product_id = p.id;

-- SAMPLE COMMENTS

COMMENT ON TABLE users IS 'Stores user account information';
COMMENT ON TABLE products IS 'Stores product catalog';
COMMENT ON TABLE orders IS 'Stores customer orders';
COMMENT ON TABLE payments IS 'Stores payment transactions';
COMMENT ON TABLE audit_logs IS 'Tracks user activities for security and compliance';

-- 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