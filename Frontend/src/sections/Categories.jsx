// frontend/src/sections/Categories.jsx
"use client"
import "../style/Categories.css"
import { useNavigate } from "react-router-dom";

export default function Categories() {
  const navigate = useNavigate();

  function filterProducts(cat) {
    // ส่ง event (ถ้าจำเป็น)
    window.dispatchEvent(new CustomEvent("filterProducts", { detail: cat }));
    // เปลี่ยนหน้าไป /productslist พร้อมพารามิเตอร์ category
    navigate(`/productslist?category=${cat}`);
  }

  return (
    <section className="categories" id="categories">
      <div className="container">
        <h2 className="section-title">หมวดหมู่สินค้า</h2>
        <div className="categories-grid">
          <div className="category-card" onClick={() => filterProducts("food")}>
            <span className="category-icon">🍖</span>
            <h3>อาหารสัตว์เลี้ยง</h3>
            <p>อาหารสุนัข อาหารแมว สูตรพิเศษสำหรับทุกวัย</p>
          </div>
          <div className="category-card" onClick={() => filterProducts("toys")}>
            <span className="category-icon">🎾</span>
            <h3>ของเล่น</h3>
            <p>ของเล่นสุนัข ของเล่นแมว กระตุ้นสัญชาตญาณ</p>
          </div>
          <div className="category-card" onClick={() => filterProducts("accessories")}>
            <span className="category-icon">🦴</span>
            <h3>อุปกรณ์และของใช้</h3>
            <p>ปลอกคอ ที่นอน ชามอาหาร และอุปกรณ์ต่างๆ</p>
          </div>
          <div className="category-card" onClick={() => filterProducts("all")}>
            <span className="category-icon">🐾</span>
            <h3>ทั้งหมด</h3>
            <p>ดูสินค้าทั้งหมดในร้าน</p>
          </div>
        </div>
      </div>
    </section>
  )
}