import express from "express";
import { Pool } from "pg";
import { authenticateToken } from "../middleware/auth.js";

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

// 🧩 POST /api/products/:id/reviews — เพิ่มรีวิวสินค้า (ต้องล็อกอิน)
router.post("/:id/reviews", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { user_name, rating, comment } = req.body;
        const user_id = req.user.id; // ได้จาก middleware

        if (!user_name || !rating)
            return res.status(400).json({ message: "กรุณากรอกชื่อและคะแนน" });

        // ตรวจสอบว่าเคยรีวิวไปแล้วหรือยัง
        const existingReview = await pool.query(
            "SELECT id FROM product_reviews WHERE product_id = $1 AND user_id = $2",
            [id, user_id]
        );

        if (existingReview.rows.length > 0) {
            return res.status(400).json({ message: "คุณเคยรีวิวสินค้านี้ไปแล้ว" });
        }

        const insert = await pool.query(
            "INSERT INTO product_reviews (product_id, user_id, user_name, rating, comment) VALUES ($1, $2, $3, $4, $5) RETURNING *",
            [id, user_id, user_name, rating, comment]
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

// 🧩 DELETE /api/products/:id/reviews/:reviewId — ลบรีวิว
router.delete("/:id/reviews/:reviewId", authenticateToken, async (req, res) => {
    try {
        const { id, reviewId } = req.params;
        const user_id = req.user.id;

        // ตรวจสอบว่าเป็นเจ้าของรีวิวหรือเป็น admin
        const review = await pool.query(
            "SELECT * FROM product_reviews WHERE id = $1 AND product_id = $2",
            [reviewId, id]
        );

        if (review.rows.length === 0) {
            return res.status(404).json({ message: "ไม่พบรีวิว" });
        }

        // ตรวจสอบสิทธิ์ (เจ้าของรีวิวหรือ admin)
        if (review.rows[0].user_id !== user_id && req.user.role !== 'admin') {
            return res.status(403).json({ message: "คุณไม่มีสิทธิ์ลบรีวิวนี้" });
        }

        await pool.query(
            "DELETE FROM product_reviews WHERE id = $1 AND product_id = $2",
            [reviewId, id]
        );

        // อัปเดตค่า rating ใหม่
        const avgResult = await pool.query(
            "SELECT AVG(rating)::numeric(2,1) AS avg, COUNT(*) AS count FROM product_reviews WHERE product_id = $1",
            [id]
        );
        const { avg, count } = avgResult.rows[0];

        await pool.query(
            "UPDATE products SET rating = $1, reviews = $2 WHERE id = $3",
            [avg || 0, count || 0, id]
        );

        res.json({ message: "ลบรีวิวสำเร็จ" });
    } catch (err) {
        console.error("❌ Error deleting review:", err);
        res.status(500).json({ message: "ไม่สามารถลบรีวิวได้" });
    }
});

export default router;
