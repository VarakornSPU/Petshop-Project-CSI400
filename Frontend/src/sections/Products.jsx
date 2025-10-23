// frontend/src/sections/Products.jsx
import React, { useEffect, useState } from "react";
import { products as productsData } from "../data/products";
import { useCart } from "../context/CartContext";
import "../style/Products.css";

export default function Products() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const { addToCart } = useCart();

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

  const filtered = productsData
    .filter((p) => {
      if (filter === "all") return true;
      return p.category === filter;
    })
    .filter((p) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    });

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
              className={
                "filter-btn" + (filter === "food" ? " active" : "")
              }
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
            <p style={{ color: "var(--muted-foreground)" }}>ไม่มีสินค้า</p>
          ) : (
            filtered.map((p) => (
              <div className="product-card" key={p.id}>
                <div className="product-image">{p.icon}</div>
                <div className="product-info">
                  <h3 className="product-title">{p.name}</h3>
                  <p className="product-description">{p.description}</p>
                  <div className="product-rating">
                    <span className="stars">
                      {"★".repeat(Math.floor(p.rating))}
                      {"☆".repeat(5 - Math.floor(p.rating))}
                    </span>
                    <span className="rating-text">
                      {p.rating} ({p.reviews.toLocaleString()} รีวิว)
                    </span>
                  </div>
                  <div className="product-price">
                    ฿{p.price.toLocaleString()}
                  </div>
                  <button className="add-to-cart" onClick={() => addToCart(p)}>
                    เพิ่มลงตะกร้า
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
