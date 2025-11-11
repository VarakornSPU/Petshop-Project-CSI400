// Backend/server.js 
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from 'path';
import pool from './config/db.js';

// Routes
import authRoutes from "./routes/auth.js";
import googleAuthRoutes from "./routes/googleAuth.js";
import addressRoutes from "./routes/address.js";
import profileRoutes from "./routes/profile.js";
import adminUsersRoutes from "./routes/adminUsers.js";
import userAccountRoutes from "./routes/userAccount.js";
import adminProductRoutes from './routes/adminProducts.js';
import cartRouter from "./routes/cart.js";
import ordersRoutes from './routes/orders.js';
import paymentsRoutes from './routes/payments.js';
import productReviewsRoutes from './routes/productReviews.js';
import wishlistRoutes from './routes/wishlists.js';

// Passport Configuration
import passport from './config/passport.js';

dotenv.config();

// Diagnostic: print presence of Google OAuth env values (masked where appropriate)
try {
  const gid = process.env.GOOGLE_CLIENT_ID || '';
  const gcb = process.env.GOOGLE_CALLBACK_URL || '';
  const gsec = process.env.GOOGLE_CLIENT_SECRET || '';
  console.log(`GOOGLE_CLIENT_ID: ${gid ? gid : '[missing]'}`);
  console.log(`GOOGLE_CALLBACK_URL: ${gcb ? gcb : '[missing]'}`);
  console.log(`GOOGLE_CLIENT_SECRET: ${gsec ? '[present length=' + gsec.length + ']' : '[missing]'}`);
} catch (e) {
  console.error('Error printing Google env diagnostics:', e);
}

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Passport
app.use(passport.initialize());

// Routes
app.use('/auth', googleAuthRoutes);

// Avoid favicon 404 noise (serve empty response)
app.get('/favicon.ico', (req, res) => res.sendStatus(204));

// Static files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ----- แทนการเรียก pool.connect() ยาว ๆ ด้วยการทดสอบสั้น ๆ และจับ error -----
(async () => {
  try {
    await pool.query('SELECT 1');
    console.log('Connected to Postgres (test query OK)');
  } catch (err) {
    console.error('Postgres test query failed (server will still start):', err.message || err);
  }
})();

// Ensure password reset columns exist (safe, idempotent migration)
(async () => {
  try {
    await pool.query(
      `ALTER TABLE users
       ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255),
       ADD COLUMN IF NOT EXISTS reset_token_hash VARCHAR(255),
       ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP`);
    console.log('Verified users.reset_token, reset_token_hash and reset_token_expires columns');
  } catch (err) {
    console.error('Failed to ensure password reset columns:', err.message || err);
  }
})();

// จับ error ที่เกิดบน idle clients (log ไว้)
if (pool && typeof pool.on === 'function') {
  pool.on('error', (err) => {
    console.error('Unexpected Postgres pool error:', err);
    // ไม่ process.exit เพื่อให้ server ยังทำงานได้ — สามารถเพิ่ม reconnect/backoff ถ้าต้องการ
  });
}

// ป้องกัน uncaught exceptions / unhandled rejections ให้ log ก่อน
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // ถ้าต้องการ restart ให้ใช้ process.exit(1) แล้วใช้ process manager (pm2/systemd/docker) เพื่อ restart
});

// Search
app.get("/api/products/search", async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === '') {
      return res.json([]);
    }

    // แปลงเป็นตัวพิมพ์เล็ก
    const searchText = q.toLowerCase().trim();

    // ✅ พจนานุกรมแปลงคำไทยเป็น category อังกฤษ
    const categoryMap = {
      "อาหารสัตว์เลี้ยง": "food",
      "อาหารสัตว์": "food",
      "ของเล่น": "toys",
      "อุปกรณ์": "accessories",
      "ของใช้": "accessories",
      "อุปกรณ์และของใช้": "accessories"
    };

    // ถ้าคำค้นตรงกับพจนานุกรมให้ใช้ category ที่แมปไว้ด้วย
    const mappedCategory = categoryMap[searchText] || null;

    const searchQuery = `%${searchText}%`;
    const categoryQuery = mappedCategory ? `%${mappedCategory}%` : null;

    // ✅ ถ้ามี category แมปไว้ ให้ค้นด้วย OR category แมปด้วย
    const result = await pool.query(
      `
      SELECT * FROM products
      WHERE 
        LOWER(name) LIKE $1
        OR LOWER(description) LIKE $1
        OR LOWER(category) LIKE $1
        ${categoryQuery ? "OR LOWER(category) LIKE $2" : ""}
      ORDER BY
        CASE
          WHEN LOWER(name) LIKE $1 THEN 1
          WHEN LOWER(category) LIKE $1 THEN 2
          WHEN LOWER(description) LIKE $1 THEN 3
          ELSE 4
        END,
        name ASC
      LIMIT 20
      `,
      categoryQuery ? [searchQuery, categoryQuery] : [searchQuery]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: "Search failed" });
  }
});

