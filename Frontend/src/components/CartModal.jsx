import { useCart } from "../context/CartContext"
import "../style/CartModal.css"

export default function CartModal() {
  const { cart, removeFromCart, clearCart } = useCart()
  const total = cart.reduce((s, i) => s + i.price * (i.quantity || 0), 0)

  return (
    <div
      className="cart-modal"
      id="cartModal"
      onClick={(e) => {
        if (e.target.id === "cartModal") e.currentTarget.style.display = "none"
      }}
    >
      <div className="cart-content">
        <div className="cart-header">
          <h3>🛒 ตะกร้าสินค้าของคุณ</h3>
          <button
            className="close-cart"
            onClick={() => {
              document.getElementById("cartModal").style.display = "none"
            }}
          >
            ×
          </button>
        </div>

        <div id="cartItems">
          {cart.length === 0 ? (
            <div className="empty-cart">
              <div className="empty-cart-icon">🐾</div>
              <p>ตะกร้าว่างเปล่า</p>
              <span>เริ่มช้อปปิ้งเลือกสินค้าสำหรับน้องๆ กันเถอะ!</span>
            </div>
          ) : (
            cart.map((item) => (
              <div className="cart-item" key={item.id}>
                <img src={item.image || "/placeholder.svg"} alt={item.name} className="cart-item-image" />
                <div className="cart-item-info">
                  <div className="cart-item-name">{item.name}</div>
                  <div className="cart-item-details">
                    ฿{item.price.toLocaleString()} × {item.quantity}
                  </div>
                  <div className="cart-item-subtotal">฿{(item.price * item.quantity).toLocaleString()}</div>
                </div>
                <button className="remove-item" onClick={() => removeFromCart(item.id)}>
                  ×
                </button>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <>
            <div className="cart-total">
              <span>รวมทั้งสิ้น:</span>
              <span className="cart-total-amount">฿{total.toLocaleString()}</span>
            </div>

            <button
              className="checkout-btn"
              onClick={() => {
                alert("ขอบคุณสำหรับการสั่งซื้อ ยอดรวม ฿" + total.toLocaleString())
                clearCart()
                document.getElementById("cartModal").style.display = "none"
              }}
            >
              <span>สั่งซื้อสินค้า</span>
              <span>→</span>
            </button>
          </>
        )}
      </div>
    </div>
  )
}
