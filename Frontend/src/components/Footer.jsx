import "../style/Footer.css"

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>เกี่ยวกับ Pet Shop</h3>
            <ul>
              <li>เรื่องราวของเรา</li>
              <li>ทีมงาน</li>
              <li>ข่าวสารและกิจกรรม</li>
            </ul>
          </div>
          <div className="footer-section">
            <h3>บริการลูกค้า</h3>
            <ul>
              <li>ติดต่อเรา</li>
              <li>คำถามที่พบบ่อย</li>
            </ul>
          </div>
          <div className="footer-section">
            <h3>นโยบายและข้อกำหนด</h3>
            <ul>
              <li>ความเป็นส่วนตัว</li>
              <li>เงื่อนไขการใช้งาน</li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2025 Pet Shop. สงวนลิขสิทธิ์</p>
        </div>
      </div>
    </footer>
  )
}
