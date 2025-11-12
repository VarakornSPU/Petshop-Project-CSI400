// Frontend/src/pages/Profile.jsx
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { authAPI, userAccountAPI } from "../utils/api";
import { useNavigate } from "react-router-dom";
import "../style/Profile.css";
import DeleteAccountModal from "../components/DeleteAccountModal";

export default function Profile() {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  //  Delete Account State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [canDelete, setCanDelete] = useState(true);
  const [activeOrders, setActiveOrders] = useState(0);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
  });

  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || user.first_name || "",
        lastName: user.lastName || user.last_name || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    }
  }, [user]);

  //  Check if user can delete account
  const checkDeleteEligibility = async () => {
    try {
      const data = await userAccountAPI.canDelete();
      setCanDelete(data.canDelete);
      setActiveOrders(data.activeOrders || 0);
    } catch (err) {
      console.error("Check delete eligibility error:", err);
    }
  };

  const handleProfileChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await authAPI.updateProfile(profileData);

      // Update local storage with new user data
      const updatedUser = {
        ...user,
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        phone: profileData.phone,
      };
      localStorage.setItem("user", JSON.stringify(updatedUser));

      // Re-login to update context
      await login({ email: user.email, skipPasswordCheck: true });

      setMessage("อัปเดตโปรไฟล์สำเร็จ");
      setIsEditing(false);
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "เกิดข้อผิดพลาดในการอัปเดตโปรไฟล์");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("รหัสผ่านใหม่ไม่ตรงกัน");
      setLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setError("รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร");
      setLoading(false);
      return;
    }

    if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(passwordData.newPassword)) {
      setError("รหัสผ่านต้องประกอบด้วยตัวอักษรและตัวเลข");
      setLoading(false);
      return;
    }

    try {
      await authAPI.changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );
      setMessage("เปลี่ยนรหัสผ่านสำเร็จ");
      setIsChangingPassword(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setError(
        err.response?.data?.error || "เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setProfileData({
      firstName: user?.firstName || user?.first_name || "",
      lastName: user?.lastName || user?.last_name || "",
      email: user?.email || "",
      phone: user?.phone || "",
    });
    setError("");
  };

  const handleCancelPasswordChange = () => {
    setIsChangingPassword(false);
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setError("");
  };

  //  Handle Delete Account
  const handleOpenDeleteModal = async () => {
    await checkDeleteEligibility();
    setShowDeleteModal(true);
  };

  const handleDeleteAccount = async (password, reason) => {
    setDeleteLoading(true);
    setError("");

    try {
      await userAccountAPI.requestDelete(password, reason);
      setShowDeleteModal(false);
      
      // ลบบัญชีสำเร็จ - ทำ logout และเด้งไปหน้า login
      alert("ลบบัญชีสำเร็จ คุณจะถูกนำออกจากระบบ");
      logout();
      navigate("/login", { replace: true });
    } catch (err) {
      const errorMsg =
        err.response?.data?.error || "เกิดข้อผิดพลาดในการลบบัญชี";
      const details = err.response?.data?.message || "";
      setError(`${errorMsg} ${details}`);
      setTimeout(() => setError(""), 5000);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        {/* Header */}
        <div className="profile-header">
          <div className="profile-avatar">
            <span>
              {user?.firstName?.charAt(0) || user?.first_name?.charAt(0) || "U"}
            </span>
          </div>
          <div className="profile-header-info">
            <h1>
              {user?.firstName || user?.first_name}{" "}
              {user?.lastName || user?.last_name}
            </h1>
            <p className="profile-role">
              {user?.role === "admin" ? "👑 ผู้ดูแลระบบ" : "✨ สมาชิก"}
            </p>
          </div>
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
            <span>{message}</span>
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
            <span>{error}</span>
          </div>
        )}

        {/* Profile Information */}
        <div className="profile-card">
          <div className="card-header">
            <h2>ข้อมูลส่วนตัว</h2>
            {!isEditing && (
              <button onClick={() => setIsEditing(true)} className="btn-edit">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                แก้ไข
              </button>
            )}
          </div>

          {isEditing ? (
            <form onSubmit={handleProfileSubmit} className="profile-form">
              <div className="form-row">
                <div className="form-group">
                  <label>ชื่อ</label>
                  <input
                    type="text"
                    name="firstName"
                    value={profileData.firstName}
                    onChange={handleProfileChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>นามสกุล</label>
                  <input
                    type="text"
                    name="lastName"
                    value={profileData.lastName}
                    onChange={handleProfileChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>อีเมล</label>
                <input
                  type="email"
                  name="email"
                  value={profileData.email}
                  onChange={handleProfileChange}
                  required
                  disabled
                />
                <small>ไม่สามารถเปลี่ยนอีเมลได้</small>
              </div>

              <div className="form-group">
                <label>เบอร์โทรศัพท์</label>
                <input
                  type="tel"
                  name="phone"
                  value={profileData.phone}
                  onChange={handleProfileChange}
                  placeholder="08X-XXX-XXXX"
                />
              </div>

              <div className="form-actions">
                <button type="submit" disabled={loading} className="btn-save">
                  {loading ? "กำลังบันทึก..." : "บันทึก"}
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="btn-cancel"
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          ) : (
            <div className="profile-info">
              <div className="info-item">
                <label>ชื่อ-นามสกุล</label>
                <p>
                  {user?.firstName || user?.first_name}{" "}
                  {user?.lastName || user?.last_name}
                </p>
              </div>
              <div className="info-item">
                <label>อีเมล</label>
                <p>{user?.email}</p>
              </div>
              <div className="info-item">
                <label>เบอร์โทรศัพท์</label>
                <p>{profileData.phone || "ยังไม่ระบุ"}</p>
              </div>
              <div className="info-item">
                <label>สถานะ</label>
                <p>{user?.role === "admin" ? "ผู้ดูแลระบบ" : "สมาชิก"}</p>
              </div>
            </div>
          )}
        </div>

        {/* Change Password */}
        <div className="profile-card">
          <div className="card-header">
            <h2>เปลี่ยนรหัสผ่าน</h2>
            {!isChangingPassword && (
              <button
                onClick={() => setIsChangingPassword(true)}
                className="btn-edit"
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                  />
                </svg>
                เปลี่ยนรหัสผ่าน
              </button>
            )}
          </div>

          {isChangingPassword && (
            <form onSubmit={handlePasswordSubmit} className="profile-form">
              <div className="form-group">
                <label>รหัสผ่านปัจจุบัน</label>
                <div className="password-input">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>รหัสผ่านใหม่</label>
                <div className="password-input">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? "🙈" : "👁️"}
                  </button>
                </div>
                <small>อย่างน้อย 8 ตัวอักษร ประกอบด้วยตัวอักษรและตัวเลข</small>
              </div>

              <div className="form-group">
                <label>ยืนยันรหัสผ่านใหม่</label>
                <div className="password-input">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" disabled={loading} className="btn-save">
                  {loading ? "กำลังเปลี่ยน..." : "เปลี่ยนรหัสผ่าน"}
                </button>
                <button
                  type="button"
                  onClick={handleCancelPasswordChange}
                  className="btn-cancel"
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Delete Account Section */}
        <div className="profile-card danger-zone">
          <div className="profile-card-header">
            <h2>⚠️ Danger Zone</h2>
          </div>
          <div className="danger-zone-content">
            <div>
              <h3>ลบบัญชี</h3>
              <p>การดำเนินการนี้ไม่สามารถย้อนกลับได้ กรุณาพิจารณาอย่างรอบคอบ</p>
            </div>
            <button
              onClick={handleOpenDeleteModal}
              className="btn-delete-account"
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              ลบบัญชี
            </button>
          </div>
        </div>
      </div>

      {/* ✅ Delete Account Modal */}
      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAccount}
        loading={deleteLoading}
        canDelete={canDelete}
        activeOrders={activeOrders}
      />
    </div>
  );
}