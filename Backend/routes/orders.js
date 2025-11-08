import express from "express";
import pool from "../config/db.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

const toBangkok = (dt) => {
    if (!dt) return null;
    try {
        return new Date(dt).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });
    } catch (e) {
        return dt;
    }
};

// POST /api/orders - สร้างคำสั่งซื้อ (authenticated)
router.post("/", authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { items = [], shipping = {}, subtotal = 0, shipping_fee = 0, total = 0 } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "ไม่มีรายการสินค้า" });
    }

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        // generate order number
        const orderNumber = 'ORD-' + Date.now().toString(36).toUpperCase();

        // map shipping object to DB columns (names from your schema)
        const shippingRecipientName = shipping.name || shipping.recipientName || "";
        const shippingPhone = shipping.phone || "";
        const shippingLine1 = shipping.line1 || shipping.addressLine1 || "";
        const shippingLine2 = shipping.address_line2 || shipping.addressLine2 || "";
        const shippingSubdistrict = shipping.subdistrict || "";
        const shippingDistrict = shipping.district || "";
        const shippingProvince = shipping.province || "";
        const shippingPostalCode = shipping.postal_code || shipping.postalCode || "";

        const orderResult = await client.query(
            `INSERT INTO orders (
         user_id, order_number, status,
         shipping_recipient_name, shipping_phone,
         shipping_address_line1, shipping_address_line2,
         shipping_subdistrict, shipping_district, shipping_province, shipping_postal_code,
         subtotal, shipping_fee, total, created_at
       ) VALUES ($1,$2,'pending_payment',$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW())
       RETURNING *`,
            [
                userId, orderNumber,
                shippingRecipientName, shippingPhone,
                shippingLine1, shippingLine2,
                shippingSubdistrict, shippingDistrict, shippingProvince, shippingPostalCode,
                subtotal, shipping_fee, total
            ]
        );
        const order = orderResult.rows[0];

        // --- เพิ่ม: ดึงเวลาแปลงเป็น Asia/Bangkok จาก DB โดยตรง ---
        const timeRes = await client.query(
            `SELECT to_char((created_at AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Bangkok', 'YYYY-MM-DD HH24:MI:SS') AS created_at_local,
                  to_char((updated_at AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Bangkok', 'YYYY-MM-DD HH24:MI:SS') AS updated_at_local
           FROM orders WHERE id = $1`,
            [order.id]
        );
        if (timeRes.rows[0]) {
            order.created_at_local = timeRes.rows[0].created_at_local;
            order.updated_at_local = timeRes.rows[0].updated_at_local;

            // --- เพิ่ม: ดึงชื่อผู้ใช้และฟิลด์ date ให้ frontend ใช้ง่าย ---
            const userRes = await client.query("SELECT first_name, last_name FROM users WHERE id = $1", [order.user_id]);
            const usr = userRes.rows[0];
            order.customer = usr ? `${usr.first_name} ${usr.last_name}` : `user#${order.user_id}`;
            order.date = order.created_at_local;
        }

        // Insert order items
        for (const it of items) {
            const { product_id, product_name, product_price, quantity, subtotal: itemSubtotal } = it;
            await client.query(
                `INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, subtotal)
         VALUES ($1, $2, $3, $4, $5, $6)`,
                [order.id, product_id, product_name, product_price, quantity, itemSubtotal]
            );
        }

        await client.query("COMMIT");

        res.status(201).json({ order: { ...order, items } });
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("Create order error:", err);
        res.status(500).json({ error: "ไม่สามารถสร้างคำสั่งซื้อได้", details: err.message });
    } finally {
        client.release();
    }
});

