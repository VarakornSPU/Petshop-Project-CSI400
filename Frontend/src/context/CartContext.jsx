import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";

const CartContext = createContext();
const API_URL = "http://localhost:3001/cart";

export function useCart() {
  return useContext(CartContext);
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
      setCartItems(res.data.items || res.data || []);
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
    await axios.delete(`${API_URL}/clear`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setCartItems([]);
  };

useEffect(() => {
  if (isAuthenticated && token) {
    fetchCart();
  } else {
    setCartItems([]); // ล้าง cart เมื่อ logout
  }
}, [isAuthenticated, token]);

useEffect(() => {
  if (notification) {
    const timer = setTimeout(() => setNotification(""), 3000); // 3 วินาทีแล้วหาย
    return () => clearTimeout(timer); // เคลียร์ timer ถ้ามีการเปลี่ยนข้อความก่อนครบเวลา
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
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
