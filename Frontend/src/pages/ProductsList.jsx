// frontend/src/pages/ProductsList.jsx
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import "../style/ProductsList.css";

export default function ProductsList() {
  const location = useLocation();
  const [filter, setFilter] = useState("all");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const category = params.get("category") || "all";
    setFilter(category);
  }, [location.search]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        const url = filter === "all"
          ? "http://localhost:3001/api/products"
          : `http://localhost:3001/api/products?category=${filter}`;

        console.log("🔍 Fetching from:", url);

        const res = await fetch(url);

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        console.log("✅ Data received:", data);

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

  return (
    <div className="products-list">
      <h1 className="title">สินค้าในหมวด: {getCategoryLabel(filter)}</h1>

      {loading ? (
        <p className="loading-text">กำลังโหลดสินค้า...</p>
      ) : error ? (
        <div className="error-message">
          <p>❌ เกิดข้อผิดพลาด: {error}</p>
          <button onClick={() => window.location.reload()}>ลองอีกครั้ง</button>
        </div>
      ) : products.length === 0 ? (
        <p className="no-products">ไม่พบสินค้าในหมวดหมู่นี้</p>
      ) : (
        <div className="products-grid">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProductCard({ product }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // ✅ แปลงค่า images ให้เป็น array เสมอ
  let images = [];
  const rawImages = product.images;

  console.log("🔍 Product:", product.name);
  console.log("📦 Raw images:", rawImages);
  console.log("📦 Type of rawImages:", typeof rawImages);

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
      if (rawImages.startsWith("{") && rawImages.endsWith("}")) {
        images = rawImages
          .slice(1, -1)
          .split(",")
          .map((s) => s.trim().replace(/^"|"$/g, ""));
      } else if (rawImages.trim() !== "") {
        images = [rawImages.trim()];
      }
    }
  }

  // ถ้าไม่มีรูป ใช้ placeholder SVG
  if (!images || images.length === 0) {
    images = ["data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect fill='%23ddd' width='400' height='400'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='24' dy='10.5' font-weight='bold' x='50%25' y='50%25' text-anchor='middle'%3ENo Image%3C/text%3E%3C/svg%3E"];
  }

  console.log("✅ Parsed images array:", images);

  const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % images.length);
  const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);

  // ✅ ดึงรูปปัจจุบัน
  const currentImage = images[currentImageIndex] || images[0] || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect fill='%23ddd' width='400' height='400'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='24' dy='10.5' font-weight='bold' x='50%25' y='50%25' text-anchor='middle'%3ENo Image%3C/text%3E%3C/svg%3E";
  
  console.log("🖼️ Current image raw:", currentImage);

  // ✅ สร้าง URL ที่ถูกต้อง
  let imageUrl;
  if (currentImage.startsWith("http://") || currentImage.startsWith("https://")) {
    // เป็น URL เต็มอยู่แล้ว
    imageUrl = currentImage;
  } else if (currentImage.startsWith("/uploads/")) {
    // มี /uploads/ อยู่แล้ว
    imageUrl = `http://localhost:3001${currentImage}`;
  } else if (currentImage.startsWith("/")) {
    // ขึ้นต้นด้วย / แต่ไม่ใช่ /uploads/
    imageUrl = `http://localhost:3001${currentImage}`;
  } else {
    // ชื่อไฟล์เฉยๆ
    imageUrl = `http://localhost:3001/uploads/${currentImage}`;
  }

  console.log("🎯 Final image URL:", imageUrl);

  return (
    <div className="product-card">
      <div className="image-wrapper">
        <img
          src={imageUrl}
          alt={product.name}
          className="product-image"
          onError={(e) => {
            console.error("❌ Image failed to load:", imageUrl);
            e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect fill='%23ddd' width='400' height='400'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='24' dy='10.5' font-weight='bold' x='50%25' y='50%25' text-anchor='middle'%3ENo Image%3C/text%3E%3C/svg%3E";
          }}
          onLoad={() => {
            console.log("✅ Image loaded successfully:", imageUrl);
          }}
        />

        {images.length > 1 && (
          <>
            <button className="image-nav prev" onClick={prevImage}>
              ‹
            </button>
            <button className="image-nav next" onClick={nextImage}>
              ›
            </button>
            <div className="image-dots">
              {images.map((_, index) => (
                <span
                  key={index}
                  className={`dot ${index === currentImageIndex ? "active" : ""}`}
                  onClick={() => setCurrentImageIndex(index)}
                />
              ))}
            </div>
          </>
        )}

        {product.stock !== undefined && product.stock !== null && product.stock <= 5 && product.stock > 0 && (
          <span className="badge badge-warning">เหลือน้อย</span>
        )}
        {product.stock === 0 && (
          <span className="badge badge-danger">สินค้าหมด</span>
        )}
      </div>

      <div className="product-details">
        <h3 className="product-name">{product.name}</h3>

        {product.description && (
          <p className="description">{product.description}</p>
        )}

        {product.rating && typeof product.rating === 'number' && product.rating > 0 && (
          <div className="rating">
            <span className="stars">{"⭐".repeat(Math.round(product.rating))}</span>
            <span className="rating-text">
              {product.rating.toFixed(1)} ({product.reviews || 0} รีวิว)
            </span>
          </div>
        )}

        <div className="price-section">
          <div className="price">
            ฿{product.price ? Number(product.price).toLocaleString() : '0'}
          </div>
          {product.stock !== undefined && product.stock !== null && (
            <div className="stock">คงเหลือ: {product.stock} ชิ้น</div>
          )}
        </div>

        <button
          className="btn-add-cart"
          disabled={product.stock === 0}
        >
          {product.stock === 0 ? "สินค้าหมด" : "เพิ่มลงตะกร้า"}
        </button>
      </div>
    </div>
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