import express from "express";
import pool from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// ดึงตะกร้าของผู้ใช้
router.get("/", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const cartResult = await pool.query("SELECT id FROM carts WHERE user_id = $1 LIMIT 1", [userId]);
    if (cartResult.rows.length === 0) {
      console.log('Cart GET: no cart for user', userId);
      return res.json({ items: [] });
    }

    const cartId = cartResult.rows[0].id;
    const itemsResult = await pool.query(
      `SELECT ci.product_id AS id, p.name, p.price, p.images AS images, ci.quantity
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.cart_id = $1`,
      [cartId]
    );

    console.log('Cart GET:', { userId, cartId, items: itemsResult.rows });
    res.json({ items: itemsResult.rows });
  } catch (err) {
    console.error('Cart GET error:', err);
    res.status(500).json({ error: "Cannot fetch cart", details: err.message });
  }
});

// เพิ่มสินค้าลงตะกร้า
router.post("/add", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { productId, quantity } = req.body;
  try {
    // สร้าง cart ถ้ายังไม่มี
    const cartRes = await pool.query("SELECT id FROM carts WHERE user_id = $1 LIMIT 1", [userId]);
    let cartId;
    if (cartRes.rows.length === 0) {
      const insertCart = await pool.query("INSERT INTO carts (user_id) VALUES ($1) RETURNING id", [userId]);
      cartId = insertCart.rows[0].id;
    } else {
      cartId = cartRes.rows[0].id;
    }

    // ตรวจสอบสินค้าใน cart
    const existing = await pool.query(
      "SELECT id, quantity FROM cart_items WHERE cart_id = $1 AND product_id = $2",
      [cartId, productId]
    );

    if (existing.rows.length > 0) {
      await pool.query(
        "UPDATE cart_items SET quantity = quantity + $1 WHERE id = $2",
        [quantity || 1, existing.rows[0].id]
      );
    } else {
      await pool.query(
        "INSERT INTO cart_items (cart_id, product_id, quantity) VALUES ($1, $2, $3)",
        [cartId, productId, quantity || 1]
      );
    }

    res.json({ message: "เพิ่มสินค้าลงตะกร้าแล้ว" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Cannot add item" });
  }
});

// อัปเดตจำนวนสินค้า
router.put("/update/:productId", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { productId } = req.params;
  const { quantity } = req.body;
  try {
    const cartRes = await pool.query("SELECT id FROM carts WHERE user_id = $1 LIMIT 1", [userId]);
    if (cartRes.rows.length === 0) return res.status(404).json({ error: "Cart not found" });

    const cartId = cartRes.rows[0].id;
    await pool.query(
      "UPDATE cart_items SET quantity = $1 WHERE cart_id = $2 AND product_id = $3",
      [quantity, cartId, productId]
    );

    // ถ้า quantity <= 0 ให้ลบสินค้าออกจากตะกร้า
    if (quantity <= 0) {
      await pool.query(
        "DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2",
        [cartId, productId]
      );
      return res.json({ message: "ลบสินค้าออกจากตะกร้าแล้ว", deleted: true });
    }

    // ถ้า quantity > 0 ให้อัปเดตจำนวน
    await pool.query(
      "UPDATE cart_items SET quantity = $1 WHERE cart_id = $2 AND product_id = $3",
      [quantity, cartId, productId]
    );

    res.json({ message: "อัปเดตจำนวนสินค้าแล้ว" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Cannot update item" });
  }
});

// ลบสินค้า
router.delete("/remove/:productId", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { productId } = req.params;
  try {
    const cartRes = await pool.query("SELECT id FROM carts WHERE user_id = $1 LIMIT 1", [userId]);
    if (cartRes.rows.length === 0) return res.status(404).json({ error: "Cart not found" });

    const cartId = cartRes.rows[0].id;
    await pool.query("DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2", [cartId, productId]);

    res.json({ message: "ลบสินค้าออกจากตะกร้าแล้ว" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Cannot remove item" });
  }
});

// ล้างตะกร้า
router.delete("/clear", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const cartRes = await pool.query("SELECT id FROM carts WHERE user_id = $1 LIMIT 1", [userId]);
    if (cartRes.rows.length > 0) {
      const cartId = cartRes.rows[0].id;
      await pool.query("DELETE FROM cart_items WHERE cart_id = $1", [cartId]);
    }
    res.json({ message: "ล้างตะกร้าแล้ว" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Cannot clear cart" });
  }
});

export default router;
