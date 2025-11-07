import express from "express";
import pool from "../config/db.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// POST /api/payments - สร้าง payment (pending)
router.post("/", authenticateToken, async (req, res) => {
  const { order_id, amount, payment_method } = req.body;
  const userId = req.user.id;

  const client = await pool.connect();
  try {
    // ตรวจสอบ order
    const orderRes = await client.query("SELECT * FROM orders WHERE id = $1", [order_id]);
    if (!orderRes.rows.length) return res.status(404).json({ error: "ไม่พบคำสั่งซื้อ" });

    const order = orderRes.rows[0];
    if (req.user.role !== "admin" && order.user_id !== userId) {
      return res.status(403).json({ error: "ไม่สามารถชำระคำสั่งซื้อนี้ได้" });
    }

    // ตรวจสอบ amount ตรงกับ order.total
    if (Number(order.total) !== Number(amount)) {
      return res.status(400).json({ error: "จำนวนเงินไม่ตรงกับยอดคำสั่งซื้อ" });
    }

    const transaction_id = "MOCK-" + Date.now();

    const result = await client.query(
      `INSERT INTO payments (order_id, user_id, payment_method, amount, payment_status, transaction_id, payment_date, created_at, updated_at)
       VALUES ($1,$2,$3,$4,'pending',$5,NOW(), NOW(), NOW())
       RETURNING *`,
      [order_id, userId, payment_method, amount, transaction_id]
    );

    res.json({ message: "สร้างการชำระเงิน (pending)", payment: result.rows[0] });
  } catch (err) {
    console.error("Create payment error:", err);
    res.status(500).json({ error: "ไม่สามารถสร้าง payment ได้" });
  } finally {
    client.release();
  }
});

// PUT /api/payments/:id/success - ทำให้เป็น success, อัปเดต order, ลด stock (transactional)
router.put("/:id/success", authenticateToken, async (req, res) => {
  const paymentId = req.params.id;
  const userId = req.user.id;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // lock payment + order
    const payRes = await client.query("SELECT * FROM payments WHERE id = $1 FOR UPDATE", [paymentId]);
    if (!payRes.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "ไม่พบการชำระเงิน" });
    }
    const payment = payRes.rows[0];

    // ตรวจสอบสิทธิ์
    if (req.user.role !== "admin" && payment.user_id !== userId) {
      await client.query("ROLLBACK");
      return res.status(403).json({ error: "Forbidden" });
    }

    // ตรวจสอบสถานะ
    if (payment.payment_status === "success") {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "การชำระเงินนี้ถูกทำให้สำเร็จแล้ว" });
    }

    // ดึง order และ items (lock)
    const orderRes = await client.query("SELECT * FROM orders WHERE id = $1 FOR UPDATE", [payment.order_id]);
    if (!orderRes.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "ไม่พบคำสั่งซื้อ" });
    }
    const order = orderRes.rows[0];

    const itemsRes = await client.query("SELECT * FROM order_items WHERE order_id = $1", [order.id]);
    const items = itemsRes.rows;

    // ตรวจสอบ stock และลด stock
    for (const it of items) {
      const prodRes = await client.query("SELECT id, stock FROM products WHERE id = $1 FOR UPDATE", [it.product_id]);
      if (!prodRes.rows.length) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: `ไม่พบสินค้า id=${it.product_id}` });
      }
      const product = prodRes.rows[0];
      const newStock = Number(product.stock) - Number(it.quantity);
      if (newStock < 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: `สินค้ารหัส ${it.product_id} สต็อกไม่เพียงพอ` });
      }
      await client.query("UPDATE products SET stock = $1, updated_at = NOW() WHERE id = $2", [newStock, product.id]);
    }

    // อัปเดต payment -> success
    await client.query("UPDATE payments SET payment_status = 'success', updated_at = NOW() WHERE id = $1", [paymentId]);

    // อัปเดต order -> confirmed
    await client.query("UPDATE orders SET status = 'confirmed', updated_at = NOW() WHERE id = $1", [order.id]);

    await client.query("COMMIT");

    res.json({ message: "ชำระเงินสำเร็จ (จำลอง)", payment_id: paymentId, order_id: order.id });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Payment success error:", err);
    res.status(500).json({ error: "ไม่สามารถอัปเดตการชำระเงินได้" });
  } finally {
    client.release();
  }
});

export default router;