// Authentication & User Management
app.use("/api/auth", authRoutes);
app.use("/api/user-account", userAccountRoutes);

// Address Management
app.use("/api/addresses", addressRoutes);

// Profile
app.use("/api/profile", profileRoutes);

// Admin Routes
app.use("/api/admin/users", adminUsersRoutes);
app.use("/api/admin/products", adminProductRoutes);

// Reviews
app.use("/api/products", productReviewsRoutes);

// Wishlist
app.use('/api/wishlists', wishlistRoutes);

// Cart
app.use("/cart", cartRouter);

app.get("/api/products", async (req, res) => {
  try {
    // รับค่า sort เพิ่มเข้ามา
    const { category, sort } = req.query; 

    console.log("📦 GET /api/products - category:", category, "sort:", sort);

    let query = "SELECT * FROM products";
    let params = [];

    if (category && category !== "all") {
      query += " WHERE category = $1";
      params.push(category);
    }

    // ✅ เพิ่ม Logic การเรียงลำดับ (Sorting)
    switch (sort) {
      case "rating":
      query += " ORDER BY rating DESC, reviews DESC"; // คะแนนเยอะสุดขึ้นก่อน
        break;
      case "reviews":
        query += " ORDER BY reviews DESC, rating DESC"; // รีวิวเยอะสุดขึ้นก่อน
        break;
      case "price_asc":
        query += " ORDER BY price ASC"; // ราคาต่ำ -> สูง
        break;
      case "price_desc":
        query += " ORDER BY price DESC"; // ราคาสูง -> ต่ำ
        break;
      case "latest":
      default:
        query += " ORDER BY created_at DESC"; // ล่าสุด (ค่าเริ่มต้น)
        break;
    }

    console.log("🔍 SQL Query:", query);
    console.log("📝 Params:", params);

    const result = await pool.query(query, params);

    console.log(`✅ Found ${result.rows.length} products`);

    res.json(result.rows);
  } catch (err) {
    console.error('Get products error:', err);
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM products WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get product error:', err);
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/api/products", async (req, res) => {
  try {
    const { name, description, category, price, stock, images } = req.body;

    if (!name || !description || !category || !price || !stock) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const result = await pool.query(
      `INSERT INTO products (name, description, category, price, stock, images, rating, reviews)
       VALUES ($1, $2, $3, $4, $5, $6, 0, 0) 
       RETURNING *`,
      [name, description, category, price, stock, images || []]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Insert product error:", err);
    res.status(500).json({ error: "Database insert failed" });
  }
});

app.put("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category, price, stock, images } = req.body;

    const result = await pool.query(
      `UPDATE products 
       SET name = $1, description = $2, category = $3, price = $4, stock = $5, images = $6
       WHERE id = $7 
       RETURNING *`,
      [name, description, category, price, stock, images, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update product error:', err);
    res.status(500).json({ error: "Error updating product" });
  }
});

app.delete("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "DELETE FROM products WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.status(204).send();
  } catch (err) {
    console.error('Delete product error:', err);
    res.status(500).json({ error: "Error deleting product" });
  }
});

app.use('/api/orders', ordersRoutes);
app.use('/api/payments', paymentsRoutes);

app.get("/health", async (req, res) => {
  try {
    // Test database connection
    await pool.query('SELECT 1');

    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      database: "connected",
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      timestamp: new Date().toISOString(),
      database: "disconnected",
      error: error.message
    });
  }
});


app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    method: req.method
  });
});


app.use((error, req, res, next) => {
  console.error('Server Error:', error);

  res.status(error.status || 500).json({
    error: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📦 Products API: http://localhost:${PORT}/api/products`);
});