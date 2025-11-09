import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import WishlistButton from '../components/WishlistButton';
import '../style/Products.css';

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const searchQuery = searchParams.get('q') || '';
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      if (!searchQuery) return;
      
      setLoading(true);
      try {
        const response = await fetch(`http://localhost:3001/api/products/search?q=${encodeURIComponent(searchQuery)}`);
        if (response.ok) {
          const data = await response.json();
          setProducts(data);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [searchQuery]);

  const getImageUrl = (images) => {
    if (!images || images.length === 0) return null;
    const firstImage = Array.isArray(images) ? images[0] : images;
    if (firstImage.startsWith('http')) return firstImage;
    if (firstImage.startsWith('/uploads/')) return `http://localhost:3001${firstImage}`;
    return `http://localhost:3001/uploads/${firstImage}`;
  };

  if (loading) {
    return (
      <section className="products">
        <div className="container">
          <h2 className="section-title">กำลังค้นหา...</h2>
        </div>
      </section>
    );
  }

  return (
    <section className="products">
      <div className="container">
        <div className="products-header">
          <h2 className="section-title">
            ผลการค้นหา: "{searchQuery}" ({products.length} รายการ)
          </h2>
        </div>

        {products.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
            ไม่พบสินค้าที่ค้นหา
          </p>
        ) : (
          <div className="products-grid">
            {products.map((p) => (
              <div
                className="product-card"
                key={p.id}
                onClick={() => navigate(`/product/${p.id}`)}
                style={{ cursor: 'pointer' }}
              >
                <div className="product-image">
                  <img
                    src={getImageUrl(p.images) || '/placeholder.png'}
                    alt={p.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div className="wishlist-btn-wrapper-1">
                    <WishlistButton productId={p.id} size="medium" />
                  </div>
                </div>

                <div className="product-info">
                  <h3 className="product-title">{p.name}</h3>
                  {p.description && <p className="product-description-1">{p.description}</p>}

                  <div className="product-rating">
                    <span className="stars">
                      {"★".repeat(Math.floor(p.rating || 0))}
                      {"☆".repeat(5 - Math.floor(p.rating || 0))}
                    </span>
                    <span className="rating-text">
                      {(p.rating || 0).toFixed(1)} ({(p.reviews || 0).toLocaleString()} รีวิว)
                    </span>
                  </div>

                  <div className="product-price">฿{(p.price ? Number(p.price) : 0).toLocaleString()}</div>

                  <button
                    className="add-to-cart"
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(p);
                    }}
                    disabled={p.stock === 0}
                  >
                    {p.stock === 0 ? 'สินค้าหมด' : 'เพิ่มลงตะกร้า'}
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