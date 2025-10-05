import React from 'react'
import '../style/Hero.css'
export default function Hero(){
  return (
    <section className="hero" id="home">
      <div className="container">
        <h1>ร้านค้าออนไลน์<br/>ระดับพรีเมียม</h1>
        <p className="hero-subtitle">ค้นพบสินค้าคุณภาพสูง ดีไซน์ทันสมัย พร้อมประสบการณ์การช้อปปิ้งที่ไม่เหมือนใคร ส่งฟรีทั่วประเทศ รับประกันความพึงพอใจ 100%</p>
        <div className="hero-buttons">
          <a href="#products" className="btn btn-primary">เริ่มช้อปปิ้ง →</a>
          <a href="#categories" className="btn btn-secondary">ดูหมวดหมู่ทั้งหมด</a>
        </div>
      </div>
    </section>
  )
}