// เปลี่ยน GET /api/orders ให้คืนเฉพาะคำสั่งซื้อของ user เสมอ (ไม่คืนทั้งหมดเมื่อเป็น admin)
router.get("/", authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        // 1) ดึงรายการคำสั่งซื้อของ user ทั้งหมด + เวลาไทยใน Query เดียว (รวม delivered_at_local)
        const ordersRes = await client.query(`
            SELECT 
                o.*, 
                to_char((o.created_at AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Bangkok','YYYY-MM-DD HH24:MI:SS') AS created_at_local,
                to_char((o.updated_at AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Bangkok','YYYY-MM-DD HH24:MI:SS') AS updated_at_local,
                to_char((o.delivered_at AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Bangkok','YYYY-MM-DD HH24:MI:SS') AS delivered_at_local
            FROM orders o 
            WHERE user_id = $1 
            ORDER BY created_at DESC
        `, [req.user.id]);

        const orders = ordersRes.rows;
        const orderIds = orders.map(o => o.id);

        // หากไม่มีคำสั่งซื้อ ให้คืนค่าทันที
        if (orderIds.length === 0) {
            return res.json({ orders: [] });
        }

        // 2) ดึง items ทั้งหมดใน Batch เดียว (แก้ปัญหา N+1)
        const itemsRes = await client.query(
            `SELECT * FROM order_items WHERE order_id = ANY($1)`,
            [orderIds]
        );

        // 3) ดึง payments ทั้งหมดใน Batch เดียว (แก้ปัญหา N+1)
        const paymentsRes = await client.query(
            `SELECT p.*, to_char((p.created_at AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Bangkok','YYYY-MM-DD HH24:MI:SS') AS created_at_local
             FROM payments p 
             WHERE order_id = ANY($1) 
             ORDER BY p.created_at DESC`,
            [orderIds]
        );

        // 4) จัดกลุ่มและผูกข้อมูล
        const itemsByOrder = {};
        for (const it of itemsRes.rows) (itemsByOrder[it.order_id] ||= []).push(it);
        const paymentsByOrder = {};
        for (const p of paymentsRes.rows) (paymentsByOrder[p.order_id] ||= []).push(p);

        for (const o of orders) {
            o.items = itemsByOrder[o.id] || [];
            o.payments = paymentsByOrder[o.id] || [];
            // ใช้ข้อมูลผู้ใช้ที่ล็อกอินอยู่ (เพราะเป็นคำสั่งซื้อของเขา)
            o.customer = `${req.user.first_name || ''} ${req.user.last_name || ''}`.trim();
            o.date = o.created_at_local;
        }

        res.json({ orders });
    } catch (err) {
        console.error("Get user orders error:", err);
        res.status(500).json({ error: "Cannot fetch orders" });
    } finally {
        client.release();
    }
});

