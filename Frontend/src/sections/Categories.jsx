import React from 'react'
import '../style/Categories.css'

export default function Categories(){
  function filterProducts(cat){
    // dispatch custom event for product filtering
    window.dispatchEvent(new CustomEvent('filterProducts', { detail: cat }))
  }
  return (
    <section className="categories" id="categories">
      <div className="container">
        <h2 className="section-title">หมวดหมู่สินค้า</h2>
        <div className="categories-grid">
          <div className="category-card" onClick={()=>filterProducts('electronics')}>
            <span className="category-icon">📱</span>
            <h3>อิเล็กทรอนิกส์</h3>
            <p>โทรศัพท์มือถือ แท็บเล็ต แล็ปท็อป และอุปกรณ์เสริมทันสมัย</p>
          </div>
          <div className="category-card" onClick={()=>filterProducts('fashion')}>
            <span className="category-icon">👕</span>
            <h3>แฟชั่น</h3>
            <p>เสื้อผ้าแบรนด์ดัง รองเท้า กระเป๋า และเครื่องประดับ</p>
          </div>
          <div className="category-card" onClick={()=>filterProducts('home')}>
            <span className="category-icon">🏠</span>
            <h3>ของใช้ในบ้าน</h3>
            <p>เฟอร์นิเจอร์ ของตกแต่ง และอุปกรณ์ใช้ในครัวเรือน</p>
          </div>
          <div className="category-card" onClick={()=>filterProducts('beauty')}>
            <span className="category-icon">💄</span>
            <h3>ความงาม</h3>
            <p>เครื่องสำอาง ผลิตภัณฑ์ดูแลผิว และอุปกรณ์ความงาม</p>
          </div>
        </div>
      </div>
    </section>
  )
}
