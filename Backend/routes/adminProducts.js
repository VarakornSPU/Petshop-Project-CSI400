import express from "express";
import multer from "multer";
import path from "path";
import { Pool } from "pg";

const router = express.Router();

// ✅ เชื่อมต่อ Neon Database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// ✅ ตั้งค่า multer สำหรับอัปโหลดหลายรูป
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
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

export default router;