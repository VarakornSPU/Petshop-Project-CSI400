-- Products table
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  stock INTEGER DEFAULT 0,
  images TEXT,
  rating DECIMAL(2, 1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- Insert sample products
INSERT INTO products (name, description, category, price, stock, images, rating)
VALUES 
  ('Royal Canin อาหารสุนัข 1kg', 'อาหารสุนัขคุณภาพสูง เหมาะสำหรับสุนัขโตทุกสายพันธุ์', 'food', 450, 50, '🐕', 4.5),
  ('Whiskas อาหารแมว 1kg', 'อาหารแมวรสปลาทูน่า อร่อยและมีประโยชน์', 'food', 320, 75, '😺', 4.3),
  ('ของเล่นลูกบอล', 'ลูกบอลยางสำหรับสุนัข ทนทาน เด้งได้', 'toys', 89, 100, '⚽', 4.0),
  ('ที่นอนสุนัข', 'ที่นอนนุ่มสบายสำหรับสุนัข ขนาดกลาง', 'accessories', 890, 30, '🛏️', 4.7),
  ('กรงแมว', 'กรงแมวสแตนเลส มีล้อเลื่อน', 'accessories', 2490, 15, '🏠', 4.6)
ON CONFLICT DO NOTHING;


-- อัปเดตใหม่
--  1. USERS TABLE 

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  
  -- Account Status
  is_banned BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,  -- Soft delete flag
  deleted_at TIMESTAMP,
  deleted_reason TEXT,  -- เหตุผลที่ลบ

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_deleted ON users(is_deleted);

--  2. ADDRESSES TABLE (Enhanced)
CREATE TABLE addresses (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Address Details
  recipient_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address_line1 VARCHAR(255) NOT NULL,
  address_line2 VARCHAR(255),
  subdistrict VARCHAR(100) NOT NULL,
  district VARCHAR(100) NOT NULL,
  province VARCHAR(100) NOT NULL,
  postal_code VARCHAR(10) NOT NULL,
  
  -- Metadata
  is_default BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,  -- Soft delete
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

--  Partial Unique Index (แทน WHERE ใน CONSTRAINT)
CREATE UNIQUE INDEX unique_default_per_user 
ON addresses(user_id)
WHERE is_default = TRUE AND is_deleted = FALSE;

CREATE INDEX idx_addresses_user ON addresses(user_id);
CREATE INDEX idx_addresses_default ON addresses(user_id, is_default);

--  3. ORDERS TABLE
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  
  -- Order Info
  order_number VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (
    status IN ('pending', 'confirmed', 'processing', 'shipping', 'delivered', 'cancelled')
  ),
  
  -- Address Snapshot
  shipping_recipient_name VARCHAR(100) NOT NULL,
  shipping_phone VARCHAR(20) NOT NULL,
  shipping_address_line1 VARCHAR(255) NOT NULL,
  shipping_address_line2 VARCHAR(255),
  shipping_subdistrict VARCHAR(100) NOT NULL,
  shipping_district VARCHAR(100) NOT NULL,
  shipping_province VARCHAR(100) NOT NULL,
  shipping_postal_code VARCHAR(10) NOT NULL,
  
  -- Pricing
  subtotal DECIMAL(10, 2) NOT NULL,
  shipping_fee DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  cancelled_at TIMESTAMP,
  delivered_at TIMESTAMP
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_number ON orders(order_number);

--  4. ORDER ITEMS TABLE
--  ต้องแน่ใจว่ามีตาราง products ก่อน ไม่งั้น FK จะ error
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL,  -- เอา FK ออกถ้ายังไม่มี products
  
  -- Product Snapshot
  product_name VARCHAR(255) NOT NULL,
  product_price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);

--  5. REFRESH TOKENS TABLE
CREATE TABLE refresh_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  revoked BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);

--  6. AUDIT LOG TABLE
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action VARCHAR(100) NOT NULL,  -- 'login', 'logout', etc.
  details JSONB,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

--  FUNCTIONS & TRIGGERS
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER addresses_updated_at
  BEFORE UPDATE ON addresses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

--  DATAจำลอง
INSERT INTO users (email, password_hash, first_name, last_name, role)
VALUES ('admin@petshop.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIRSL0zNiG', 'Admin', 'System', 'admin');

INSERT INTO users (email, password_hash, first_name, last_name, phone)
VALUES ('customer@test.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIRSL0zNiG', 'ทดสอบ', 'ลูกค้า', '0812345678');
