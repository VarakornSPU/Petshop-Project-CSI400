import express from "express";
import { Pool } from "pg";

const router = express.Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// 🧩 GET /api/products/:id/reviews — ดึงรีวิวทั้งหมดของสินค้านั้น
router.get("/:id/reviews", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "SELECT * FROM product_reviews WHERE product_id = $1 ORDER BY created_at DESC",
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching reviews:", err);
    res.status(500).json({ message: "ไม่สามารถดึงรีวิวได้" });
  }
});

// 🧩 POST /api/products/:id/reviews — เพิ่มรีวิวสินค้า
router.post("/:id/reviews", async (req, res) => {
  try {
    const { id } = req.params;
    const { user_name, rating, comment } = req.body;

    if (!user_name || !rating)
      return res.status(400).json({ message: "กรุณากรอกชื่อและคะแนน" });

    const insert = await pool.query(
      "INSERT INTO product_reviews (product_id, user_name, rating, comment) VALUES ($1,$2,$3,$4) RETURNING *",
      [id, user_name, rating, comment]
    );

    // 🧠 คำนวณค่าเฉลี่ยใหม่แล้วอัปเดตใน products
    const avgResult = await pool.query(
      "SELECT AVG(rating)::numeric(2,1) AS avg, COUNT(*) AS count FROM product_reviews WHERE product_id = $1",
      [id]
    );
    const { avg, count } = avgResult.rows[0];

    await pool.query(
      "UPDATE products SET rating = $1, reviews = $2 WHERE id = $3",
      [avg || 0, count || 0, id]
    );

    res.status(201).json({
      message: "เพิ่มรีวิวสำเร็จ",
      review: insert.rows[0],
    });
  } catch (err) {
    console.error("❌ Error adding review:", err);
    res.status(500).json({ message: "ไม่สามารถเพิ่มรีวิวได้" });
  }
});

export default router;
