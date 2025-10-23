// frontend/src/sections/Features.jsx
import "../style/Features.css"

export default function Features() {
  return (
    <section className="features">
      <div className="container">
        <h2 className="section-title">ทำไมต้องเลือกเรา</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🚚</div>
            <h3>จัดส่งฟรีทั่วประเทศ</h3>
            <p>สั่งซื้อขั้นต่ำ 500 บาท รับสินค้าถึงบ้านภายใน 2-3 วัน</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">✨</div>
            <h3>สินค้าคุณภาพพรีเมียม</h3>
            <p>คัดสรรสินค้าคุณภาพสูง ปลอดภัยสำหรับสัตว์เลี้ยงทุกชนิด</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💯</div>
            <h3>รับประกันความพึงพอใจ</h3>
            <p>คืนเงิน 100% หากไม่พอใจภายใน 30 วัน</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💬</div>
            <h3>ให้คำปรึกษาฟรี</h3>
            <p>ทีมผู้เชี่ยวชาญพร้อมให้คำแนะนำการดูแลสัตว์เลี้ยง</p>
          </div>
        </div>
      </div>
    </section>
  )
}
