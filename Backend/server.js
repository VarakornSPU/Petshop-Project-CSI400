import express from "express";
import cors from "cors";
import pkg from "pg";
import dotenv from "dotenv";
// import fetch from 'node-fetch';

dotenv.config();
const { Pool } = pkg;

const app = express();
app.use(cors());
app.use(express.json());

// เชื่อมต่อ Neon
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// async function fetchDataOnStart() {
//   try {
//     const response = await fetch('https://api.example.com/data');
//     const data = await response.json();
//     console.log('Data fetched on start:', data);
//   } catch (error) {
//     console.error('Fetch error:', error);
//   }
// }

// fetchDataOnStart();

app.get("/api/products", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM products");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});

app.post("/test", (req, res) => {
  console.log("Test route hit");
  res.send("Working!");
});

// เพิ่มสินค้าใหม่
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

// แก้ไขสินค้า
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

// ลบสินค้า
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
