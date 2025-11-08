import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";

const CartContext = createContext();
const API_URL = "http://localhost:3001/cart";

export function useCart() {
  return useContext(CartContext);
}

// ✅ ฟังก์ชันแปลง path รูปภาพให้ถูกต้อง
export function getImageUrl(product) {
  if (!product) return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect fill='%23ddd' width='400' height='400'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='24' dy='10.5' font-weight='bold' x='50%25' y='50%25' text-anchor='middle'%3ENo Image%3C/text%3E%3C/svg%3E";

  let imagePath = null;

  // ลองหารูปจาก images array ก่อน
  if (product.images && Array.isArray(product.images) && product.images.length > 0) {
    imagePath = product.images[0];
  } 
  // ลองหาจาก image field
  else if (product.image) {
    imagePath = product.image;
  }
  // ลองหาจาก product_image (จาก cart response)
  else if (product.product_image) {
    imagePath = product.product_image;
  }

  // ถ้าไม่มีรูป ใช้ placeholder
  if (!imagePath) {
    return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect fill='%23ddd' width='400' height='400'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='24' dy='10.5' font-weight='bold' x='50%25' y='50%25' text-anchor='middle'%3ENo Image%3C/text%3E%3C/svg%3E";
  }

  // ถ้าเป็น URL เต็มอยู่แล้ว
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }

  // ถ้าขึ้นต้นด้วย /uploads/
  if (imagePath.startsWith("/uploads/")) {
    return `http://localhost:3001${imagePath}`;
  }

  // ถ้าขึ้นต้นด้วย /
  if (imagePath.startsWith("/")) {
    return `http://localhost:3001${imagePath}`;
  }

  // ถ้าเป็นชื่อไฟล์เฉยๆ
  return `http://localhost:3001/uploads/${imagePath}`;
}

export function CartProvider({ children }) {
  const { token, isAuthenticated } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [notification, setNotification] = useState("");
  const [isCartOpen, setIsCartOpen] = useState(false);

  const fetchCart = async () => {
    if (!token) return;
    try {
      const res = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const items = res.data.items || res.data || [];
      
      // ✅ เพิ่ม imageUrl ให้กับแต่ละ item
      const itemsWithImages = items.map(item => ({
        ...item,
        imageUrl: getImageUrl(item)
      }));
      
      setCartItems(itemsWithImages);
    } catch (err) {
      console.error("Fetch cart error:", err);
    }
  };

  const addToCart = async (product) => {
    if (!isAuthenticated) {
      setNotification("⚠️ กรุณาเข้าสู่ระบบก่อนเพิ่มสินค้า");
      return;
    }
    try {
      await axios.post(
        `${API_URL}/add`,
        { productId: product.id, quantity: 1 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchCart();
      setNotification(`✅ เพิ่ม "${product.name}" ลงตะกร้าแล้ว`);
      setIsCartOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const updateQuantity = async (id, quantity) => {
    await axios.put(
      `${API_URL}/update/${id}`,
      { quantity },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    fetchCart();
  };

  const removeFromCart = async (id) => {
    await axios.delete(`${API_URL}/remove/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchCart();
  };

  const clearCart = async () => {
    try {
      await axios.delete(`${API_URL}/clear`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCartItems([]);
      fetchCart();
      setIsCartOpen(false);
    } catch (err) {
      console.error("Clear cart error:", err);
    }
  };

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchCart();
    } else {
      setCartItems([]);
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const cartTotal = cartItems.reduce(
    (sum, i) => sum + i.price * i.quantity,
    0
  );
  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        fetchCart,
        cartTotal,
        cartCount,
        isCartOpen,
        setIsCartOpen,
        notification,
        getImageUrl, // ✅ export ฟังก์ชันนี้ด้วยเผื่อใช้ที่อื่น
      }}
    >
      {children}
    </CartContext.Provider>
  );
}