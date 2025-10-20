import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { products as productsData } from "../data/products";
import "../style/ProductsList.css";

export default function ProductsList() {
  const location = useLocation();
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const category = params.get("category") || "all";
    setFilter(category);
  }, [location.search]);

  const filteredProducts = productsData.filter((p) =>
    filter === "all" ? true : p.category === filter
  );

  return (
    <div className="products-list">
      <h1 className="title">สินค้าในหมวด: {getCategoryLabel(filter)}</h1>

      {filteredProducts.length === 0 ? (
        <p className="no-products">ไม่พบสินค้าในหมวดหมู่นี้</p>
      ) : (
        <div className="products-grid">
          {filteredProducts.map((p) => (
            <div className="product-card" key={p.id}>
              <img src={p.image} alt={p.name} className="product-image" />
              <div className="product-details">
                <h3>{p.name}</h3>
                <p className="description">{p.description}</p>
                <div className="price">฿{p.price.toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// สำหรับแสดง label ภาษาไทย
function getCategoryLabel(category) {
  switch (category) {
    case "food":
      return "อาหารสัตว์เลี้ยง";
    case "toys":
      return "ของเล่น";
    case "accessories":
      return "อุปกรณ์และของใช้";
    default:
      return "ทั้งหมด";
  }
}
