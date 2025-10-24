// Backend/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from 'path';
import authRoutes from "./routes/auth.js";
import addressRoutes from "./routes/address.js";
import profileRoutes from "./routes/profile.js";
import adminUsersRoutes from "./routes/adminUsers.js";
import authResetRouter from './routes/authReset.js';
import adminProductRoutes from './routes/adminProducts.js';
import pool from './config/db.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Test database connection
pool.connect()
  .then(() => console.log('✅ Connected to NeonDB successfully'))
  .catch(err => console.error('❌ Database connection error:', err));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/admin/users", adminUsersRoutes);
app.use('/auth', authResetRouter);
app.use("/api/admin/products", adminProductRoutes);

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Product routes
app.get("/api/products", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM products");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});

app.post("/api/products", async (req, res) => {
  const { name, description, category, price, stock, images } = req.body;

  if (!name || !description || !category || !price || !stock) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO products (name, description, category, price, stock, images)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, description, category, price, stock, images]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Insert error:", err);
    res.status(500).json({ error: "Database insert failed" });
  }
});

app.put("/api/products/:id", async (req, res) => {
  const { id } = req.params;
  const { name, description, category, price, stock, images } = req.body;
  try {
    const result = await pool.query(
      "UPDATE products SET name=$1, description=$2, category=$3, price=$4, stock=$5, images=$6 WHERE id=$7 RETURNING *",
      [name, description, category, price, stock, images, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating product");
  }
});

app.delete("/api/products/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM products WHERE id = $1", [id]);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting product");
  }
});

app.get("/api/products/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT * FROM products WHERE id = $1", [id]);
    if (result.rows.length === 0) return res.status(404).send("Product not found");
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));