import express from "express";
import multer from "multer";
import path from "path";
import { Pool } from "pg";
import fs from "fs";

const router = express.Router();

// ✅ เชื่อมต่อ Neon Database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// ✅ ตั้งค่า multer สำหรับอัปโหลดหลายรูป
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = file.originalname.replace(ext, "").replace(/\s/g, "_");
    cb(null, `${name}-${Date.now()}${ext}`);
  },
});

const upload = multer({ storage });

// ✅ POST /api/admin/products — เพิ่มสินค้าใหม่
router.post("/", upload.array("images", 10), async (req, res) => {
  try {
    const { name, description, category, price, stock } = req.body;

    if (!name || !description || !category || !price || !stock) {
      return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบ" });
    }

    const images = req.files.map((file) => `/uploads/${file.filename}`);

    // ✅ เพิ่มข้อมูลลงใน Neon
    const result = await pool.query(
      `INSERT INTO products 
       (name, description, category, price, stock, images, rating, reviews, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, 0, 0, NOW())
       RETURNING *`,
      [name, description, category, price, stock, images]
    );

    res.status(201).json({
      message: "เพิ่มสินค้าสำเร็จ",
      product: result.rows[0],
    });
  } catch (err) {
    console.error("❌ Error adding product:", err);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการบันทึกสินค้า" });
  }
});

// ✅ GET /api/admin/products — ดูสินค้าทั้งหมด
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM products ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching products:", err);
    res.status(500).json({ message: "ไม่สามารถดึงข้อมูลสินค้าได้" });
  }
});

// ✅ PUT /api/admin/products/:id — แก้ไขสินค้า
router.put("/:id", upload.array("images", 10), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category, price, stock } = req.body;

    if (!name || !description || !category || !price || !stock) {
      return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบ" });
    }

    // ถ้ามีรูปใหม่ ให้ใช้รูปใหม่ ถ้าไม่มีให้ใช้รูปเดิม
    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map((file) => `/uploads/${file.filename}`);
    } else {
      // ดึงรูปเดิมจาก database
      const oldProduct = await pool.query("SELECT images FROM products WHERE id = $1", [id]);
      images = oldProduct.rows[0]?.images || [];
    }

    const result = await pool.query(
      `UPDATE products 
       SET name = $1, description = $2, category = $3, price = $4, stock = $5, images = $6
       WHERE id = $7
       RETURNING *`,
      [name, description, category, price, stock, images, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "ไม่พบสินค้าที่ต้องการแก้ไข" });
    }

    res.json({
      message: "แก้ไขสินค้าสำเร็จ",
      product: result.rows[0],
    });
  } catch (err) {
    console.error("❌ Error updating product:", err);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการแก้ไขสินค้า" });
  }
});

// ✅ DELETE /api/admin/products/:id — ลบสินค้า
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    console.log("🗑️ กำลังลบสินค้า ID:", id);

    // ดึงข้อมูลสินค้าก่อนลบ เพื่อลบรูปภาพด้วย
    const product = await pool.query("SELECT images FROM products WHERE id = $1", [id]);

    if (product.rows.length === 0) {
      console.log("❌ ไม่พบสินค้า ID:", id);
      return res.status(404).json({ message: "ไม่พบสินค้าที่ต้องการลบ" });
    }

    console.log("✅ พบสินค้า:", product.rows[0]);

    // ลบรูปภาพออกจากโฟลเดอร์ (ถ้ามี)
    const images = product.rows[0].images || [];
    images.forEach((imagePath) => {
      try {
        const filePath = path.join(process.cwd(), imagePath.replace(/^\//, ""));
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log("✅ ลบรูปภาพ:", filePath);
        }
      } catch (err) {
        console.log("⚠️ ไม่สามารถลบรูปภาพ:", err.message);
      }
    });

    // ลบข้อมูลจาก database
    const result = await pool.query("DELETE FROM products WHERE id = $1 RETURNING *", [id]);
    console.log("✅ ลบสินค้าสำเร็จ:", result.rows[0]);

    res.json({
      message: "ลบสินค้าสำเร็จ",
      id: parseInt(id),
    });
  } catch (err) {
    console.error("❌ Error deleting product:", err);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการลบสินค้า", error: err.message });
  }
});

export default router;