router.get("/admin", authenticateToken, async (req, res) => {
    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ error: "Forbidden" });
    }

    const client = await pool.connect();
    try {
        // ✅ ดึง orders ทั้งหมด (Admin)
        const ordersRes = await client.query(`
            SELECT 
                o.*, 
                to_char((o.created_at AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Bangkok','YYYY-MM-DD HH24:MI:SS') AS created_at_local,
                to_char((o.updated_at AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Bangkok','YYYY-MM-DD HH24:MI:SS') AS updated_at_local,
                to_char((o.delivered_at AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Bangkok','YYYY-MM-DD HH24:MI:SS') AS delivered_at_local -- เพิ่ม delivered_at_local
            FROM orders o
            ORDER BY o.created_at DESC
            LIMIT 500
        `);

        const orders = ordersRes.rows;
        const orderIds = orders.map(o => o.id);
        if (orderIds.length === 0) {
            return res.json({ orders: [], stats: { totalOrders: 0, totalRevenue: 0, totalCustomers: 0 } });
        }

        // ✅ ดึง user info แยก (กันกรณี user ถูกลบหรือ id null)
        const userIds = orders.filter(o => o.user_id).map(o => o.user_id);
        const usersRes = userIds.length
            ? await client.query("SELECT id, first_name, last_name, email FROM users WHERE id = ANY($1)", [userIds])
            : { rows: [] };

        const userMap = {};
        for (const u of usersRes.rows) {
            userMap[u.id] = u;
        }

        // ✅ ดึง items + payments (Batch Fetching)
        const itemsRes = await client.query(`SELECT * FROM order_items WHERE order_id = ANY($1)`, [orderIds]);
        const paymentsRes = await client.query(`
            SELECT p.*, 
                   to_char((p.created_at AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Bangkok','YYYY-MM-DD HH24:MI:SS') AS created_at_local
            FROM payments p 
            WHERE order_id = ANY($1)
            ORDER BY p.created_at DESC
        `, [orderIds]);

        const itemsByOrder = {};
        for (const it of itemsRes.rows) (itemsByOrder[it.order_id] ||= []).push(it);
        const paymentsByOrder = {};
        for (const p of paymentsRes.rows) (paymentsByOrder[p.order_id] ||= []).push(p);

        // ✅ รวมข้อมูลทั้งหมด
        for (const o of orders) {
            o.items = itemsByOrder[o.id] || [];
            o.payments = paymentsByOrder[o.id] || [];
            const usr = o.user_id ? userMap[o.user_id] : null;

            o.customer = usr
                ? `${usr.first_name || ''} ${usr.last_name || ''}`.trim()
                : (o.email || `user#${o.user_id || 'guest'}`);

            o.date = o.created_at_local || o.created_at;
        }

        const totalOrders = orders.length;
        const totalRevenue = orders.reduce((sum, x) => sum + Number(x.total || 0), 0);
        const uniqueCustomers = new Set(orders.map(o => o.user_id || `guest-${o.id}`)).size;

        res.json({
            orders,
            stats: { totalOrders, totalRevenue, totalCustomers: uniqueCustomers }
        });

    } catch (err) {
        console.error("Get all orders (admin) error:", err);
        res.status(500).json({ error: "Cannot fetch orders" });
    } finally {
        client.release();
    }
});


// เพิ่ม: GET /api/orders/:id - ดึงรายละเอียดคำสั่งซื้อ (ตรวจสิทธิ์)
router.get("/:id", authenticateToken, async (req, res) => {
    const id = Number(req.params.id);
    const client = await pool.connect();
    try {
        const ordRes = await client.query("SELECT * FROM orders WHERE id = $1", [id]);
        if (ordRes.rowCount === 0) return res.status(404).json({ error: "Order not found" });
        const o = ordRes.rows[0];

        // items / payments
        const itemsRes = await client.query("SELECT * FROM order_items WHERE order_id = $1", [o.id]);
        const paymentsRes = await client.query(
            `SELECT p.*, to_char((p.created_at AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Bangkok','YYYY-MM-DD HH24:MI:SS') AS created_at_local
           FROM payments p WHERE order_id = $1 ORDER BY p.created_at DESC`,
            [o.id]
        );
        o.items = itemsRes.rows;
        o.payments = paymentsRes.rows;

        // customer name
        const userRes = await client.query("SELECT first_name, last_name, email FROM users WHERE id = $1", [o.user_id]);
        const usr = userRes.rows[0];
        const customer = usr ? `${usr.first_name} ${usr.last_name}`.trim() : null;

        // created_at_local from DB (Bangkok)
        const timeRes = await client.query(
            `SELECT to_char((created_at AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Bangkok', 'YYYY-MM-DD HH24:MI:SS') AS created_at_local
       FROM orders WHERE id = $1`, [o.id]
        );
        o.created_at_local = timeRes.rows[0] ? timeRes.rows[0].created_at_local : o.created_at;

        const order = {
            ...o,
            customer: o.customer || customer,
            date: o.created_at_local,
            items: itemsRes.rows,
            payments: paymentsRes.rows
        };

        // authorization: allow admin OR owner
        if (!(req.user.role === "admin" || req.user.id === o.user_id)) {
            return res.status(403).json({ error: "Forbidden" });
        }

        res.json({ order });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Cannot fetch order" });
    } finally {
        client.release();
    }
});

