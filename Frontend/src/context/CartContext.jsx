// Frontend/src/context/CartContext.jsx (ตรวจสอบว่ามีครบไหม)
import { useNavigate } from 'react-router-dom';
import { createContext, useContext, useState } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [notification, setNotification] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate(); 

  const addToCart = (product) => {
    // ตรวจสอบสถานะล็อกอินก่อน
    if (!isAuthenticated) {
      setNotification('⚠️ กรุณาเข้าสู่ระบบก่อนเพิ่มสินค้าลงตะกร้า');
      setTimeout(() => setNotification(''), 3000);
      
      navigate('/login');

      return false;
    }

    // เพิ่มสินค้าในตะกร้า
    setCartItems(prev => {
      const found = prev.find(p => p.id === product.id);
      if (found) {
        return prev.map(p =>
          p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });

    setNotification(`เพิ่ม "${product.name}" ลงตะกร้าแล้ว ✅`);
    setTimeout(() => setNotification(''), 3000);
    return true;
  };

  const removeFromCart = (id) => {
    setCartItems(prev => prev.filter(p => p.id !== id));
    setNotification('ลบสินค้าออกจากตะกร้าแล้ว');
    setTimeout(() => setNotification(''), 2000);
  };

  const updateQuantity = (id, quantity) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setCartItems(prev =>
      prev.map(p =>
        p.id === id ? { ...p, quantity } : p
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
    setNotification('ล้างตะกร้าสินค้าแล้ว');
    setTimeout(() => setNotification(''), 2000);
  };

  // คำนวณราคารวมและจำนวนสินค้า
  const cartTotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  const cartItemsCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  const value = {
    cartItems,
    setCartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    notification,
    isCartOpen,
    setIsCartOpen,
    cartTotal,
    cartItemsCount,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
