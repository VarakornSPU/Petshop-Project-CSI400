const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// ใช้ Multer สำหรับจัดการอัปโหลดไฟล์
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = file.originalname.replace(ext, '').replace(/\s/g, '_');
    cb(null, `${name}-${Date.now()}${ext}`);
  },
});

const upload = multer({ storage });

// mock DB
let products = [];

// ✅ POST /api/admin/products — เพิ่มสินค้าใหม่
router.post('/', upload.array('images'), (req, res) => {
  const { name, description, category, price, stock } = req.body;

  if (!name || !description || !category || !price || !stock) {
    return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบ' });
  }

  const images = req.files.map(file => `/uploads/${file.filename}`);

  const newProduct = {
    id: Date.now().toString(),
    name,
    description,
    category,
    price: Number(price),
    stock: Number(stock),
    images,
    rating: 0,
    reviews: 0,
  };

  products.push(newProduct);

  res.status(201).json({ message: 'เพิ่มสินค้าสำเร็จ', product: newProduct });
});

// ✅ GET /api/admin/products — ดูสินค้าทั้งหมด
router.get('/', (req, res) => {
  res.json(products);
});

module.exports = router;
