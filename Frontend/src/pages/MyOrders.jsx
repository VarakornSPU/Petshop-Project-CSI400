import { useEffect, useState } from "react"
import axios from "axios"
import { useAuth } from "../context/AuthContext"
import "../style/MyOrders.css"

export default function MyOrders() {
  const { token } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    const fetchOrders = async () => {
      try {
        const res = await axios.get("http://localhost:3001/api/orders", {
          headers: { Authorization: `Bearer ${token}` },
        })
        setOrders(res.data.orders || [])
      } catch (err) {
        console.error("Fetch orders error:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [token])

  if (loading) return <div className="orders-loading">กำลังโหลดคำสั่งซื้อ...</div>
  if (orders.length === 0) return <div className="orders-empty">ยังไม่มีคำสั่งซื้อ</div>

  return (
    <div className="orders-container">
      <div className="orders-header">
        <h2>คำสั่งซื้อของฉัน</h2>
      </div>

      {orders.map((o) => (
        <div key={o.id} className="order-card">
          <div className="order-header">
            <span className="order-number">คำสั่งซื้อ #{o.id}</span>
            <span className={`order-status-badge ${o.status || "pending"}`}>{o.status || "pending"}</span>
          </div>

          <div className="order-info-grid">
            <div className="order-info-item">
              <span className="order-info-label">ยอดรวม</span>
              <span className="order-info-value">฿{Number(o.total).toFixed(2)}</span>
            </div>
            <div className="order-info-item">
              <span className="order-info-label">วันที่สั่งซื้อ</span>
              <span className="order-info-value">
                {o.created_at_local
                  ? o.created_at_local
                  : new Date(o.created_at).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}
              </span>
            </div>
          </div>

          <details className="order-details">
            <summary>รายการสินค้า ({o.items?.length || 0} รายการ)</summary>
            <div className="order-details-content">
              <ul className="order-items-list">
                {(o.items || []).map((it) => (
                  <li key={it.id} className="order-item">
                    <span className="order-item-name">{it.product_name}</span>
                    <span className="order-item-quantity">x {it.quantity}</span>
                    <span className="order-item-subtotal">฿{Number(it.subtotal).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </details>

          <details className="order-details">
            <summary>การชำระเงิน ({o.payments?.length || 0})</summary>
            <div className="order-details-content">
              <ul className="payment-list">
                {(o.payments || []).map((p) => (
                  <li key={p.id} className="payment-item">
                    <span className="payment-method">{p.payment_method}</span>
                    <span className="payment-amount">฿{Number(p.amount).toFixed(2)}</span>
                    <span className={`payment-status ${p.payment_status}`}>{p.payment_status}</span>
                  </li>
                ))}
              </ul>
            </div>
          </details>
        </div>
      ))}
    </div>
  )
}