// --- เพิ่ม endpoint สำหรับ admin เปลี่ยนสถานะคำสั่งซื้อ ---
router.put("/:id/status", authenticateToken, async (req, res) => {
    const id = Number(req.params.id);
    const { status } = req.body;
    const allowed = ['pending_payment', 'paid', 'preparing', 'ready_to_ship', 'shipping', 'completed', 'cancelled'];
    if (!allowed.includes((status || "").toString().toLowerCase())) {
        return res.status(400).json({ error: "Invalid status" });
    }
    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ error: "Forbidden" });
    }

    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const upd = await client.query(
            `UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
            [status.toString().toLowerCase(), id]
        );
        if (upd.rowCount === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ error: "Order not found" });
        }
        const o = upd.rows[0];

        // fetch items & payments
        const itemsRes = await client.query("SELECT * FROM order_items WHERE order_id = $1", [o.id]);
        const paymentsRes = await client.query("SELECT * FROM payments WHERE order_id = $1 ORDER BY created_at DESC", [o.id]);

        // created_at_local from DB
        const timeRes = await client.query(
            `SELECT to_char((created_at AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Bangkok', 'YYYY-MM-DD HH24:MI:SS') AS created_at_local,
              to_char((updated_at AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Bangkok', 'YYYY-MM-DD HH24:MI:SS') AS updated_at_local
       FROM orders WHERE id = $1`,
            [o.id]
        );

        // customer info
        const userRes = await client.query("SELECT first_name, last_name, email FROM users WHERE id = $1", [o.user_id]);
        const usr = userRes.rows[0];
        const customer = usr ? `${usr.first_name} ${usr.last_name}`.trim() : null;

        const order = {
            ...o,
            customer: o.customer || customer,
            created_at_local: timeRes.rows[0] ? timeRes.rows[0].created_at_local : o.created_at,
            updated_at_local: timeRes.rows[0] ? timeRes.rows[0].updated_at_local : o.updated_at,
            date: timeRes.rows[0] ? timeRes.rows[0].created_at_local : o.created_at,
            items: itemsRes.rows,
            payments: paymentsRes.rows
        };

        await client.query("COMMIT");
        res.json({ order });
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("Update order status error:", err);
        res.status(500).json({ error: "Cannot update order status" });
    } finally {
        client.release();
    }
});

// PUT /api/orders/:id/confirm-delivery - ลูกค้ายืนยันรับสินค้า
router.put("/:id/confirm-delivery", authenticateToken, async (req, res) => {
    const id = Number(req.params.id);
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // ดึงข้อมูล order และตรวจสอบเจ้าของ
        const orderRes = await client.query(
            "SELECT * FROM orders WHERE id = $1 FOR UPDATE",
            [id]
        );

        if (orderRes.rowCount === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ error: "ไม่พบคำสั่งซื้อ" });
        }

        const order = orderRes.rows[0];

        // ตรวจสอบว่าเป็นเจ้าของ order
        if (order.user_id !== req.user.id) {
            await client.query("ROLLBACK");
            return res.status(403).json({ error: "คุณไม่มีสิทธิ์ยืนยันคำสั่งซื้อนี้" });
        }

        // ตรวจสอบว่า status เป็น shipping
        if (order.status !== "shipping") {
            await client.query("ROLLBACK");
            return res.status(400).json({
                error: "ไม่สามารถยืนยันได้ สถานะคำสั่งซื้อต้องเป็น 'กำลังจัดส่ง'"
            });
        }

        // ✅ อัปเดตเป็น completed พร้อมคืนค่าเวลาแบบ Bangkok
        const updateRes = await client.query(
            `UPDATE orders 
             SET status = 'completed', 
                 delivered_at = NOW(), 
                 updated_at = NOW() 
             WHERE id = $1 
             RETURNING *,
               to_char((delivered_at AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Bangkok', 'YYYY-MM-DD HH24:MI:SS') AS delivered_at_local,
               to_char((updated_at AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Bangkok', 'YYYY-MM-DD HH24:MI:SS') AS updated_at_local`,
            [id]
        );

        const updatedOrder = updateRes.rows[0];

        // ดึงข้อมูลเพิ่มเติม
        const itemsRes = await client.query(
            "SELECT * FROM order_items WHERE order_id = $1",
            [id]
        );
        const paymentsRes = await client.query(
            "SELECT * FROM payments WHERE order_id = $1 ORDER BY created_at DESC",
            [id]
        );

        updatedOrder.items = itemsRes.rows;
        updatedOrder.payments = paymentsRes.rows;

        // ✅ เพิ่มฟิลด์สำหรับ frontend ใช้งาน
        updatedOrder.date = updatedOrder.delivered_at_local || updatedOrder.delivered_at;

        await client.query("COMMIT");

        res.json({
            message: "✅ ยืนยันรับสินค้าสำเร็จ",
            order: updatedOrder
        });

    } catch (err) {
        await client.query("ROLLBACK");
        console.error("Confirm delivery error:", err);
        res.status(500).json({ error: "ไม่สามารถยืนยันรับสินค้าได้" });
    } finally {
        client.release();
    }
});


// PUT /api/orders/:id/cancel - ลูกค้ายกเลิกคำสั่งซื้อ + คืนสต็อก
router.put("/:id/cancel", authenticateToken, async (req, res) => {
    const id = Number(req.params.id);
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // ดึงคำสั่งซื้อ
        const orderRes = await client.query("SELECT * FROM orders WHERE id = $1 FOR UPDATE", [id]);
        if (orderRes.rowCount === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ error: "ไม่พบคำสั่งซื้อ" });
        }

        const order = orderRes.rows[0];

        // ตรวจสอบสิทธิ์: ต้องเป็นเจ้าของ หรือ admin
        if (!(req.user.role === "admin" || req.user.id === order.user_id)) {
            await client.query("ROLLBACK");
            return res.status(403).json({ error: "คุณไม่มีสิทธิ์ยกเลิกคำสั่งซื้อนี้" });
        }

        // ตรวจสอบสถานะ
        if (["completed", "cancelled", "shipping", "ready_to_ship"].includes(order.status)) {
            await client.query("ROLLBACK");
            return res.status(400).json({ error: "ไม่สามารถยกเลิกคำสั่งซื้อนี้ได้" });
        }

        // ดึงสินค้าในคำสั่งซื้อ
        const itemsRes = await client.query("SELECT * FROM order_items WHERE order_id = $1", [id]);
        const items = itemsRes.rows;

        // คืน stock
        for (const it of items) {
            await client.query(
                "UPDATE products SET stock = stock + $1 WHERE id = $2",
                [it.quantity, it.product_id]
            );
        }

        // อัปเดตสถานะคำสั่งซื้อ
        const upd = await client.query(
            `UPDATE orders 
             SET status = 'cancelled', updated_at = NOW() 
             WHERE id = $1 
             RETURNING *`,
            [id]
        );

        await client.query("COMMIT");

        res.json({
            message: "ยกเลิกคำสั่งซื้อสำเร็จและคืนสต็อกแล้ว",
            order: upd.rows[0]
        });
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("Cancel order error:", err);
        res.status(500).json({ error: "ไม่สามารถยกเลิกคำสั่งซื้อได้", details: err.message });
    } finally {
        client.release();
    }
});

// ✅ เพิ่ม route นี้: เช็คว่า user เคยซื้อสินค้านี้หรือไม่
router.get("/check-purchase/:productId", authenticateToken, async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.user.id;

        // ตรวจสอบว่ามี order ที่สำเร็จและมีสินค้านี้หรือไม่
        const result = await pool.query(
            `SELECT EXISTS (
        SELECT 1 
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        WHERE o.user_id = $1 
          AND oi.product_id = $2
          AND o.status IN ('completed', 'paid')
      ) AS has_purchased`,
            [userId, productId]
        );

        res.json({ hasPurchased: result.rows[0].has_purchased });
    } catch (err) {
        console.error("❌ Error checking purchase:", err);
        res.status(500).json({ message: "ไม่สามารถตรวจสอบประวัติการซื้อได้" });
    }
});

export default router;