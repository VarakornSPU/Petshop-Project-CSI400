import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../style/Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState(0);

  const { register, loading, error, isAuthenticated, clearError } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    clearError();
  }, [clearError]);

  useEffect(() => {
    const calculateStrength = (password) => {
      let s = 0;
      if (password.length >= 8) s++;
      if (password.length >= 12) s++;
      if (/[a-z]/.test(password) && /[A-Z]/.test(password)) s++;
      if (/\d/.test(password)) s++;
      if (/[^a-zA-Z0-9]/.test(password)) s++;
      return s;
    };
    setPasswordStrength(calculateStrength(formData.password));
  }, [formData.password]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (validationErrors[e.target.name])
      setValidationErrors({ ...validationErrors, [e.target.name]: '' });
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.firstName.trim()) errors.firstName = 'กรุณาใส่ชื่อ';
    if (!formData.lastName.trim()) errors.lastName = 'กรุณาใส่นามสกุล';
    if (!formData.email.trim()) errors.email = 'กรุณาใส่อีเมล';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'รูปแบบอีเมลไม่ถูกต้อง';
    if (formData.phone && !/^[0-9]{10}$/.test(formData.phone)) errors.phone = 'เบอร์โทรศัพท์ไม่ถูกต้อง';
    if (!formData.password) errors.password = 'กรุณาใส่รหัสผ่าน';
    else if (formData.password.length < 8) errors.password = 'รหัสผ่านอย่างน้อย 8 ตัว';
    if (!formData.confirmPassword) errors.confirmPassword = 'กรุณายืนยันรหัสผ่าน';
    else if (formData.password !== formData.confirmPassword) errors.confirmPassword = 'รหัสผ่านไม่ตรงกัน';
    if (!acceptTerms) errors.terms = 'กรุณายอมรับข้อกำหนด';
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length) {
      setValidationErrors(errors);
      return;
    }
    const { confirmPassword, ...registerData } = formData;
    await register(registerData);
  };

  const getPasswordStrengthLabel = () => {
    if (passwordStrength <= 2) return { text: 'อ่อนแอ', color: 'text-red-500' };
    if (passwordStrength <= 3) return { text: 'ปานกลาง', color: 'text-yellow-500' };
    return { text: 'แข็งแรง', color: 'text-green-500' };
  };

  return (
    <div className="auth-page" >
      <div className="auth-card auth-card-large" >
        <div className="auth-header" >
          <div className="auth-icon-wrapper">
            <div className="auth-icon">🔐</div>
            <div className="auth-icon-ring"></div>
          </div>
          <h2 className="auth-title">สมัครสมาชิก</h2>
          <p className="auth-subtitle">สร้างบัญชีใหม่เพื่อเริ่มต้นใช้งาน</p>
        </div>

        {error && <div className="alert alert-error"><svg viewBox="0 0 20 20"><path fill="currentColor" d="M10 2a8 8 0 100 16A8 8 0 0010 2zM9 9h2v4H9V9zm0 5h2v2H9v-2z"/></svg>{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-grid form-grid-2">
            {/* ชื่อ */}
            <div className="form-group">
              <label className="form-label">ชื่อ <span className="form-required">*</span></label>
              <input name="firstName" type="text" className="form-input" value={formData.firstName} onChange={handleChange} placeholder="ชื่อ" />
              {validationErrors.firstName && <div className="form-error">⚠ {validationErrors.firstName}</div>}
            </div>

            {/* นามสกุล */}
            <div className="form-group">
              <label className="form-label">นามสกุล <span className="form-required">*</span></label>
              <input name="lastName" type="text" className="form-input" value={formData.lastName} onChange={handleChange} placeholder="นามสกุล" />
              {validationErrors.lastName && <div className="form-error">⚠ {validationErrors.lastName}</div>}
            </div>
          </div>

          {/* อีเมล */}
          <div className="form-group">
            <label className="form-label">อีเมล <span className="form-required">*</span></label>
            <input name="email" type="email" className="form-input" value={formData.email} onChange={handleChange} placeholder="your@email.com" />
            {validationErrors.email && <div className="form-error">⚠ {validationErrors.email}</div>}
          </div>

          {/* เบอร์โทร */}
          <div className="form-group">
            <label className="form-label">เบอร์โทรศัพท์</label>
            <input name="phone" type="tel" className="form-input" value={formData.phone} onChange={handleChange} placeholder="08X-XXX-XXXX" />
            {validationErrors.phone && <div className="form-error">⚠ {validationErrors.phone}</div>}
          </div>

          {/* รหัสผ่าน */}
          <div className="form-group">
            <label className="form-label">รหัสผ่าน <span className="form-required">*</span></label>
            <div className="form-input-wrapper">
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                className="form-input form-input-with-icon"
                value={formData.password}
                onChange={handleChange}
                placeholder="อย่างน้อย 8 ตัวอักษร"
              />
              <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {formData.password && (
              <div style={{ marginTop: '4px' }}>
                <span className={`text-xs font-semibold ${getPasswordStrengthLabel().color}`}>
                  {getPasswordStrengthLabel().text}
                </span>
              </div>
            )}
            {validationErrors.password && <div className="form-error">⚠ {validationErrors.password}</div>}
          </div>

          {/* ยืนยันรหัสผ่าน */}
          <div className="form-group">
            <label className="form-label">ยืนยันรหัสผ่าน <span className="form-required">*</span></label>
            <div className="form-input-wrapper">
              <input
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                className="form-input form-input-with-icon"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="กรอกรหัสผ่านอีกครั้ง"
              />
              <button type="button" className="password-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                {showConfirmPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {validationErrors.confirmPassword && <div className="form-error">⚠ {validationErrors.confirmPassword}</div>}
          </div>

          {/* ยอมรับข้อตกลง */}
          <div className="auth-terms">
            <label>
              <input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} />{' '}
              ฉันยอมรับ <Link to="/terms" className="auth-link">ข้อกำหนดการใช้งาน</Link>
            </label>
            {validationErrors.terms && <div className="form-error">⚠ {validationErrors.terms}</div>}
          </div>

          {/* ปุ่มสมัคร */}
          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? <div className="btn-loading"><div className="spinner"></div> กำลังสมัคร...</div> : <span>สมัครสมาชิก</span>}
          </button>
        </form>

        <div className="auth-footer">
          มีบัญชีอยู่แล้วใช่ไหม?{' '}
          <Link to="/login" className="auth-link">เข้าสู่ระบบ</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
