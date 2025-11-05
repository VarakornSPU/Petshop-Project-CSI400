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

  // อ่านค่าหมวดหมู่จาก query string (เช่น ?category=food)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const category = params.get("category") || "all";
    setFilter(category);
  }, [location.search]);

  // ดึงข้อมูลสินค้าจาก backend
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

        // ✅ รองรับทั้ง array และ object response
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
  
  const images = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : product.image 
    ? [product.image]
    : ["/placeholder.png"];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const currentImage = images[currentImageIndex];
  const imageUrl = currentImage.startsWith("http") || currentImage.startsWith("/placeholder")
    ? currentImage
    : `http://localhost:3001${currentImage}`;

  return (
    <div className="product-card">
      <div className="image-wrapper">
        <img
          src={imageUrl}
          alt={product.name}
          className="product-image"
          onError={(e) => {
            e.target.src = "/placeholder.png";
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

        {/* เช็คว่า stock มีค่า */}
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

        {/* เช็คว่า rating เป็น number */}
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