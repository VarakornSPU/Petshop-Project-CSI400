import { useState } from "react";
import { Link } from "react-router-dom";
import AddProductForm from "../components/AddProductForm";
import "../style/Admin.css";

const API_URL = "http://localhost:3001/api/admin/products";

export default function Admin() {
  const [productsList, setProductsList] = useState([]);
  const [stats, setStats] = useState({
    totalProducts: 0,
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
  const [editingProduct, setEditingProduct] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [loading, setLoading] = useState(false);

  // ✅ โหลดข้อมูลจาก backend
  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error("ไม่สามารถโหลดข้อมูลได้");
      
      const data = await res.json();
      setProductsList(data);
      setStats(prev => ({
        ...prev,
        totalProducts: data.length
      }));
    } catch (err) {
      console.error("❌ โหลดข้อมูลสินค้าไม่สำเร็จ:", err);
      alert("ไม่สามารถโหลดข้อมูลสินค้าได้");
    } finally {
      setLoading(false);
    }
  }

  // ✅ เพิ่มสินค้าใหม่
  async function handleAddProduct(formData) {
    setLoading(true);
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (!res.ok) throw new Error(result.message || "เพิ่มสินค้าไม่สำเร็จ");

      setProductsList(prev => [...prev, result.product]);
      setStats(prev => ({
        ...prev,
        totalProducts: prev.totalProducts + 1
      }));
      setShowForm(false);
      alert("✅ เพิ่มสินค้าสำเร็จ!");
    } catch (err) {
      console.error("❌ เกิดข้อผิดพลาด:", err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ✅ แก้ไขสินค้า
  function handleEditProduct(product) {
    setEditingProduct(product);
    setShowForm(true);
  }

  async function handleUpdateProduct(formData) {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/${editingProduct.id}`, {
        method: "PUT",
        body: formData,
      });

      const result = await res.json();

      if (!res.ok) throw new Error(result.message || "แก้ไขสินค้าไม่สำเร็จ");

      setProductsList(prev =>
        prev.map(p => (p.id === editingProduct.id ? result.product : p))
      );
      setEditingProduct(null);
      setShowForm(false);
      alert("✅ แก้ไขสินค้าสำเร็จ!");
    } catch (err) {
      console.error("❌ เกิดข้อผิดพลาด:", err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ✅ ลบสินค้า
  function confirmDeleteProduct(product) {
    setProductToDelete(product);
    setShowDeleteModal(true);
  }

  async function handleDeleteConfirmed() {
    if (!productToDelete) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/${productToDelete.id}`, {
        method: "DELETE",
      });

      const result = await res.json();

      if (!res.ok) throw new Error(result.message || "ลบสินค้าไม่สำเร็จ");

      setProductsList(prev => prev.filter(p => p.id !== productToDelete.id));
      setStats(prev => ({
        ...prev,
        totalProducts: prev.totalProducts - 1
      }));
      setShowDeleteModal(false);
      setProductToDelete(null);
      alert("✅ ลบสินค้าสำเร็จ!");
    } catch (err) {
      console.error("❌ เกิดข้อผิดพลาด:", err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleCancelDelete() {
    setShowDeleteModal(false);
    setProductToDelete(null);
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>🐾 Admin Dashboard</h1>
        <p>จัดการร้านค้าสัตว์เลี้ยงของคุณ</p>
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div style={{ 
          position: "fixed", 
          top: "50%", 
          left: "50%", 
          transform: "translate(-50%, -50%)",
          background: "rgba(0,0,0,0.8)",
          color: "white",
          padding: "20px 40px",
          borderRadius: "10px",
          zIndex: 9999
        }}>
          กำลังโหลด...
        </div>
      )}

      {/* ---------------- Tabs ---------------- */}
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

      {/* ---------------- ภาพรวม ---------------- */}
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
        </div>
      )}

      {/* ---------------- สินค้า ---------------- */}
      {activeTab === "products" && (
        <div className="admin-content">
          <div className="products-header">
            <h2>จัดการสินค้า</h2>
            <button
              className="btn btn-primary"
              onClick={() => {
                setEditingProduct(null);
                setShowForm(true);
              }}
            >
              + เพิ่มสินค้าใหม่
            </button>
          </div>

          {showForm && (
            <AddProductForm
              onSubmit={editingProduct ? handleUpdateProduct : handleAddProduct}
              onClose={() => {
                setShowForm(false);
                setEditingProduct(null);
              }}
              initialData={editingProduct}
            />
          )}

          <div className="products-table">
            {productsList.length === 0 ? (
              <p style={{ textAlign: "center", padding: "40px" }}>
                ยังไม่มีสินค้าในระบบ
              </p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>รูปภาพ</th>
                    <th>ชื่อสินค้า</th>
                    <th>หมวดหมู่</th>
                    <th>ราคา</th>
                    <th>คงเหลือ</th>
                    <th>คะแนน</th>
                    <th>การจัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {productsList.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <div className="product-image-cell">
                          {product.images && product.images.length > 0 ? (
                            <img 
                              src={`http://localhost:3001${product.images[0]}`} 
                              alt={product.name}
                              style={{ width: "50px", height: "50px", objectFit: "cover", borderRadius: "5px" }}
                            />
                          ) : (
                            "📦"
                          )}
                        </div>
                      </td>
                      <td>{product.name}</td>
                      <td>
                        <span className="category-badge">
                          {product.category === "food" && "อาหาร"}
                          {product.category === "toys" && "ของเล่น"}
                          {product.category === "accessories" && "อุปกรณ์"}
                          {product.category !== "food" && product.category !== "toys" && product.category !== "accessories" && product.category}
                        </span>
                      </td>
                      <td>฿{product.price?.toLocaleString()}</td>
                      <td>{product.stock}</td>
                      <td>⭐ {product.rating || 0}</td>
                      <td>
                        <div className="action-buttons">
                          <button className="btn-edit" onClick={() => handleEditProduct(product)}>
                            แก้ไข
                          </button>
                          <button className="btn-delete" onClick={() => confirmDeleteProduct(product)}>
                            ลบ
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* ✅ Popup ยืนยันการลบ */}
          {showDeleteModal && (
            <div className="delete-modal-overlay">
            <div className="delete-modal">
              <div className="delete-modal-header">
                <h3>🗑️ ยืนยันการลบสินค้า</h3>
                <button className="btn-close" onClick={handleCancelDelete}>
                  &times;
                </button>
              </div>
              <p className="delete-modal-text">
                คุณต้องการลบ <b>{productToDelete?.name}</b> ออกจากระบบหรือไม่?
              </p>
              <div className="delete-modal-actions">
                <button className="btn-confirm" onClick={handleDeleteConfirmed}>
                  ยืนยันการลบ
                </button>
                <button className="btn-cancel" onClick={handleCancelDelete}>
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
          )}
        </div>
      )}

      {/* ---------------- คำสั่งซื้อ ---------------- */}
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