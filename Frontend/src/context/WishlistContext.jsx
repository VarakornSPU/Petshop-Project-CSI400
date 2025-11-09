// Frontend/src/context/WishlistContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const WishlistContext = createContext();

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within WishlistProvider');
  }
  return context;
};

export const WishlistProvider = ({ children }) => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const API_URL = 'http://localhost:3001/api';

  // ดึงรายการ wishlist เมื่อ login
  useEffect(() => {
    if (isAuthenticated) {
      fetchWishlist();
    } else {
      setWishlistItems([]);
    }
  }, [isAuthenticated]);

  // ดึงรายการ wishlist
  const fetchWishlist = async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_URL}/wishlists`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWishlistItems(response.data.wishlists || []);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      setWishlistItems([]);
    } finally {
      setLoading(false);
    }
  };

  // เพิ่มสินค้าใน wishlist
  const addToWishlist = async (productId) => {
    if (!isAuthenticated) {
      alert('กรุณาเข้าสู่ระบบเพื่อเพิ่มสินค้าในรายการที่ถูกใจ');
      return false;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.post(
        `${API_URL}/wishlists`,
        { product_id: productId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      await fetchWishlist(); // รีเฟรชรายการ
      return true;
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      if (error.response?.data?.exists) {
        alert('สินค้านี้อยู่ในรายการที่ถูกใจแล้ว');
      } else {
        alert(error.response?.data?.error || 'ไม่สามารถเพิ่มสินค้าได้');
      }
      return false;
    }
  };

  // ลบสินค้าออกจาก wishlist
  const removeFromWishlist = async (productId) => {
    if (!isAuthenticated) return false;

    try {
      const token = localStorage.getItem('authToken');
      await axios.delete(`${API_URL}/wishlists/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      await fetchWishlist(); // รีเฟรชรายการ
      return true;
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      alert(error.response?.data?.error || 'ไม่สามารถลบสินค้าได้');
      return false;
    }
  };

  // ตรวจสอบว่าสินค้าอยู่ใน wishlist หรือไม่
  const isInWishlist = (productId) => {
    return wishlistItems.some(item => item.product_id === parseInt(productId));
  };

  // Toggle wishlist (เพิ่ม/ลบ)
  const toggleWishlist = async (productId) => {
    if (isInWishlist(productId)) {
      return await removeFromWishlist(productId);
    } else {
      return await addToWishlist(productId);
    }
  };

  // ล้างรายการ wishlist ทั้งหมด
  const clearWishlist = async () => {
    if (!isAuthenticated) return false;

    if (!window.confirm('คุณต้องการล้างรายการที่ถูกใจทั้งหมดใช่หรือไม่?')) {
      return false;
    }

    try {
      const token = localStorage.getItem('authToken');
      await axios.delete(`${API_URL}/wishlists`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setWishlistItems([]);
      return true;
    } catch (error) {
      console.error('Error clearing wishlist:', error);
      alert('ไม่สามารถล้างรายการได้');
      return false;
    }
  };

  const value = {
    wishlistItems,
    wishlistCount: wishlistItems.length,
    loading,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    toggleWishlist,
    clearWishlist,
    fetchWishlist
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};

export default WishlistContext;