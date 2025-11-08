import { useState } from "react"
import "../style/Contact.css"

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // Handle form submission here
    console.log("Form submitted:", formData)
    alert("ขอบคุณที่ติดต่อเรา! เราจะตอบกลับโดยเร็วที่สุด")
    // Reset form
    setFormData({
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
    })
  }

  return (
    <div className="contact-page">
      {/* Hero Section */}
      <section className="contact-hero">
        <div className="contact-hero-content">
          <h1 className="contact-hero-title">ติดต่อเรา</h1>
          <p className="contact-hero-subtitle">เรายินดีรับฟังความคิดเห็นและตอบคำถามของคุณ</p>
        </div>
      </section>

      {/* Main Content */}
      <section className="contact-content">
        <div className="contact-container">
          {/* Contact Info & Form Grid */}
          <div className="contact-grid">
            {/* Contact Information */}
            <div className="contact-info-section">
              <h2 className="contact-section-title">ข้อมูลติดต่อ</h2>

              <div className="contact-info-cards">
                <div className="contact-info-card">
                  <div className="contact-info-icon">📍</div>
                  <h3 className="contact-info-title">ที่อยู่</h3>
                  <p className="contact-info-text">
                    123 ถนนสุขุมวิท
                    <br />
                    เขตคลองเตย กรุงเทพฯ 10110
                  </p>
                </div>

                <div className="contact-info-card">
                  <div className="contact-info-icon">📞</div>
                  <h3 className="contact-info-title">โทรศัพท์</h3>
                  <p className="contact-info-text">
                    02-XXX-XXXX
                    <br />
                    081-XXX-XXXX
                  </p>
                </div>

                <div className="contact-info-card">
                  <div className="contact-info-icon">✉️</div>
                  <h3 className="contact-info-title">อีเมล</h3>
                  <p className="contact-info-text">
                    info@petshop.com
                    <br />
                    support@petshop.com
                  </p>
                </div>

                <div className="contact-info-card">
                  <div className="contact-info-icon">🕐</div>
                  <h3 className="contact-info-title">เวลาทำการ</h3>
                  <p className="contact-info-text">
                    จันทร์-ศุกร์: 9:00-18:00
                    <br />
                    เสาร์-อาทิตย์: 10:00-17:00
                  </p>
                </div>
              </div>

              {/* Social Media */}
              <div className="contact-social">
                <h3 className="contact-social-title">ติดตามเราได้ที่</h3>
                <div className="social-links">
                  <a href="#" className="social-link" aria-label="Facebook">
                    <span>Facebook</span>
                  </a>
                  <a href="#" className="social-link" aria-label="Instagram">
                    <span>Instagram</span>
                  </a>
                  <a href="#" className="social-link" aria-label="Line">
                    <span>Line</span>
                  </a>
                  <a href="#" className="social-link" aria-label="Twitter">
                    <span>Twitter</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="contact-form-section">
              <h2 className="contact-section-title">ส่งข้อความถึงเรา</h2>
              <form className="contact-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="name" className="form-label">
                    ชื่อ-นามสกุล <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="form-input"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="กรุณากรอกชื่อ-นามสกุล"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email" className="form-label">
                    อีเมล <span className="required">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="form-input"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="example@email.com"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phone" className="form-label">
                    เบอร์โทรศัพท์
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    className="form-input"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="08X-XXX-XXXX"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="subject" className="form-label">
                    หัวข้อ <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    className="form-input"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    placeholder="หัวข้อที่ต้องการติดต่อ"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="message" className="form-label">
                    ข้อความ <span className="required">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    className="form-textarea"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows="6"
                    placeholder="รายละเอียดที่ต้องการติดต่อ..."
                  ></textarea>
                </div>

                <button type="submit" className="form-submit-btn">
                  ส่งข้อความ
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
