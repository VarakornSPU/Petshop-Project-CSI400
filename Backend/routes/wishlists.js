// Backend/routes/wishlists.js
import express from "express";
import pool from "../config/db.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// GET /api/wishlists - ดึงรายการ wishlist ของ user
router.get("/", authenticateToken, async (req, res) => {
    const userId = req.user.id;
    
    try {
        const result = await pool.query(
            `SELECT 
                w.id,
                w.product_id,
                w.created_at,
                p.name,
                p.description,
                p.category,
                p.price,
                p.stock,
                p.images,
                p.rating,
                p.reviews
            FROM wishlists w
            JOIN products p ON w.product_id = p.id
            WHERE w.user_id = $1
            ORDER BY w.created_at DESC`,
            [userId]
        );
        
        res.json({ wishlists: result.rows });
    } catch (err) {
        console.error("Error fetching wishlists:", err);
        res.status(500).json({ error: "ไม่สามารถดึงรายการสินค้าที่ถูกใจได้" });
    }
});

// POST /api/wishlists - เพิ่มสินค้าใน wishlist
router.post("/", authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { product_id } = req.body;
    
    if (!product_id) {
        return res.status(400).json({ error: "กรุณาระบุ product_id" });
    }
    
    try {
        // ตรวจสอบว่าสินค้ามีอยู่จริง
        const productCheck = await pool.query(
            "SELECT id FROM products WHERE id = $1",
            [product_id]
        );
        
        if (productCheck.rows.length === 0) {
            return res.status(404).json({ error: "ไม่พบสินค้า" });
        }
        
        // ตรวจสอบว่ามีอยู่ใน wishlist แล้วหรือไม่
        const existingCheck = await pool.query(
            "SELECT id FROM wishlists WHERE user_id = $1 AND product_id = $2",
            [userId, product_id]
        );
        
        if (existingCheck.rows.length > 0) {
            return res.status(400).json({ 
                error: "สินค้านี้อยู่ในรายการที่ถูกใจแล้ว",
                exists: true 
            });
        }
        
        // เพิ่มเข้า wishlist
        const result = await pool.query(
            `INSERT INTO wishlists (user_id, product_id, created_at)
             VALUES ($1, $2, NOW())
             RETURNING *`,
            [userId, product_id]
        );
        
        res.status(201).json({ 
            message: "เพิ่มสินค้าในรายการที่ถูกใจแล้ว",
            wishlist: result.rows[0]
        });
    } catch (err) {
        console.error("Error adding to wishlist:", err);
        // ตรวจสอบว่าเป็น unique constraint violation หรือไม่
        if (err.code === '23505') {
            return res.status(400).json({ 
                error: "สินค้านี้อยู่ในรายการที่ถูกใจแล้ว",
                exists: true 
            });
        }
        res.status(500).json({ error: "ไม่สามารถเพิ่มสินค้าในรายการที่ถูกใจได้" });
    }
});

// DELETE /api/wishlists/:productId - ลบสินค้าออกจาก wishlist
router.delete("/:productId", authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const productId = req.params.productId;
    
    try {
        const result = await pool.query(
            "DELETE FROM wishlists WHERE user_id = $1 AND product_id = $2 RETURNING *",
            [userId, productId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "ไม่พบสินค้าในรายการที่ถูกใจ" });
        }
        
        res.json({ 
            message: "ลบสินค้าออกจากรายการที่ถูกใจแล้ว",
            wishlist: result.rows[0]
        });
    } catch (err) {
        console.error("Error removing from wishlist:", err);
        res.status(500).json({ error: "ไม่สามารถลบสินค้าออกจากรายการที่ถูกใจได้" });
    }
});

// GET /api/wishlists/check/:productId - ตรวจสอบว่าสินค้าอยู่ใน wishlist หรือไม่
router.get("/check/:productId", authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const productId = req.params.productId;
    
    try {
        const result = await pool.query(
            "SELECT id FROM wishlists WHERE user_id = $1 AND product_id = $2",
            [userId, productId]
        );
        
        res.json({ 
            inWishlist: result.rows.length > 0,
            wishlistId: result.rows[0]?.id || null
        });
    } catch (err) {
        console.error("Error checking wishlist:", err);
        res.status(500).json({ error: "ไม่สามารถตรวจสอบได้" });
    }
});

// DELETE /api/wishlists - ล้างรายการ wishlist ทั้งหมด
router.delete("/", authenticateToken, async (req, res) => {
    const userId = req.user.id;
    
    try {
        const result = await pool.query(
            "DELETE FROM wishlists WHERE user_id = $1 RETURNING *",
            [userId]
        );
        
        res.json({ 
            message: "ล้างรายการที่ถูกใจแล้ว",
            deletedCount: result.rows.length
        });
    } catch (err) {
        console.error("Error clearing wishlist:", err);
        res.status(500).json({ error: "ไม่สามารถล้างรายการที่ถูกใจได้" });
    }
});

export default router;