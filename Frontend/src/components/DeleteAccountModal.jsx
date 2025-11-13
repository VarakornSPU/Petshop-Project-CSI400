// Frontend/src/components/DeleteAccountModal.jsx
import { useState } from 'react';
import '../style/DeleteAccountModal.css';

export default function DeleteAccountModal({ isOpen, onClose, onConfirm, loading, canDelete, activeOrders }) {
  const [password, setPassword] = useState('');
  const [reason, setReason] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!password.trim()) {
      alert('กรุณาใส่รหัสผ่านเพื่อยืนยัน');
      return;
    }

    onConfirm(password, reason);
  };

  const handleClose = () => {
    setPassword('');
    setReason('');
    setShowPassword(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="delete-account-modal-overlay" onClick={handleClose}>
      <div className="delete-account-modal" onClick={(e) => e.stopPropagation()}>
        <div className="delete-account-modal-header">
          <h3>⚠️ ยืนยันการลบบัญชี</h3>
          <button className="delete-modal-close" onClick={handleClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="delete-account-modal-body">
            {!canDelete && activeOrders > 0 ? (
              <div className="delete-warning error">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div>
                  <strong>ไม่สามารถลบบัญชีได้ในขณะนี้</strong>
                  <p>คุณมีคำสั่งซื้อที่กำลังดำเนินการอยู่ {activeOrders} รายการ</p>
                  <p>กรุณารอให้คำสั่งซื้อเสร็จสมบูรณ์ก่อนลบบัญชี</p>
                </div>
              </div>
            ) : (
              <>
                <div className="delete-warning">
                  <svg fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <strong>การดำเนินการนี้ไม่สามารถย้อนกลับได้</strong>
                    <ul>
                      <li>บัญชีของคุณจะถูกปิดการใช้งานถาวร</li>
                      <li>ข้อมูลส่วนตัวจะถูกเก็บไว้ตามกฎหมาย</li>
                      <li>คุณจะไม่สามารถเข้าสู่ระบบได้อีก</li>
                      <li>ประวัติการสั่งซื้อจะถูกเก็บไว้เพื่อการอ้างอิง</li>
                    </ul>
                  </div>
                </div>

                <div className="form-group">
                  <label>รหัสผ่าน <span className="required">*</span></label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="ใส่รหัสผ่านเพื่อยืนยัน"
                      required
                      className="delete-password-input"
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label>เหตุผล (ไม่บังคับ)</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="บอกเราว่าทำไมคุณถึงต้องการลบบัญชี..."
                    rows={4}
                    className="delete-reason-textarea"
                  />
                </div>
              </>
            )}
          </div>

          <div className="delete-account-modal-footer">
            <button 
              type="button" 
              onClick={handleClose} 
              className="btn-cancel-delete"
            >
              ยกเลิก
            </button>
            {canDelete && (
              <button 
                type="submit" 
                className="btn-confirm-delete"
                disabled={loading}
              >
                {loading ? (
                  <span className="btn-loading">
                    <span className="spinner"></span>
                    <span>กำลังลบ...</span>
                  </span>
                ) : (
                  'ยืนยันการลบบัญชี'
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}