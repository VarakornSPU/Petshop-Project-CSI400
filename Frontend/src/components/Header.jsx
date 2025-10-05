import React from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import '../style/Header.css'

export default function Header(){
  const { cart } = useCart()
  const totalItems = cart.reduce((s,i)=>s + (i.quantity||0), 0)

  return (
    <header className="header">
      <div className="container header-content">
        <div className="logo">Pet Shop</div>

        <nav className="nav">
          <Link to="/">หน้าแรก</Link>
          <Link to="/about">เกี่ยวกับเรา</Link>
          <Link to="/contact">ติดต่อ</Link>
        </nav>

        <div className="header-actions">
          <div className="search-container">
            <span className="search-icon">🔍</span>
            <input className="search-input" id="searchInput" placeholder="ค้นหาสินค้า..." />
          </div>

          <button className="cart-btn" onClick={()=>{
            const el = document.getElementById('cartModal')
            if(el) el.style.display = el.style.display === 'block' ? 'none' : 'block'
          }}>
            🛒 ตะกร้า
            <span className="cart-count" id="cartCount">{totalItems}</span>
          </button>
        </div>
      </div>
    </header>
  )
}
