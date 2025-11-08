// frontend/src/sections/Products.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import "../style/Products.css";

export default function Products() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToCart } = useCart();

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

  useEffect(() => {
    const handler = (e) => setFilter(e.detail);
    window.addEventListener("filterProducts", handler);
    const input = document.getElementById("searchInput");
    const onInput = (ev) => setSearch(ev.target.value || "");
    if (input) input.addEventListener("input", onInput);
    return () => {
      window.removeEventListener("filterProducts", handler);
      if (input) input.removeEventListener("input", onInput);
    };
  }, []);

  const filtered = products.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q))
    );
  });

  const getImageUrl = (product) => {
    let imagePath = null;

    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      imagePath = product.images[0];
    } 
    else if (product.image) {
      imagePath = product.image;
    }

    if (!imagePath) {
      return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect fill='%23ddd' width='400' height='400'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='24' dy='10.5' font-weight='bold' x='50%25' y='50%25' text-anchor='middle'%3ENo Image%3C/text%3E%3C/svg%3E";
    }

    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      return imagePath;
    }

    if (imagePath.startsWith("/uploads/")) {
      return `http://localhost:3001${imagePath}`;
    }

    if (imagePath.startsWith("/")) {
      return `http://localhost:3001${imagePath}`;
    }

    return `http://localhost:3001/uploads/${imagePath}`;
  };

  if (loading) {
    return (
      <section className="products" id="products">
        <div className="container">
          <div className="products-header">
            <h2 className="section-title">สินค้าแนะนำ</h2>
          </div>
          <p className="loading-text" style={{ textAlign: "center", padding: "2rem" }}>
            กำลังโหลดสินค้า...
          </p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="products" id="products">
        <div className="container">
          <div className="products-header">
            <h2 className="section-title">สินค้าแนะนำ</h2>
          </div>
          <div className="error-message" style={{ 
            textAlign: "center", 
            padding: "2rem",
            backgroundColor: "#fee",
            borderRadius: "8px",
            margin: "1rem 0"
          }}>
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
        </div>
      </section>
    );
  }

  return (
    <section className="products" id="products">
      <div className="container">
        <div className="products-header">
          <h2 className="section-title">สินค้าแนะนำ</h2>
          <div className="filter-buttons">
            <button
              className={"filter-btn" + (filter === "all" ? " active" : "")}
              onClick={() => setFilter("all")}
            >
              ทั้งหมด
            </button>
            <button
              className={"filter-btn" + (filter === "food" ? " active" : "")}
              onClick={() => setFilter("food")}
            >
              อาหารสัตว์เลี้ยง
            </button>
            <button
              className={"filter-btn" + (filter === "toys" ? " active" : "")}
              onClick={() => setFilter("toys")}
            >
              ของเล่น
            </button>
            <button
              className={"filter-btn" + (filter === "accessories" ? " active" : "")}
              onClick={() => setFilter("accessories")}
            >
              อุปกรณ์และของใช้
            </button>
          </div>
        </div>

        <div className="products-grid" id="productsGrid">
          {filtered.length === 0 ? (
            <p style={{ color: "var(--muted-foreground)", textAlign: "center", width: "100%", padding: "2rem" }}>
              {products.length === 0 ? "ไม่มีสินค้าในระบบ" : "ไม่พบสินค้าที่ค้นหา"}
            </p>
          ) : (
            filtered.map((p) => (
              <div 
                className="product-card" 
                key={p.id}
                onClick={() => navigate(`/product/${p.id}`)}
                style={{ cursor: "pointer" }}
              >
                <div className="product-image">
                  {p.icon || (
                    <img 
                      src={getImageUrl(p)}
                      alt={p.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(e) => {
                        e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect fill='%23ddd' width='400' height='400'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='24' dy='10.5' font-weight='bold' x='50%25' y='50%25' text-anchor='middle'%3ENo Image%3C/text%3E%3C/svg%3E";
                      }}
                    />
                  )}
                </div>
                <div className="product-info">
                  <h3 className="product-title">{p.name}</h3>
                  <p className="product-description-1">{p.description}</p>
                  
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
            ))
          )}
        </div>
      </div>
    </section>
  );
}