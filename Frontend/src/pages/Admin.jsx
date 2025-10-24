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
  const [productsList, setProductsList] = useState(products);
  const [editingProduct, setEditingProduct] = useState(null);

  // ✅ Popup ลบสินค้า
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  // ✅ เพิ่มสินค้าใหม่
  function handleAddProduct(formData) {
    const newProduct = {
      id: productsList.length + 1,
      name: formData.get("name"),
      description: formData.get("description"),
      category: formData.get("category"),
      price: parseFloat(formData.get("price")),
      stock: parseInt(formData.get("stock")),
      rating: 5.0,
      icon: "📦",
    };
    setProductsList([...productsList, newProduct]);
    setShowForm(false);
  }

  // ✅ แก้ไขสินค้า
  function handleEditProduct(product) {
    setEditingProduct(product);
    setShowForm(true);
  }

  function handleUpdateProduct(formData) {
    const updatedProduct = {
      ...editingProduct,
      name: formData.get("name"),
      description: formData.get("description"),
      category: formData.get("category"),
      price: parseFloat(formData.get("price")),
      stock: parseInt(formData.get("stock")),
    };

    setProductsList((prev) =>
      prev.map((p) => (p.id === editingProduct.id ? updatedProduct : p))
    );
    setEditingProduct(null);
    setShowForm(false);
  }

  // ✅ Popup ลบสินค้า
  function confirmDeleteProduct(product) {
    setProductToDelete(product);
    setShowDeleteModal(true);
  }

  function handleDeleteConfirmed() {
    if (productToDelete) {
      setProductsList((prev) => prev.filter((p) => p.id !== productToDelete.id));
      setShowDeleteModal(false);
      setProductToDelete(null);
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
                {productsList.map((product) => (
                  <tr key={product.id}>
                    <td><div className="product-image-cell">{product.icon}</div></td>
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
          </div>

          {/* ✅ Popup ยืนยันการลบ */}
          {showDeleteModal && (
            <div className="delete-modal-overlay">
              <div className="delete-modal">
                <h3>🗑️ ยืนยันการลบสินค้า</h3>
                <p>
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
