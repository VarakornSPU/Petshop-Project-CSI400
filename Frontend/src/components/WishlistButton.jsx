// Frontend/src/components/WishlistButton.jsx
import React, { useState } from 'react';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import '../style/WishlistButton.css';

export default function WishlistButton({ productId, size = 'medium', showText = false }) {
  const { isInWishlist, toggleWishlist, loading } = useWishlist();
  const { isAuthenticated } = useAuth();
  const [isAnimating, setIsAnimating] = useState(false);
  
  const inWishlist = isInWishlist(productId);

  const handleClick = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!isAuthenticated) {
      alert('กรุณาเข้าสู่ระบบเพื่อใช้งานรายการที่ถูกใจ');
      return;
    }

    setIsAnimating(true);
    const success = await toggleWishlist(productId);
    
    setTimeout(() => {
      setIsAnimating(false);
    }, 600);
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`wishlist-btn wishlist-btn-${size} ${inWishlist ? 'active' : ''} ${isAnimating ? 'animating' : ''}`}
      title={inWishlist ? 'ลบออกจากรายการที่ถูกใจ' : 'เพิ่มในรายการที่ถูกใจ'}
    >
      <svg 
        className="heart-icon" 
        viewBox="0 0 24 24" 
        fill={inWishlist ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
}