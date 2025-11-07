import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AddProductForm from "../components/AddProductForm";
import { useAuth } from "../context/AuthContext";
import "../style/Admin.css";

const API_URL = "http://localhost:3001/api/admin/products";

export default function Admin() {
  const { token } = useAuth();
  const [productsList, setProductsList] = useState([]);
  const [stats, setStats] = useState({ totalProducts: 0, totalOrders: 0, totalRevenue: 0, totalCustomers: 0 });

  const [orders, setOrders] = useState([]);

  const [activeTab, setActiveTab] = useState("overview");
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [loading, setLoading] = useState(false);

  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [statusChanging, setStatusChanging] = useState(false);

  // ✅ โหลดข้อมูลจาก backend
  useEffect(() => {
    if (!token) return;
    setLoading(true);
    // fetch in parallel
    Promise.all([fetchProducts(), fetchOrders()]).finally(() => setLoading(false));
  }, [token]);

  // --- เพิ่มฟังก์ชันดึงคำสั่งซื้อจาก backend ---
  async function fetchOrders() {
    try {
      // เรียก endpoint สำหรับ admin โดยเฉพาะ
      const res = await fetch("http://localhost:3001/api/orders/admin", {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error("ไม่สามารถโหลดคำสั่งซื้อได้");
      const data = await res.json();
      const ordersList = data.orders || [];

      setOrders(ordersList);
      const totalOrders = ordersList.length;
      const totalRevenue = ordersList.reduce((s, o) => s + Number(o.total || 0), 0);

      const ids = ordersList
        .map(o => o.user_id || o.userId || (o.user && o.user.id) || null)
        .filter(id => id !== null && id !== undefined);
      let uniqueCustomers = new Set(ids).size;

      if (uniqueCustomers === 0) {
        const names = ordersList
          .map(o => (o.customer || `${o.first_name || ""} ${o.last_name || ""}`).trim())
          .filter(name => name);
        uniqueCustomers = new Set(names).size;
      }

      setStats(prev => ({
        ...prev,
        totalOrders,
        totalRevenue,
        totalCustomers: uniqueCustomers
      }));
    } catch (err) {
      console.error("❌ โหลดคำสั่งซื้อไม่สำเร็จ:", err);
    }
  }

  async function openOrderModal(orderId) {
    if (!orderId) return;
    setOrderLoading(true);
    setShowOrderModal(true);
    setSelectedOrder(null);
    try {
      const res = await fetch(`http://localhost:3001/api/orders/${orderId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error("ไม่สามารถโหลดรายละเอียดคำสั่งซื้อได้");
      const data = await res.json();
      const sel = data.order || data;

      // ensure order has created_at_local/date like list endpoint
      sel.created_at_local = sel.created_at_local || sel.date || sel.created_at || null;
      sel.date = sel.created_at_local || sel.date || sel.created_at || null;

      // normalize payments timestamps (use created_at_local if backend provides, else payment_date or created_at)
      sel.payments = (sel.payments || []).map(p => ({
        ...p,
        created_at_local: p.created_at_local || p.payment_date || p.created_at || null
      }));

      setSelectedOrder(sel);
    } catch (err) {
      console.error("โหลดรายละเอียดคำสั่งซื้อผิดพลาด:", err);
      setSelectedOrder({ error: "ไม่สามารถโหลดรายละเอียดได้" });
    } finally {
      setOrderLoading(false);
    }
  }

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

  // --- เพิ่ม helper แปลง status เป็นข้อความและคลาส ---
  function getStatusLabel(status) {
    const s = (status || "").toString().toLowerCase();
    switch (s) {
      case "pending": return { label: "รอดำเนินการ", cls: "pending" };
      case "confirmed": return { label: "ชำระแล้ว", cls: "confirmed" }; // payment success
      case "completed": return { label: "สำเร็จ", cls: "completed" };
      case "shipping": return { label: "กำลังจัดส่ง", cls: "shipping" };
      case "cancelled":
      case "canceled": return { label: "ยกเลิก", cls: "cancelled" };
      case "refunded": return { label: "คืนเงิน", cls: "refunded" };
      default: return { label: status || "ไม่ระบุ", cls: "unknown" };
    }
  }

  function formatOrderDate(o) {
    const raw = o?.created_at_local || o?.date || o?.created_at;
    if (!raw) return "";
    // handle "YYYY-MM-DD HH:MM:SS" (created_at_local from DB)
    const mysqlLike = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
    try {
      let d;
      if (mysqlLike.test(raw)) {
        // treat as Bangkok local time, create ISO with +07:00 offset
        d = new Date(raw.replace(" ", "T") + "+07:00");
      } else {
        // fallback: let Date parse (ISO with timezone or UTC string)
        d = new Date(raw);
      }
      if (Number.isNaN(d.getTime())) return String(raw);
      return new Intl.DateTimeFormat("th-TH", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Asia/Bangkok"
      }).format(d);
    } catch (e) {
      return String(raw);
    }
  }

  // --- เพิ่ม helper แปลง timestamp ของ payment ให้เป็นเวลาไทย ---
  function formatTimestamp(raw) {
    if (!raw) return "";
    const mysqlLike = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
    try {
      let d;
      if (mysqlLike.test(raw)) {
        d = new Date(raw.replace(" ", "T") + "+07:00");
      } else {
        d = new Date(raw);
      }
      if (Number.isNaN(d.getTime())) return String(raw);
      return new Intl.DateTimeFormat("th-TH", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Asia/Bangkok"
      }).format(d);
    } catch (e) {
      return String(raw);
    }
  }

  async function openOrderModal(orderId) {
    if (!orderId) return;
    setOrderLoading(true);
    setShowOrderModal(true);
    setSelectedOrder(null);
    try {
      const res = await fetch(`http://localhost:3001/api/orders/${orderId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error("ไม่สามารถโหลดรายละเอียดคำสั่งซื้อได้");
      const data = await res.json();
      const sel = data.order || data;

      // normalize payments timestamps (use created_at_local if backend provides, else created_at/payment_date)
      sel.payments = (sel.payments || []).map(p => ({
        ...p,
        created_at_local: p.created_at_local || p.payment_date || p.created_at
      }));

      setSelectedOrder(sel);
    } catch (err) {
      console.error("โหลดรายละเอียดคำสั่งซื้อผิดพลาด:", err);
      setSelectedOrder({ error: "ไม่สามารถโหลดรายละเอียดได้" });
    } finally {
      setOrderLoading(false);
    }
  }

  function getCustomerName(o) {
    if (!o) return "";
    // prefer explicit customer field from backend
    if (o.customer) return o.customer;
    // try nested user object
    if (o.user && (o.user.first_name || o.user.last_name)) {
      return `${(o.user.first_name || "").trim()} ${(o.user.last_name || "").trim()}`.trim();
    }
    // try top-level fields
    if (o.first_name || o.last_name) return `${(o.first_name || "").trim()} ${(o.last_name || "").trim()}`.trim();
    // fallback to email if available
    if (o.email) return o.email;
    return `user#${o.user_id || o.userId || "?"}`;
  }

  const orderStatuses = [
    { value: "pending", label: "รอดำเนินการ" },
    { value: "confirmed", label: "ชำระแล้ว" },
    { value: "shipping", label: "กำลังจัดส่ง" },
    { value: "completed", label: "สำเร็จ" },
    { value: "cancelled", label: "ยกเลิก" },
    { value: "refunded", label: "คืนเงิน" },
  ];

  async function updateOrderStatus(orderId, newStatus) {
    if (!orderId || !newStatus) return;
    setStatusChanging(true);
    try {
      const res = await fetch(`http://localhost:3001/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "ไม่สามารถเปลี่ยนสถานะได้");
      }
      const data = await res.json();
      const updated = data.order || data;

      // update modal and list
      setSelectedOrder(updated);
      setOrders(prev => prev.map(o => (o.id === updated.id ? updated : o)));
    } catch (e) {
      console.error("Update status failed", e);
      alert(e.message || "Update failed");
    } finally {
      setStatusChanging(false);
    }
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
                    <td>{getCustomerName(order)}</td>
                    <td>{formatOrderDate(order)}</td>
                    <td>฿{order.total.toLocaleString()}</td>
                    <td>
                      {(() => {
                        const s = getStatusLabel(order.status);
                        return (
                          <span className={`status-badge ${s.cls}`}>
                            {s.label}
                          </span>
                        );
                      })()}
                    </td>
                    <td>
                      <button className="btn-view" onClick={() => openOrderModal(order.id)}>ดูรายละเอียด</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order detail modal */}
      {showOrderModal && (
        <div className="order-modal-overlay" onClick={() => setShowOrderModal(false)}>
          <div className="order-modal" onClick={(e) => e.stopPropagation()}>
            <div className="order-modal-header">
              <h3>รายละเอียดคำสั่งซื้อ {selectedOrder ? `#${selectedOrder.id}` : ""}</h3>
              <button className="modal-close" onClick={() => setShowOrderModal(false)}>&times;</button>
            </div>

            <div className="order-modal-body">
              {orderLoading && <div className="modal-loading">กำลังโหลด...</div>}

              {!orderLoading && selectedOrder && selectedOrder.error && (
                <div className="modal-error">{selectedOrder.error}</div>
              )}

              {!orderLoading && selectedOrder && !selectedOrder.error && (
                <>
                  <div className="order-meta">
                    <div className="meta-item"><strong>ลูกค้า:</strong> {getCustomerName(selectedOrder)}</div>
                    <div className="meta-item"><strong>วันที่:</strong> {formatOrderDate(selectedOrder)}</div>
                    <div className="meta-item"><strong>สถานะ:</strong>
                      <span className={`status-badge ${getStatusLabel(selectedOrder?.status).cls}`} style={{ marginLeft: 8 }}>
                        {getStatusLabel(selectedOrder?.status).label}
                      </span>
                    </div>
                    <div className="meta-item"><strong>ยอดรวม:</strong> ฿{Number(selectedOrder?.total || 0).toLocaleString()}</div>
                  </div>

                  <hr />

                  <div className="order-section">
                    <h4>รายการสินค้า</h4>
                    <ul className="order-items">
                      {(selectedOrder.items || []).map(it => (
                        <li key={it.id} className="order-item">
                          <div className="oi-left">
                            <div className="oi-name">{it.product_name}</div>
                            <div className="oi-meta">จำนวน: {it.quantity} × ฿{Number(it.product_price || it.price || 0).toFixed(2)}</div>
                          </div>
                          <div className="oi-right">฿{Number(it.subtotal || (it.product_price * it.quantity) || 0).toFixed(2)}</div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="order-section">
                    <h4>ข้อมูลจัดส่ง</h4>
                    <div className="shipping">
                      <div>{(selectedOrder.shipping_recipient_name || selectedOrder.shipping?.name || selectedOrder.shipping?.recipientName) || "-"}</div>
                      <div>{(selectedOrder.shipping_phone || selectedOrder.shipping?.phone) || "-"}</div>
                      <div>
                        {(selectedOrder.shipping_address_line1 || selectedOrder.shipping?.line1 || selectedOrder.shipping?.addressLine1) || "-"}{" "}
                        {(selectedOrder.shipping_address_line2 || selectedOrder.shipping?.address_line2 || selectedOrder.shipping?.addressLine2) || ""}
                      </div>
                      <div>{(selectedOrder.shipping_subdistrict || selectedOrder.shipping?.subdistrict) || ""} {(selectedOrder.shipping_district || selectedOrder.shipping?.district) || ""} {(selectedOrder.shipping_province || selectedOrder.shipping?.province) || ""} {(selectedOrder.shipping_postal_code || selectedOrder.shipping?.postal_code) || ""}</div>
                    </div>
                  </div>

                  <div className="order-section">
                    <h4>การชำระเงิน</h4>
                    <ul className="payments-list">
                      {(selectedOrder.payments || []).map(p => (
                        <li key={p.id}>
                          <div style={{ fontSize: 12, color: "#666" }}>
                            {p.payment_status} — {formatTimestamp(p.created_at_local || p.payment_date || p.created_at)}
                          </div>
                        </li>
                      ))}
                      {(selectedOrder.payments || []).length === 0 && <li>ยังไม่มีรายการชำระเงิน</li>}
                    </ul>
                  </div>

                  <div className="order-actions" style={{ alignItems: "center" }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <select
                        value={selectedOrder?.status || ""}
                        onChange={(e) => setSelectedOrder(prev => ({ ...prev, status: e.target.value }))}
                        style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #e6e9ef" }}
                      >
                        {orderStatuses.map(s => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                      <button
                        className="btn btn-primary"
                        onClick={() => updateOrderStatus(selectedOrder.id, selectedOrder.status)}
                        disabled={statusChanging}
                      >
                        {statusChanging ? "กำลังบันทึก..." : "บันทึกสถานะ"}
                      </button>
                    </div>

                    <div style={{ marginLeft: 12 }}>
                      <button className="btn" onClick={() => setShowOrderModal(false)}>ปิด</button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}