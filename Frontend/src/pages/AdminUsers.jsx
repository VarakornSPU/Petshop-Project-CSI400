// Frontend/src/pages/AdminUsers.jsx
import { useState, useEffect } from "react";
import { adminAPI } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import "../style/Admin.css";

export default function AdminUsers() {
  const { user: currentUser } = useAuth(); // Get current logged-in user
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
    role: "customer",
  });

  useEffect(() => {
    // Check if user is admin
    if (!currentUser || currentUser.role !== "admin") {
      setError("คุณไม่มีสิทธิ์เข้าถึงหน้านี้");
      setLoading(false);
      return;
    }
    fetchUsers();
  }, [pagination.page, search, roleFilter, currentUser]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await adminAPI.getUsers({
        page: pagination.page,
        limit: pagination.limit,
        search,
        role: roleFilter,
      });
      setUsers(data.users);
      setPagination((prev) => ({ ...prev, ...data.pagination }));
    } catch (err) {
      console.error("Fetch users error:", err);
      if (err.response?.status === 403) {
        setError(
          "คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้ กรุณา login ด้วย admin account"
        );
      } else {
        setError(err.response?.data?.error || "ไม่สามารถโหลดข้อมูลผู้ใช้ได้");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingUser(null);
    setFormData({
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      phone: "",
      role: "customer",
    });
    setShowModal(true);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: "",
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone || "",
      role: user.role,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      if (editingUser) {
        await adminAPI.updateUser(editingUser.id, formData);
        setMessage("อัปเดตผู้ใช้สำเร็จ");
      } else {
        await adminAPI.createUser(formData);
        setMessage("สร้างผู้ใช้สำเร็จ");
      }
      setShowModal(false);
      fetchUsers();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "เกิดข้อผิดพลาด");
    }
  };

  const handleDelete = async (userId) => {
    // ✅ Prevent deleting own account
    if (currentUser && userId === currentUser.id) {
      setError("⚠️ คุณไม่สามารถลบบัญชีของตัวเองได้");
      setTimeout(() => setError(""), 3000);
      return;
    }

    if (!window.confirm("คุณแน่ใจหรือไม่ที่จะลบผู้ใช้นี้?")) return;

    try {
      await adminAPI.deleteUser(userId);
      setMessage("ลบผู้ใช้สำเร็จ");
      fetchUsers();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      const errorMsg = err.response?.data?.error || "ไม่สามารถลบผู้ใช้ได้";
      const details = err.response?.data?.message || "";
      setError(`${errorMsg} ${details}`);
      setTimeout(() => setError(""), 5000);
    }
  };

  const handleBan = async (userId, isBanned) => {
    // ✅ Prevent banning own account
    if (currentUser && userId === currentUser.id) {
      setError("⚠️ คุณไม่สามารถแบนบัญชีของตัวเองได้");
      setTimeout(() => setError(""), 3000);
      return;
    }

    try {
      await adminAPI.banUser(userId, isBanned);
      setMessage(isBanned ? "แบนผู้ใช้สำเร็จ" : "ยกเลิกแบนผู้ใช้สำเร็จ");
      fetchUsers();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "เกิดข้อผิดพลาด");
    }
  };

  // Show error if not admin
  if (currentUser && currentUser.role !== "admin") {
    return (
      <div className="admin-users-page">
        <div className="admin-users-container">
          <div className="alert alert-error">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <div>คุณไม่มีสิทธิ์เข้าถึงหน้านี้</div>
              <div style={{ fontSize: "0.875rem", marginTop: "4px" }}>
                Role ปัจจุบัน: <strong>{currentUser.role}</strong> (ต้องการ:
                admin)
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-users-page">
      <div className="admin-users-container">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="titleuser">จัดการผู้ใช้</h1>
            <p className="manageacc">จัดการบัญชีผู้ใช้ในระบบ</p>
          </div>
          <button onClick={handleCreate} className="btn-create">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            เพิ่มผู้ใช้ใหม่
          </button>
        </div>

        {/* Messages */}
        {message && (
          <div className="alert alert-success">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            {message}
          </div>
        )}

        {error && (
          <div className="alert alert-error">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="filters">
          <input
            type="text"
            placeholder="ค้นหาชื่อ, อีเมล..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="role-filter"
          >
            <option value="">ทุก Role</option>
            <option value="customer">ลูกค้า</option>
            <option value="admin">ผู้ดูแลระบบ</option>
          </select>
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="loading">กำลังโหลดข้อมูล...</div>
        ) : (
          <>
            <div className="users-table">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>อีเมล</th>
                    <th>ชื่อ-นามสกุล</th>
                    <th>เบอร์โทร</th>
                    <th>Role</th>
                    <th>สถานะ</th>
                    <th>วันที่สมัคร</th>
                    <th>การจัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, index) => {
                    const isCurrentUser =
                      currentUser && user.id === currentUser.id;

                    // ✅ คำนวณลำดับที่แสดงจากหน้าและตำแหน่ง
                    const displayNumber =
                      (pagination.page - 1) * pagination.limit + index + 1;

                    return (
                      <tr
                        key={user.id}
                        className={isCurrentUser ? "current-user-row" : ""}
                      >
                        <td>
                          #{displayNumber}
                          {isCurrentUser && (
                            <span
                              style={{
                                marginLeft: "8px",
                                color: "#10b981",
                                fontSize: "0.75rem",
                              }}
                            >
                              👤 คุณ
                            </span>
                          )}
                        </td>
                        <td>{user.email}</td>
                        <td>
                          {user.first_name} {user.last_name}
                        </td>
                        <td>{user.phone || "-"}</td>
                        <td>
                          <span className={`role-badge ${user.role}`}>
                            {user.role === "admin" ? "👑 Admin" : "✨ Customer"}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`status-badge ${
                              user.is_banned ? "banned" : "active"
                            }`}
                          >
                            {user.is_banned ? "🚫 ถูกแบน" : "✅ ใช้งานได้"}
                          </span>
                        </td>
                        <td>
                          {new Date(user.created_at).toLocaleDateString(
                            "th-TH"
                          )}
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              onClick={() => handleEdit(user)}
                              className="btn-icon"
                              title="แก้ไข"
                            >
                              <svg
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={() =>
                                handleBan(user.id, !user.is_banned)
                              }
                              className="btn-icon"
                              title={
                                isCurrentUser
                                  ? "ไม่สามารถแบนตัวเองได้"
                                  : user.is_banned
                                  ? "ยกเลิกแบน"
                                  : "แบน"
                              }
                              disabled={isCurrentUser}
                              style={
                                isCurrentUser
                                  ? { opacity: 0.5, cursor: "not-allowed" }
                                  : {}
                              }
                            >
                              {user.is_banned ? "✅" : "🚫"}
                            </button>
                            <button
                              onClick={() => handleDelete(user.id)}
                              className="btn-icon btn-delete"
                              title={
                                isCurrentUser ? "ไม่สามารถลบตัวเองได้" : "ลบ"
                              }
                              disabled={isCurrentUser}
                              style={
                                isCurrentUser
                                  ? { opacity: 0.5, cursor: "not-allowed" }
                                  : {}
                              }
                            >
                              <svg
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="pagination">
              <button
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                }
                disabled={pagination.page === 1}
                className="btn-page"
              >
                ← ก่อนหน้า
              </button>
              <span>
                หน้า {pagination.page} จาก {pagination.pages}
              </span>
              <button
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                }
                disabled={pagination.page === pagination.pages}
                className="btn-page"
              >
                ถัดไป →
              </button>
            </div>
          </>
        )}

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h2>{editingUser ? "แก้ไขผู้ใช้" : "เพิ่มผู้ใช้ใหม่"}</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="btn-close"
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleSubmit} className="modal-form">
                <div className="form-group">
                  <label>อีเมล *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    disabled={!!editingUser}
                    required
                  />
                </div>

                {!editingUser && (
                  <div className="form-group">
                    <label>รหัสผ่าน *</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      required
                      minLength={8}
                    />
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label>ชื่อ *</label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData({ ...formData, firstName: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>นามสกุล *</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>เบอร์โทร</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                    required
                    disabled={
                      editingUser &&
                      currentUser &&
                      editingUser.id === currentUser.id
                    }
                    title={
                      editingUser &&
                      currentUser &&
                      editingUser.id === currentUser.id
                        ? "คุณไม่สามารถเปลี่ยน Role ของตัวเองได้"
                        : ""
                    }
                    style={
                      editingUser &&
                      currentUser &&
                      editingUser.id === currentUser.id
                        ? {
                            opacity: 0.6,
                            cursor: "not-allowed",
                            backgroundColor: "#f3f4f6",
                          }
                        : {}
                    }
                  >
                    <option value="customer">ลูกค้า</option>
                    <option value="admin">ผู้ดูแลระบบ</option>
                  </select>
                  {editingUser &&
                    currentUser &&
                    editingUser.id === currentUser.id && (
                      <small
                        style={{
                          color: "#f59e0b",
                          fontSize: "0.875rem",
                          marginTop: "4px",
                          display: "block",
                        }}
                      >
                        ⚠️ คุณไม่สามารถเปลี่ยน Role ของตัวเองได้
                      </small>
                    )}
                </div>

                <div className="modal-actions">
                  <button type="submit" className="btn-save">
                    {editingUser ? "บันทึก" : "สร้าง"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn-cancel"
                  >
                    ยกเลิก
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
