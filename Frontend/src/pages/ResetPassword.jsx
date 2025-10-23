// frontend/src/pages/ResetPassword.jsx
import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../style/Auth.css';
import axios from 'axios';

const ResetPassword = () => {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { resetPassword } = useAuth();

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('โทเค็นรีเซ็ตรหัสผ่านไม่ถูกต้อง');
    }
  }, [token]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (validationErrors[e.target.name]) {
      setValidationErrors({ ...validationErrors, [e.target.name]: '' });
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.password) {
      errors.password = 'กรุณาใส่รหัสผ่าน';
    } else if (formData.password.length < 8) {
      errors.password = 'รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร';
    } else if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = 'รหัสผ่านต้องประกอบด้วยตัวอักษรและตัวเลข';
    }
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'กรุณายืนยันรหัสผ่าน';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'รหัสผ่านไม่ตรงกัน';
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!token) {
      setError('โทเค็นรีเซ็ตรหัสผ่านไม่ถูกต้อง');
      return;
    }

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});
    setLoading(true);
    const result = await resetPassword(token, formData.password);
    setLoading(false);

    if (result.success) {
      setMessage(result.message);
      setTimeout(() => navigate('/login'), 3000);
    } else {
      setError(result.error);
    }
  };

  // Token ไม่ถูกต้อง
  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-card text-center">
          <div className="auth-icon error">
            <svg className="icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="auth-title">โทเค็นไม่ถูกต้อง</h3>
          <p className="auth-subtitle">โทเค็นรีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุแล้ว</p>
          <Link to="/forgot-password" className="btn-submit">
            ขอรีเซ็ตรหัสผ่านใหม่
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header text-center">
          <div className="auth-icon">
            <svg className="icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h2 className="auth-title">สร้างรหัสผ่านใหม่</h2>
          <p className="auth-subtitle">กรอกรหัสผ่านใหม่ของคุณ</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="password">รหัสผ่านใหม่</label>
            <div className="form-input-wrapper">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="อย่างน้อย 8 ตัวอักษร"
                value={formData.password}
                onChange={handleChange}
                className="form-input"
              />
              <button type="button" className="btn-toggle" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? 'ซ่อน' : 'แสดง'}
              </button>
            </div>
            {validationErrors.password && <p className="form-error">{validationErrors.password}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">ยืนยันรหัสผ่านใหม่</label>
            <div className="form-input-wrapper">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="ยืนยันรหัสผ่านใหม่"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="form-input"
              />
              <button type="button" className="btn-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                {showConfirmPassword ? 'ซ่อน' : 'แสดง'}
              </button>
            </div>
            {validationErrors.confirmPassword && <p className="form-error">{validationErrors.confirmPassword}</p>}
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          {message && <div className="alert alert-success">{message} กำลังเปลี่ยนเส้นทางไปหน้าเข้าสู่ระบบ...</div>}

          
          <button type="submit" className="btn-submit" disabled={loading}>ส่งลิงก์รีเซ็ตรหัสผ่าน</button>


          <div className="auth-footer">
            <Link to="/login" className="auth-link">← กลับไปหน้าเข้าสู่ระบบ</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
