// Backend/server.js 
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from 'path';
import pool from './config/db.js';

// Routes
import authRoutes from "./routes/auth.js";
import addressRoutes from "./routes/address.js";
import profileRoutes from "./routes/profile.js";
import adminUsersRoutes from "./routes/adminUsers.js";
import userAccountRoutes from "./routes/userAccount.js";
import adminProductRoutes from './routes/adminProducts.js';

dotenv.config();

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

pool.connect()
  .then(() => {
    console.log('Connected to NeonDB successfully');
    console.log('Database Host:', pool.options.host);
  })
  .catch(err => {
    console.error('Database connection error:', err);
    process.exit(1);
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


app.get("/api/products", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM products ORDER BY created_at DESC");
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