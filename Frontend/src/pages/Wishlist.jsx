// Frontend/src/pages/Wishlist.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import WishlistButton from '../components/WishlistButton';
import '../style/Wishlist.css';

export default function Wishlist() {
    const navigate = useNavigate();
    const { wishlistItems, loading, clearWishlist } = useWishlist();
    const { addToCart } = useCart();

    const getImageUrl = (images) => {
        if (!images || images.length === 0) {
            return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect fill='%23ddd' width='400' height='400'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='24' dy='10.5' font-weight='bold' x='50%25' y='50%25' text-anchor='middle'%3ENo Image%3C/text%3E%3C/svg%3E";
        }

        const firstImage = Array.isArray(images) ? images[0] : images;

        if (firstImage.startsWith("http")) {
            return firstImage;
        }

        if (firstImage.startsWith("/uploads/")) {
            return `http://localhost:3001${firstImage}`;
        }

        return `http://localhost:3001/uploads/${firstImage}`;
    };

    const handleClearAll = async () => {
        await clearWishlist();
    };

    const handleAddAllToCart = async () => {
        for (const item of wishlistItems) {
            if (item.stock <= 0) continue; // ข้ามสินค้าหมด
            try {
                const res = await fetch(`http://localhost:3001/api/products/${item.product_id}`);
                if (!res.ok) throw new Error('ไม่พบสินค้า');
                const productData = await res.json();
                addToCart(productData);
            } catch (err) {
                console.error(`เพิ่มสินค้า ${item.name} ลงตะกร้าไม่สำเร็จ:`, err);
            }
        }
        alert("เพิ่มสินค้าทั้งหมดลงตะกร้าเรียบร้อยแล้ว!");
    };


    // Helper function to safely convert rating to number
    const getRating = (rating) => {
        if (rating === null || rating === undefined) return 0;
        const numRating = Number(rating);
        return isNaN(numRating) ? 0 : numRating;
    };

    // Helper function to safely get reviews count
    const getReviewsCount = (reviews) => {
        if (reviews === null || reviews === undefined) return 0;
        const numReviews = Number(reviews);
        return isNaN(numReviews) ? 0 : numReviews;
    };

    if (loading) {
        return (
            <div className="wishlist-container">
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>กำลังโหลด...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="wishlist-container">
            <div className="wishlist-header">
                <div className="header-content">
                    <h1 className="page-title">
                        <svg className="heart-icon-title" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                        รายการสินค้าที่ถูกใจ
                    </h1>
                    <p className="subtitle">
                        มี {wishlistItems.length} รายการ
                    </p>
                </div>

                {wishlistItems.length > 0 && (
                    <div className="wishlist-actions">
                        <button onClick={handleClearAll} className="btn-clear-all">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                            ล้างทั้งหมด
                        </button>

                        <button onClick={handleAddAllToCart} className="btn-add-all-cart">
                            เพิ่มสินค้าทั้งหมดลงตะกร้า
                        </button>
                    </div>
                )}

            </div>

            {wishlistItems.length === 0 ? (
                <div className="empty-state">
                    <svg className="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                    <h2>ยังไม่มีสินค้าที่ถูกใจ</h2>
                    <p>เริ่มเพิ่มสินค้าที่คุณชอบเพื่อติดตามได้ง่ายขึ้น</p>
                    <button onClick={() => navigate('/products')} className="btn-browse">
                        เลือกดูสินค้า
                    </button>
                </div>
            ) : (
                <div className="wishlist-grid">
                    {wishlistItems.map((item) => {
                        const rating = getRating(item.rating);
                        const reviewsCount = getReviewsCount(item.reviews);

                        return (
                            <div key={item.id} className="wishlist-card">
                                <div className="card-image-container">
                                    <img
                                        src={getImageUrl(item.images)}
                                        alt={item.name}
                                        className="card-image"
                                        onClick={() => navigate(`/product/${item.product_id}`)}
                                        onError={(e) => {
                                            e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect fill='%23ddd' width='400' height='400'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='24' dy='10.5' font-weight='bold' x='50%25' y='50%25' text-anchor='middle'%3ENo Image%3C/text%3E%3C/svg%3E";
                                        }}
                                    />
                                    <div className="wishlist-btn-wrapper">
                                        <WishlistButton productId={item.product_id} size="medium" />
                                    </div>
                                    {item.stock <= 0 && (
                                        <div className="out-of-stock-badge">สินค้าหมด</div>
                                    )}
                                    {item.stock > 0 && item.stock <= 5 && (
                                        <div className="low-stock-badge">เหลือ {item.stock} ชิ้น</div>
                                    )}
                                </div>

                                <div className="card-content">
                                    <h3
                                        className="card-title"
                                        onClick={() => navigate(`/product/${item.product_id}`)}
                                    >
                                        {item.name}
                                    </h3>

                                    {item.description && (
                                        <p className="card-description">
                                            {item.description.length > 80
                                                ? `${item.description.substring(0, 80)}...`
                                                : item.description}
                                        </p>
                                    )}

                                    <div className="card-rating">
                                        <span
                                            className="stars"
                                            style={{ color: rating > 0 ? '#FFD700' : '#ddd' }}
                                        >
                                            {"★".repeat(Math.floor(rating))}
                                            {"☆".repeat(5 - Math.floor(rating))}
                                        </span>
                                        <span className="rating-text">
                                            {rating.toFixed(1)} ({reviewsCount.toLocaleString()} รีวิว)
                                        </span>
                                    </div>

                                    <div className="card-footer">
                                        <div className="price-section">
                                            <span className="price">฿{Number(item.price).toLocaleString()}</span>
                                        </div>

                                        <button
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                try {
                                                    // Fetch product จริงจาก backend ก่อนเพิ่มลงตะกร้า
                                                    const res = await fetch(`http://localhost:3001/api/products/${item.product_id}`);
                                                    if (!res.ok) throw new Error('ไม่พบสินค้า');
                                                    const productData = await res.json();

                                                    addToCart(productData); // ส่ง object แบบเดียวกับ Products.jsx
                                                } catch (err) {
                                                    console.error('เพิ่มลงตะกร้าไม่สำเร็จ:', err);
                                                }
                                            }}
                                            disabled={item.stock === 0}
                                            className="btn-add-cart"
                                        >
                                            {item.stock === 0 ? 'สินค้าหมด' : 'เพิ่มลงตะกร้า'}
                                        </button>


                                    </div>

                                    <div className="card-meta">
                                        <small>เพิ่มเมื่อ: {new Date(item.created_at).toLocaleDateString('th-TH')}</small>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}