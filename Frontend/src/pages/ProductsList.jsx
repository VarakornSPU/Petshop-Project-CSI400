// frontend/src/pages/ProductsList.jsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";

import "../style/Products.css"; // ✅ นำเข้า CSS ของ Products.jsx เพื่อให้ Style เหมือนกัน

// ฟังก์ชันสำหรับดึง URL รูปภาพ
const getImageUrl = (rawImages) => {
  let images = [];

  // Logic การแปลง String/JSON/Array ให้เป็น Array
  if (Array.isArray(rawImages)) {
    images = rawImages;
  } else if (typeof rawImages === "string") {
    try {
      const parsed = JSON.parse(rawImages);
      if (Array.isArray(parsed)) {
        images = parsed;
      } else if (typeof parsed === "string") {
        images = [parsed];
      }
    } catch {
      if (rawImages && rawImages.startsWith("{") && rawImages.endsWith("}")) {
        images = rawImages.slice(1, -1).split(',').map(s => s.trim().replace(/^"|"$/g, ''));
      } else if (rawImages && rawImages.trim() !== "") {
        images = [rawImages.trim()];
      }
    }
  }

  // ถ้าไม่มีรูป ใช้ placeholder SVG
  if (!images || images.length === 0) {
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect fill='%23ddd' width='400' height='400'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='24' dy='10.5' font-weight='bold' x='50%25' y='50%25' text-anchor='middle'%3ENo Image%3C/text%3E%3C/svg%3E`;
  }

  // ดึงรูปแรก
  const firstImage = images[0];
  let imageUrl;

  if (firstImage.startsWith("http://") || firstImage.startsWith("https://")) {
    imageUrl = firstImage;
  } else if (firstImage.startsWith("/uploads/")) {
    imageUrl = `http://localhost:3001${firstImage}`;
  } else if (firstImage.startsWith("/")) {
    imageUrl = `http://localhost:3001${firstImage}`;
  } else {
    imageUrl = `http://localhost:3001/uploads/${firstImage}`;
  }

  return imageUrl;
};

export default function ProductsList() {
  const location = useLocation();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  // state filter ถูกควบคุมผ่าน URL ใน useEffect แรก
  const [filter, setFilter] = useState("all");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. ดึงค่า category จาก URL เมื่อโหลดหน้า
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const category = params.get("category") || "all";
    setFilter(category);
  }, [location.search]);

  // 2. Fetch ข้อมูลเมื่อ filter เปลี่ยน
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        const url = filter === "all"
          ? "http://localhost:3001/api/products"
          : `http://localhost:3001/api/products?category=${filter}`;

        const res = await fetch(url);

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();

        if (Array.isArray(data)) {
          setProducts(data);
        } else if (data.products && Array.isArray(data.products)) {
          setProducts(data.products);
        } else {
          setProducts([]);
        }

      } catch (err) {
        console.error("❌ Error fetching products:", err);
        setError(err.message);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [filter]);

  // ฟังก์ชันสำหรับเปลี่ยน Filter
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    // ✅ อัพเดท URL เพื่อให้ลิงก์นี้สามารถแชร์ได้และรีเฟรชได้
    navigate(`/productslist?category=${newFilter}`, { replace: true });
  };


  return (
    <section className="products"> {/* ใช้ class products จาก Products.css */}
      <div className="container">

        {/* ======================================= */}
        {/* ✅ เพิ่มส่วน Products Header และ Filter Buttons */}
        {/* ======================================= */}
        <div className="products-header">
          <h2 className="section-title">สินค้าในหมวด: {getCategoryLabel(filter)}</h2>
          <div className="filter-buttons">
            <button
              className={"filter-btn" + (filter === "all" ? " active" : "")}
              onClick={() => handleFilterChange("all")}
            >
              ทั้งหมด
            </button>
            <button
              className={"filter-btn" + (filter === "food" ? " active" : "")}
              onClick={() => handleFilterChange("food")}
            >
              อาหารสัตว์เลี้ยง
            </button>
            <button
              className={"filter-btn" + (filter === "toys" ? " active" : "")}
              onClick={() => handleFilterChange("toys")}
            >
              ของเล่น
            </button>
            <button
              className={"filter-btn" + (filter === "accessories" ? " active" : "")}
              onClick={() => handleFilterChange("accessories")}
            >
              อุปกรณ์และของใช้
            </button>
          </div>
        </div>
        {/* ======================================= */}

        {loading ? (
          <p className="loading-text" style={{ textAlign: "center", padding: "2rem" }}>
            กำลังโหลดสินค้า...
          </p>
        ) : error ? (
          <div className="error-message" style={{ textAlign: "center", padding: "2rem", backgroundColor: "#fee", borderRadius: "8px", margin: "1rem 0" }}>
            <p style={{ color: "#c00" }}>❌ เกิดข้อผิดพลาด: {error}</p>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: "1rem",
                padding: "0.5rem 1rem",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              ลองอีกครั้ง
            </button>
          </div>
        ) : products.length === 0 ? (
          <p className="no-products" style={{ color: "var(--muted-foreground)", textAlign: "center", width: "100%", padding: "2rem" }}>
            ไม่พบสินค้าในหมวดหมู่นี้
          </p>
        ) : (
          <div className="products-grid" id="productsGrid">
            {products.map((p) => (
              // Product Card Structure เหมือน Products.jsx
              <div
                className="product-card"
                key={p.id}
                onClick={() => navigate(`/product/${p.id}`)}
                style={{ cursor: "pointer" }}
              >
                <div className="product-image">
                  <img
                    src={getImageUrl(p.images)}
                    alt={p.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e) => {
                      e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect fill='%23ddd' width='400' height='400'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='24' dy='10.5' font-weight='bold' x='50%25' y='50%25' text-anchor='middle'%3ENo Image%3C/text%3E%3C/svg%3E";
                    }}
                  />
                </div>
                <div className="product-info">
                  <h3 className="product-title">{p.name}</h3>

                  {p.description && (
                    <p className="product-description-1">
                      {p.description}
                    </p>
                  )}

                  {p.rating && typeof p.rating === 'number' && p.rating > 0 && (
                    <div className="product-rating">
                      <span className="stars">
                        {"★".repeat(Math.floor(p.rating))}
                        {"☆".repeat(5 - Math.floor(p.rating))}
                      </span>
                      <span className="rating-text">
                        {p.rating.toFixed(1)} ({(p.reviews || 0).toLocaleString()} รีวิว)
                      </span>
                    </div>
                  )}

                  <div className="product-price">
                    ฿{(p.price ? Number(p.price) : 0).toLocaleString()}
                  </div>

                  {p.stock !== undefined && p.stock !== null && p.stock <= 5 && p.stock > 0 && (
                    <span style={{ color: "orange", fontSize: "0.9rem" }}>
                      เหลือเพียง {p.stock} ชิ้น
                    </span>
                  )}

                  <button
                    className="add-to-cart"
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(p);
                    }}
                    disabled={p.stock === 0}
                  >
                    {p.stock === 0 ? "สินค้าหมด" : "เพิ่มลงตะกร้า"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function getCategoryLabel(category) {
  const categories = {
    all: "ทั้งหมด",
    food: "อาหารสัตว์เลี้ยง",
    toys: "ของเล่น",
    accessories: "อุปกรณ์และของใช้",
  };
  return categories[category] || "ทั้งหมด";
}