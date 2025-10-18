import "../style/Hero.css"

export default function Hero() {
  return (
    <section className="hero" id="home">
      <div className="hero-background">
        <img src="/happy-dog-and-cat-together-with-pet-supplies.jpg" alt="Happy pets" className="hero-bg-image" />
        <div className="hero-overlay"></div>
      </div>

      <div className="container hero-content">
        <div className="hero-icons">
          <span className="hero-icon">🐕</span>
          <span className="hero-icon">🐈</span>
        </div>

        <h1>
          ร้านขายของสัตว์เลี้ยง
          <br />
          คุณภาพพรีเมียม
        </h1>
        <p className="hero-subtitle">
          ค้นพบอาหาร ของเล่น และอุปกรณ์สัตว์เลี้ยงคุณภาพสูง ดูแลน้องหมาน้องแมวของคุณด้วยความรักและใส่ใจ ส่งฟรีทั่วประเทศ รับประกันความพึงพอใจ
          100%
        </p>
        <div className="hero-buttons">
          <a href="#products" className="btn btn-primary">
            เริ่มช้อปปิ้ง →
          </a>
          <a href="#categories" className="btn btn-secondary">
            ดูหมวดหมู่ทั้งหมด
          </a>
        </div>

        <div className="hero-badges">
          <div className="badge">
            <span className="badge-icon">✓</span>
            <span>ส่งฟรีทั่วไทย</span>
          </div>
          <div className="badge">
            <span className="badge-icon">✓</span>
            <span>สินค้าคุณภาพ</span>
          </div>
          <div className="badge">
            <span className="badge-icon">✓</span>
            <span>รับประกัน 100%</span>
          </div>
        </div>
      </div>
    </section>
  )
}
