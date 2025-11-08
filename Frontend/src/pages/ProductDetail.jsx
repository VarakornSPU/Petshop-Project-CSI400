// src/pages/ProductDetail.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "../style/ProductDetail.css"; // จะสร้างไฟล์นี้เพิ่มทีหลังได้

const API = "http://localhost:3001";

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [form, setForm] = useState({ user_name: "", rating: 5, comment: "" });

  useEffect(() => {
    async function fetchData() {
      const productRes = await axios.get(`${API}/api/products/${id}`);
      setProduct(productRes.data);
      const reviewsRes = await axios.get(`${API}/api/products/${id}/reviews`);
      setReviews(reviewsRes.data);
    }
    fetchData();
  }, [id]);

  const submitReview = async (e) => {
    e.preventDefault();
    await axios.post(`${API}/api/products/${id}/reviews`, form);
    setForm({ user_name: "", rating: 5, comment: "" });
    const res = await axios.get(`${API}/api/products/${id}/reviews`);
    setReviews(res.data);
  };

  if (!product) return <p>Loading...</p>;

  return (
    <div className="product-detail-container">
      <div className="product-detail">
        <div className="product-images">
          {product.images?.map((img, i) => (
            <img
              key={i}
              src={`${API}${img}`}
              alt={product.name}
              className="product-detail-img"
            />
          ))}
        </div>

        <div className="product-info">
          <h2>{product.name}</h2>
          <p>{product.description}</p>
          <p><b>ราคา:</b> ฿{product.price}</p>
          <p><b>คงเหลือ:</b> {product.stock} ชิ้น</p>
          {product.rating > 0 && (
            <p><b>เรตติ้งเฉลี่ย:</b> ⭐ {product.rating.toFixed(1)} ({product.reviews} รีวิว)</p>
          )}
        </div>
      </div>

      <hr />

      <div className="reviews-section">
        <h3>รีวิวสินค้า ({reviews.length})</h3>
        {reviews.length === 0 && <p>ยังไม่มีรีวิว</p>}

        {reviews.map((r) => (
          <div key={r.id} className="review-card">
            <strong>{r.user_name}</strong> ({r.rating}/5)
            <p>{r.comment}</p>
            <small>{new Date(r.created_at).toLocaleString()}</small>
          </div>
        ))}

        <form onSubmit={submitReview} className="review-form">
          <h4>เพิ่มรีวิวใหม่</h4>
          <input
            type="text"
            placeholder="ชื่อของคุณ"
            value={form.user_name}
            onChange={(e) => setForm({ ...form, user_name: e.target.value })}
            required
          />
          <select
            value={form.rating}
            onChange={(e) => setForm({ ...form, rating: e.target.value })}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
          <textarea
            placeholder="เขียนความคิดเห็น..."
            value={form.comment}
            onChange={(e) => setForm({ ...form, comment: e.target.value })}
          />
          <button type="submit">ส่งรีวิว</button>
        </form>
      </div>
    </div>
  );
}
