// Frontend/src/pages/Admin.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { products } from "../data/products";
import AddProductForm from "../components/AddProductForm";
import "../style/Admin.css";

export default function Admin() {
  const [stats] = useState({
    totalProducts: products.length,
    totalOrders: 156,
    totalRevenue: 245680,
    totalCustomers: 89,
  });

  const [orders] = useState([
    { id: 1, customer: "สมชาย ใจดี", date: "2025-01-15", total: 2890, status: "completed" },
    { id: 2, customer: "สมหญิง รักสัตว์", date: "2025-01-15", total: 1590, status: "pending" },
    { id: 3, customer: "วิชัย มีสุข", date: "2025-01-14", total: 4280, status: "completed" },
    { id: 4, customer: "นภา ใจงาม", date: "2025-01-14", total: 890, status: "shipping" },
    { id: 5, customer: "ประยุทธ์ รักหมา", date: "2025-01-13", total: 3490, status: "completed" },
  ]);

  const [activeTab, setActiveTab] = useState("overview");
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>🐾 Admin Dashboard</h1>
        <p>จัดการร้านค้าสัตว์เลี้ยงของคุณ</p>
      </div>

      <div className="admin-tabs">
        <button
          className={activeTab === "overview" ? "tab-btn active" : "tab-btn"}
          onClick={() => setActiveTab("overview")}
        >
          ภาพรวม
        </button>
        <button
          className={activeTab === "products" ? "tab-btn active" : "tab-btn"}
          onClick={() => setActiveTab("products")}
        >
          สินค้า
        </button>
        <button
          className={activeTab === "orders" ? "tab-btn active" : "tab-btn"}
          onClick={() => setActiveTab("orders")}
        >
          คำสั่งซื้อ
        </button>
        <Link to="/admin/users" className="tab-btn">
          จัดการผู้ใช้
        </Link>
      </div>

      {activeTab === "overview" && (
        <div className="admin-content">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📦</div>
              <div className="stat-info">
                <h3>{stats.totalProducts}</h3>
                <p>สินค้าทั้งหมด</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🛒</div>
              <div className="stat-info">
                <h3>{stats.totalOrders}</h3>
                <p>คำสั่งซื้อ</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <div className="stat-info">
                <h3>฿{stats.totalRevenue.toLocaleString()}</h3>
                <p>รายได้ทั้งหมด</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-info">
                <h3>{stats.totalCustomers}</h3>
                <p>ลูกค้า</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="quick-actions">
            <h2>การจัดการด่วน</h2>
            <div className="action-cards">
              <Link to="/admin/users" className="action-card">
                <div className="action-icon">👥</div>
                <h3>จัดการผู้ใช้</h3>
                <p>เพิ่ม แก้ไข และจัดการบัญชีผู้ใช้</p>
              </Link>
              <button onClick={() => setActiveTab("products")} className="action-card">
                <div className="action-icon">📦</div>
                <h3>จัดการสินค้า</h3>
                <p>เพิ่มหรือแก้ไขสินค้าในร้าน</p>
              </button>
              <button onClick={() => setActiveTab("orders")} className="action-card">
                <div className="action-icon">📋</div>
                <h3>ดูคำสั่งซื้อ</h3>
                <p>ตรวจสอบและจัดการคำสั่งซื้อ</p>
              </button>
            </div>
          </div>

          <div className="recent-orders">
            <h2>คำสั่งซื้อล่าสุด</h2>
            <div className="orders-table">
              <table>
                <thead>
                  <tr>
                    <th>รหัส</th>
                    <th>ลูกค้า</th>
                    <th>วันที่</th>
                    <th>ยอดรวม</th>
                    <th>สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 5).map((order) => (
                    <tr key={order.id}>
                      <td>#{order.id}</td>
                      <td>{order.customer}</td>
                      <td>{order.date}</td>
                      <td>฿{order.total.toLocaleString()}</td>
                      <td>
                        <span className={`status-badge ${order.status}`}>
                          {order.status === "completed" && "สำเร็จ"}
                          {order.status === "pending" && "รอดำเนินการ"}
                          {order.status === "shipping" && "กำลังจัดส่ง"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "products" && (
        <div className="admin-content">
          <div className="products-header">
            <h2>จัดการสินค้า</h2>
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              + เพิ่มสินค้าใหม่
            </button>
            {showForm && <AddProductForm onClose={() => setShowForm(false)} />}
          </div>
          <div className="products-table">
            <table>
              <thead>
                <tr>
                  <th>รูปภาพ</th>
                  <th>ชื่อสินค้า</th>
                  <th>หมวดหมู่</th>
                  <th>ราคา</th>
                  <th>คะแนน</th>
                  <th>การจัดการ</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div className="product-image-cell">{product.icon}</div>
                    </td>
                    <td>{product.name}</td>
                    <td>
                      <span className="category-badge">
                        {product.category === "food" && "อาหาร"}
                        {product.category === "toys" && "ของเล่น"}
                        {product.category === "accessories" && "อุปกรณ์"}
                      </span>
                    </td>
                    <td>฿{product.price.toLocaleString()}</td>
                    <td>⭐ {product.rating}</td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-edit">แก้ไข</button>
                        <button className="btn-delete">ลบ</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "orders" && (
        <div className="admin-content">
          <h2>คำสั่งซื้อทั้งหมด</h2>
          <div className="orders-table">
            <table>
              <thead>
                <tr>
                  <th>รหัส</th>
                  <th>ลูกค้า</th>
                  <th>วันที่</th>
                  <th>ยอดรวม</th>
                  <th>สถานะ</th>
                  <th>การจัดการ</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>#{order.id}</td>
                    <td>{order.customer}</td>
                    <td>{order.date}</td>
                    <td>฿{order.total.toLocaleString()}</td>
                    <td>
                      <span className={`status-badge ${order.status}`}>
                        {order.status === "completed" && "สำเร็จ"}
                        {order.status === "pending" && "รอดำเนินการ"}
                        {order.status === "shipping" && "กำลังจัดส่ง"}
                      </span>
                    </td>
                    <td>
                      <button className="btn-view">ดูรายละเอียด</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}