// src/pages/ProductDetail.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import "../style/ProductDetail.css";

const API = "http://localhost:3001";

export default function ProductDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [product, setProduct] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [form, setForm] = useState({ rating: 0, comment: "" });
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [hasPurchased, setHasPurchased] = useState(false);
    const [checkingPurchase, setCheckingPurchase] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                const productRes = await axios.get(`${API}/api/products/${id}`);
                setProduct(productRes.data);
                const reviewsRes = await axios.get(`${API}/api/products/${id}/reviews`);
                setReviews(reviewsRes.data);

                // เช็กว่าผู้ใช้เคยซื้อสินค้านี้หรือไม่
                if (user) {
                    try {
                        const token = localStorage.getItem('authToken');
                        const purchaseRes = await axios.get(
                            `${API}/api/orders/check-purchase/${id}`,
                            { headers: { Authorization: `Bearer ${token}` } }
                        );
                        setHasPurchased(purchaseRes.data.hasPurchased);
                    } catch (err) {
                        console.error("Error checking purchase:", err);
                        setHasPurchased(false);
                    }
                }
                setCheckingPurchase(false);
            } catch (err) {
                console.error("Error fetching data:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [id, user]);

    const submitReview = async (e) => {
        e.preventDefault();

        if (!user) {
            alert("กรุณาเข้าสู่ระบบก่อนรีวิว");
            navigate("/login");
            return;
        }

        if (!hasPurchased) {
            alert("คุณต้องซื้อสินค้านี้ก่อนถึงจะรีวิวได้");
            return;
        }

        // เช็กว่าเคยรีวิวแล้วหรือยัง (ตรวจสอบจาก state ปัจจุบัน)
        const alreadyReviewed = reviews.some(r => r.user_id === user.id);
        if (alreadyReviewed) {
            alert("คุณรีวิวสินค้านี้ไปแล้ว");
            return;
        }

        try {
            const token = localStorage.getItem('authToken');

            // ใช้ชื่อจาก user object
            const userName = user.name ||
                user.username ||
                `${user.first_name || ''} ${user.last_name || ''}`.trim() ||
                user.email?.split('@')[0] ||
                'ผู้ใช้';

            // ส่งรีวิว
            await axios.post(
                `${API}/api/products/${id}/reviews`,
                {
                    rating: form.rating,
                    comment: form.comment,
                    user_name: userName,
                    user_id: user.id
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setForm({ rating: 5, comment: "" });

            // รีเฟรชข้อมูล
            const reviewsRes = await axios.get(`${API}/api/products/${id}/reviews`);
            setReviews(reviewsRes.data);

            const productRes = await axios.get(`${API}/api/products/${id}`);
            setProduct(productRes.data);

            alert("เพิ่มรีวิวสำเร็จ!");
        } catch (err) {
            console.error("Error submitting review:", err);
            // ถ้า error มาจากการรีวิวซ้ำ
            if (err.response?.status === 400 && err.response?.data?.message?.includes("เคยรีวิว")) {
                alert("คุณรีวิวสินค้านี้ไปแล้ว");
                // รีเฟรชข้อมูล reviews
                const reviewsRes = await axios.get(`${API}/api/products/${id}/reviews`);
                setReviews(reviewsRes.data);
            } else {
                alert(err.response?.data?.message || "เกิดข้อผิดพลาดในการส่งรีวิว");
            }
        }
    };

    const deleteReview = async (reviewId) => {
        if (!window.confirm("คุณต้องการลบรีวิวนี้ใช่หรือไม่?")) {
            return;
        }

        try {
            const token = localStorage.getItem('authToken'); // แก้ไขเป็น authToken
            await axios.delete(
                `${API}/api/products/${id}/reviews/${reviewId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // รีเฟรชข้อมูล
            const reviewsRes = await axios.get(`${API}/api/products/${id}/reviews`);
            setReviews(reviewsRes.data);

            const productRes = await axios.get(`${API}/api/products/${id}`);
            setProduct(productRes.data);

            alert("ลบรีวิวสำเร็จ!");
        } catch (err) {
            console.error("Error deleting review:", err);
            alert("เกิดข้อผิดพลาดในการลบรีวิว");
        }
    };

    const calculateAverageRating = () => {
        if (reviews.length === 0) return 0;
        const sum = reviews.reduce((acc, r) => acc + Number(r.rating), 0);
        return (sum / reviews.length).toFixed(1);
    };

    const renderStars = (rating) => {
        const fullStars = Math.floor(rating);
        const emptyStars = 5 - fullStars;
        return (
            <>
                <span style={{ color: "#FFD700" }}>{"★".repeat(fullStars)}</span>
                <span style={{ color: "#ddd" }}>{"☆".repeat(emptyStars)}</span>
            </>
        );
    };

    const getImageUrl = (imagePath) => {
        if (!imagePath) return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect fill='%23ddd' width='400' height='400'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='24' dy='10.5' font-weight='bold' x='50%25' y='50%25' text-anchor='middle'%3ENo Image%3C/text%3E%3C/svg%3E";
        if (imagePath.startsWith("http")) return imagePath;
        if (imagePath.startsWith("/uploads/")) return `${API}${imagePath}`;
        if (imagePath.startsWith("/")) return `${API}${imagePath}`;
        return `${API}/uploads/${imagePath}`;
    };

    if (loading) return <div className="loading-container"><p>กำลังโหลดข้อมูล...</p></div>;
    if (!product) return <div className="error-container"><p>ไม่พบสินค้า</p></div>;

    let images = [];
    if (Array.isArray(product.images)) {
        images = product.images;
    } else if (typeof product.images === "string") {
        try {
            const parsed = JSON.parse(product.images);
            images = Array.isArray(parsed) ? parsed : [parsed];
        } catch {
            images = product.images ? [product.images] : [];
        }
    }

    if (images.length === 0) {
        images = ["data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect fill='%23ddd' width='400' height='400'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='24' dy='10.5' font-weight='bold' x='50%25' y='50%25' text-anchor='middle'%3ENo Image%3C/text%3E%3C/svg%3E"];
    }

    const avgRating = calculateAverageRating();
    const userHasReviewed = user ? reviews.some(r => r.user_id === user.id) : false;

    return (
        <div className="product-detail-container">
            <button className="back-button" onClick={() => navigate(-1)}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>กลับ</span>
            </button>

            <div className="product-detail">
                <div className="product-images-section">
                    <div className="main-image-wrapper">
                        <img
                            src={getImageUrl(images[currentImageIndex])}
                            alt={product.name}
                            className="main-image"
                            onError={(e) => {
                                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect fill='%23ddd' width='400' height='400'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='24' dy='10.5' font-weight='bold' x='50%25' y='50%25' text-anchor='middle'%3ENo Image%3C/text%3E%3C/svg%3E";
                            }}
                        />

                        {images.length > 1 && (
                            <>
                                <button
                                    className="nav-btn prev-btn"
                                    onClick={() => setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)}
                                >
                                    ‹
                                </button>
                                <button
                                    className="nav-btn next-btn"
                                    onClick={() => setCurrentImageIndex((prev) => (prev + 1) % images.length)}
                                >
                                    ›
                                </button>
                            </>
                        )}
                    </div>

                    {images.length > 1 && (
                        <div className="thumbnail-gallery">
                            {images.map((img, i) => (
                                <img
                                    key={i}
                                    src={getImageUrl(img)}
                                    alt={`${product.name} ${i + 1}`}
                                    className={`thumbnail ${i === currentImageIndex ? "active" : ""}`}
                                    onClick={() => setCurrentImageIndex(i)}
                                    onError={(e) => {
                                        e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23ddd' width='100' height='100'/%3E%3C/svg%3E";
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <div className="product-info-section">
                    <h1 className="product-name">{product.name}</h1>

                    <div className="rating-summary">
                        <div className="stars-large">
                            {renderStars(Number(avgRating))}
                        </div>
                        <span className="rating-text">
                            {avgRating} ({reviews.length} รีวิว)
                        </span>
                    </div>

                    <div className="price-info">
                        <span className="price">฿{Number(product.price).toLocaleString()}</span>
                        <span className={`stock-badge ${product.stock <= 5 ? 'low' : ''} ${product.stock === 0 ? 'out' : ''}`}>
                            {product.stock === 0 ? '❌ สินค้าหมด' : product.stock <= 5 ? `⚠️ เหลือเพียง ${product.stock} ชิ้น` : `✅ มีสินค้า ${product.stock} ชิ้น`}
                        </span>
                    </div>

                    <div className="product-description">
                        <h3>รายละเอียดสินค้า</h3>
                        <p>{product.description}</p>
                    </div>

                    <button
                        className="btn-add-cart-large"
                        disabled={product.stock === 0}
                    >
                        {product.stock === 0 ? "สินค้าหมด" : "เพิ่มลงตะกร้า"}
                    </button>
                </div>
            </div>

            <hr className="section-divider" />

            <div className="reviews-section">
                <h2 className="section-title">รีวิวสินค้า ({reviews.length})</h2>

                {reviews.length > 0 && (
                    <div className="reviews-list">
                        {/* รีวิวการ์ด */}
                        {reviews.map((r) => (
                            <div key={r.id} className={`review-card ${user && r.user_id === user.id ? 'own-review' : ''}`}>
                                <div className="review-header">
                                    <div className="reviewer-info">
                                        <div className="reviewer-avatar">
                                            {r.user_name?.charAt(0).toUpperCase() || 'U'}
                                        </div>
                                        <div className="reviewer-details">
                                            <strong className="reviewer-name">{r.user_name}</strong>
                                            <div className="review-stars">
                                                {renderStars(Number(r.rating))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="review-meta">
                                        <small className="review-date">
                                            {new Date(r.created_at).toLocaleDateString('th-TH', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </small>
                                        {user && r.user_id === user.id && (
                                            <button
                                                className="delete-review-btn"
                                                onClick={() => deleteReview(r.id)}
                                                title="ลบรีวิว"
                                                style={{
                                                    background: '#dc3545',
                                                    color: 'white',
                                                    border: 'none',
                                                    padding: '8px 12px',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '14px'
                                                }}
                                            >
                                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M2 4H14M12.6667 4V13.3333C12.6667 14 12 14.6667 11.3333 14.6667H4.66667C4 14.6667 3.33333 14 3.33333 13.3333V4M5.33333 4V2.66667C5.33333 2 6 1.33333 6.66667 1.33333H9.33333C10 1.33333 10.6667 2 10.6667 2.66667V4M6.66667 7.33333V11.3333M9.33333 7.33333V11.3333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                                ลบ
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {r.comment && (
                                    <p className="review-comment">{r.comment}</p>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                <div className="review-form-container">
                    <h3>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        เขียนรีวิว
                    </h3>

                    {!user ? (
                        <div className="login-prompt">
                            <p>กรุณาเข้าสู่ระบบเพื่อรีวิวสินค้า</p>
                            <button className="btn-login" onClick={() => navigate('/login')}>
                                เข้าสู่ระบบ
                            </button>
                        </div>
                    ) : !hasPurchased && !checkingPurchase ? (
                        <div className="purchase-required">
                            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M24 44C35.0457 44 44 35.0457 44 24C44 12.9543 35.0457 4 24 4C12.9543 4 4 12.9543 4 24C4 35.0457 12.9543 44 24 44Z" stroke="#ffa500" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M24 16V24M24 32H24.02" stroke="#ffa500" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <p>คุณต้องซื้อสินค้านี้ก่อนถึงจะรีวิวได้</p>
                        </div>
                    ) : userHasReviewed ? (
                        <div className="already-reviewed">
                            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M44 22V24C43.9974 28.3114 42.6333 32.5151 40.0991 36.0224C37.565 39.5297 33.9884 42.1686 29.8717 43.566C25.755 44.9634 21.2948 45.0525 17.1242 43.8204C12.9536 42.5884 9.2773 40.0975 6.61137 36.6916C3.94543 33.2858 2.42506 29.1351 2.26863 24.8274C2.11221 20.5198 3.32698 16.2671 5.74579 12.6835C8.1646 9.09988 11.6636 6.37291 15.7277 4.87711C19.7918 3.38132 24.2289 3.19176 28.4 4.33199" stroke="#28a745" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M44 8L24 28.02L18 22.02" stroke="#28a745" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <p>คุณรีวิวสินค้านี้ไปแล้ว</p>
                        </div>
                    ) : (
                        <form onSubmit={submitReview} className="review-form">
                            <div className="form-group">
                                <label htmlFor="rating">คะแนน *</label>
                                <div className="rating-selector">
                                    {[1, 2, 3, 4, 5].map((n) => (
                                        <label key={n} className="star-label">
                                            <input
                                                type="radio"
                                                name="rating"
                                                value={n}
                                                checked={form.rating === n}
                                                onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
                                            />
                                            <span className={`star ${form.rating >= n ? 'selected' : ''}`}>★</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="comment">ความคิดเห็น (ไม่บังคับ)</label>
                                <textarea
                                    id="comment"
                                    placeholder="เขียนความคิดเห็นของคุณเกี่ยวกับสินค้า..."
                                    value={form.comment}
                                    onChange={(e) => setForm({ ...form, comment: e.target.value })}
                                    rows="4"
                                />
                            </div>

                            <button type="submit" className="btn-submit-review">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M18.3337 1.66663L9.16699 10.8333M18.3337 1.66663L12.5003 18.3333L9.16699 10.8333M18.3337 1.66663L1.66699 7.49996L9.16699 10.8333" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                ส่งรีวิว
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}