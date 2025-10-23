// Frontend/src/components/CartModal.jsx 
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import '../style/CartModal.css';

export default function CartModal() {
  const { cartItems, removeFromCart, updateQuantity, clearCart, isCartOpen, setIsCartOpen, cartTotal } = useCart();
  const { isAuthenticated } = useAuth();

  console.log('CartModal rendered');
  console.log('isCartOpen:', isCartOpen);
  console.log('cartItems:', cartItems);

  if (!isCartOpen) {
    console.log('Cart is closed');
    return null;
  }

  console.log('Cart is open!');

  return (
    <div className="cart-modal-overlay">
      <div className="cart-backdrop" onClick={() => setIsCartOpen(false)} />
      
      <div className="cart-modal">
        {/* Header */}
        <div className="cart-header">
          <div className="cart-header-content">
            <div className="cart-header-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5 6m0 0h12" />
              </svg>
            </div>
            <div>
              <h3 className="cart-header-title">ตะกร้าสินค้า</h3>
              <p className="cart-header-count">{cartItems.length} รายการ</p>
            </div>
          </div>
          <button onClick={() => setIsCartOpen(false)} className="cart-close-btn">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="cart-content">
          {!isAuthenticated ? (
            <div className="cart-login-prompt">
              <div className="cart-login-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h3>กรุณาเข้าสู่ระบบ</h3>
              <p>เข้าสู่ระบบเพื่อเพิ่มสินค้าลงตะกร้าและทำการสั่งซื้อ</p>
              <div className="cart-login-buttons">
                <Link to="/login" onClick={() => setIsCartOpen(false)} className="cart-login-btn">
                  เข้าสู่ระบบ
                </Link>
                <Link to="/register" onClick={() => setIsCartOpen(false)} className="cart-register-btn">
                  สมัครสมาชิกใหม่
                </Link>
              </div>
            </div>
          ) : cartItems.length === 0 ? (
            <div className="cart-empty">
              <div className="cart-empty-icon">
                <span className="cart-empty-icon-emoji">🐾</span>
              </div>
              <h3>ตะกร้าว่างเปล่า</h3>
              <p>เริ่มช้อปปิ้งเลือกสินค้าสำหรับน้องๆ กันเถอะ!</p>
              <Link to="/products" onClick={() => setIsCartOpen(false)} className="cart-empty-btn">
                เลือกซื้อสินค้า
              </Link>
            </div>
          ) : (
            <div className="cart-items">
              {cartItems.map((item) => (
                <div key={item.id} className="cart-item">
                  <img src={item.image || "/placeholder.svg"} alt={item.name} className="cart-item-image" />
                  <div className="cart-item-details">
                    <h4 className="cart-item-name">{item.name}</h4>
                    <p className="cart-item-price">฿{item.price?.toLocaleString()}</p>
                  </div>
                  
                  <div className="quantity-controls">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="quantity-btn">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                    <span className="quantity-value">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="quantity-btn">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </button>
                  </div>

                  <div className="cart-item-total">
                    ฿{(item.price * item.quantity).toLocaleString()}
                  </div>

                  <button onClick={() => removeFromCart(item.id)} className="cart-item-remove">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {isAuthenticated && cartItems.length > 0 && (
          <div className="cart-footer">
            <div className="cart-total">
              <span className="cart-total-label">รวมทั้งสิ้น:</span>
              <span className="cart-total-amount">฿{cartTotal.toLocaleString()}</span>
            </div>
            
            <div className="cart-footer-actions">
              <button onClick={clearCart} className="cart-clear-btn">
                ล้างตะกร้า
              </button>
              <Link to="/checkout" onClick={() => setIsCartOpen(false)} className="cart-checkout-btn">
                สั่งซื้อสินค้า
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}