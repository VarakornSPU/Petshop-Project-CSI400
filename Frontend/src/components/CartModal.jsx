import React from 'react'
import { useCart } from '../context/CartContext'
import '../style/CartModal.css'

export default function CartModal(){
  const { cart, removeFromCart, clearCart } = useCart()
  const total = cart.reduce((s,i)=> s + (i.price * (i.quantity||0)), 0)

  return (
    <div className="cart-modal" id="cartModal" onClick={(e)=>{ if(e.target.id==='cartModal') e.currentTarget.style.display='none' }}>
      <div className="cart-content">
        <div className="cart-header">
          <h3>ตะกร้าสินค้าของคุณ</h3>
          <button className="close-cart" onClick={()=>{ document.getElementById('cartModal').style.display='none' }}>×</button>
        </div>

        <div id="cartItems">
          {cart.length===0 ? (
            <p style={{textAlign:'center', color:'var(--muted-foreground)', padding:'2rem'}}>ตะกร้าว่างเปล่า</p>
          ) : cart.map(item=>(
            <div className="cart-item" key={item.id}>
              <div className="cart-item-info">
                <div className="cart-item-name">{item.name}</div>
                <div className="cart-item-details">฿{item.price.toLocaleString()} × {item.quantity} = ฿{(item.price*item.quantity).toLocaleString()}</div>
              </div>
              <button className="remove-item" onClick={()=> removeFromCart(item.id)}>ลบ</button>
            </div>
          ))}
        </div>

        <div className="cart-total">รวมทั้งสิ้น: ฿{total.toLocaleString()}</div>

        <button className="checkout-btn" onClick={()=>{
          if(cart.length===0){ alert('ตะกร้าว่างเปล่า กรุณาเลือกสินค้าก่อน'); return }
          alert('ขอบคุณสำหรับการสั่งซื้อ ยอดรวม ฿' + total.toLocaleString())
          clearCart()
          document.getElementById('cartModal').style.display='none'
        }}>สั่งซื้อสินค้า</button>
      </div>
    </div>
  )
}
