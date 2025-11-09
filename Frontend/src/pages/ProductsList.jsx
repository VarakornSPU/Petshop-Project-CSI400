// frontend/src/pages/ProductsList.jsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import WishlistButton from "../components/WishlistButton"; // ✅ เพิ่ม import
import SearchBar from '../components/SearchBar';
import "../style/Products.css";

// ฟังก์ชันสำหรับดึง URL รูปภาพ
const getImageUrl = (rawImages) => {
  let images = [];

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

  if (!images || images.length === 0) {
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect fill='%23ddd' width='400' height='400'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='24' dy='10.5' font-weight='bold' x='50%25' y='50%25' text-anchor='middle'%3ENo Image%3C/text%3E%3C/svg%3E`;
  }

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

// ✅ ฟังก์ชันช่วยจัดการค่า rating และ reviews
const getRating = (rating) => {
  if (rating === null || rating === undefined) return 0;
  const numRating = Number(rating);
  return isNaN(numRating) ? 0 : numRating;
};

const getReviewsCount = (reviews) => {
  if (reviews === null || reviews === undefined) return 0;
  const numReviews = Number(reviews);
  return isNaN(numReviews) ? 0 : numReviews;
};

export default function ProductsList() {
  const location = useLocation();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [filter, setFilter] = useState("all");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ดึงค่า category จาก URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const category = params.get("category") || "all";
    setFilter(category);
  }, [location.search]);

  // Fetch สินค้า
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        const url = filter === "all"
          ? "http://localhost:3001/api/products"
          : `http://localhost:3001/api/products?category=${filter}`;

        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

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

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    navigate(`/productslist?category=${newFilter}`, { replace: true });
  };

  return (
    <section className="products">
      <div className="container">
        <div className="products-header">
          <h2 className="section-title">สินค้าในหมวด: {getCategoryLabel(filter)}</h2>
          <div className="filter-buttons">
            <button className={"filter-btn" + (filter === "all" ? " active" : "")} onClick={() => handleFilterChange("all")}>ทั้งหมด</button>
            <button className={"filter-btn" + (filter === "food" ? " active" : "")} onClick={() => handleFilterChange("food")}>อาหารสัตว์เลี้ยง</button>
            <button className={"filter-btn" + (filter === "toys" ? " active" : "")} onClick={() => handleFilterChange("toys")}>ของเล่น</button>
            <button className={"filter-btn" + (filter === "accessories" ? " active" : "")} onClick={() => handleFilterChange("accessories")}>อุปกรณ์และของใช้</button>
          </div>
        </div>
        <div className="Search-Bar">
          <p>ค้นหาสินค้า :</p>
          <SearchBar />
        </div>
        {loading ? (
          <p className="loading-text" style={{ textAlign: "center", padding: "2rem" }}>กำลังโหลดสินค้า...</p>
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
            {products.map((p) => {
              const rating = getRating(p.rating);
              const reviewsCount = getReviewsCount(p.reviews);

              return (
                <div
                  className="product-card"
                  key={p.id}
                  onClick={() => navigate(`/product/${p.id}`)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="product-image" style={{ position: "relative" }}>
                    <img
                      src={getImageUrl(p.images)}
                      alt={p.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(e) => {
                        e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect fill='%23ddd' width='400' height='400'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='24' dy='10.5' font-weight='bold' x='50%25' y='50%25' text-anchor='middle'%3ENo Image%3C/text%3E%3C/svg%3E";
                      }}
                    />
                    {/* ✅ เพิ่มปุ่ม Wishlist เหมือนหน้า Products.jsx */}
                    <div className="wishlist-btn-wrapper-1">
                      <WishlistButton productId={p.id} size="medium" />
                    </div>
                  </div>

                  <div className="product-info">
                    <h3 className="product-title">{p.name}</h3>
                    {p.description && <p className="product-description-1">{p.description}</p>}

                    {/* ✅ แสดง Rating แบบเดียวกับหน้า Products.jsx */}
                    <div className="product-rating">
                      <span className="stars" style={{ color: rating > 0 ? '#FFD700' : '#ddd' }}>
                        {"★".repeat(Math.floor(rating))}
                        {"☆".repeat(5 - Math.floor(rating))}
                      </span>
                      <span className="rating-text">
                        {rating.toFixed(1)} ({reviewsCount.toLocaleString()} รีวิว)
                      </span>
                    </div>

                    <div className="product-price">฿{(p.price ? Number(p.price) : 0).toLocaleString()}</div>

                    {p.stock !== undefined && p.stock !== null && p.stock <= 5 && p.stock > 0 ? (
                      <span className="stock-warning">เหลือเพียง {p.stock} ชิ้น</span>
                    ) : (
                      <span className="stock-warning">&nbsp;</span> // เว้นว่างแต่ยังครองพื้นที่
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
              );
            })}
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
