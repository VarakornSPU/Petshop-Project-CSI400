// Frontend/src/pages/Register.jsx 
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../style/Auth.css';
import '../style/GoogleAuth.css';

const Register = () => {
  const [step, setStep] = useState(1); // 1 = Account Info, 2 = Address Info
  const [formData, setFormData] = useState({
    // Account Info
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    
    // Address Info
    address: {
      recipientName: '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      subdistrict: '',
      district: '',
      province: '',
      postalCode: ''
    }
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

  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
  };

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
    const { name, value } = e.target;
    
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData({
        ...formData,
        address: { ...formData.address, [addressField]: value }
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    
    if (validationErrors[name])
      setValidationErrors({ ...validationErrors, [name]: '' });
  };

  const validateStep1 = () => {
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

  const validateStep2 = () => {
    const errors = {};
    const addr = formData.address;
    
    if (!addr.recipientName.trim()) errors.recipientName = 'กรุณากรอกชื่อผู้รับ';
    if (!addr.phone.trim()) errors.phone = 'กรุณากรอกเบอร์โทรศัพท์';
    else if (!/^[0-9]{10}$/.test(addr.phone)) errors.phone = 'เบอร์โทรศัพท์ไม่ถูกต้อง';
    if (!addr.addressLine1.trim()) errors.addressLine1 = 'กรุณากรอกที่อยู่';
    if (!addr.subdistrict.trim()) errors.subdistrict = 'กรุณากรอกตำบล/แขวง';
    if (!addr.district.trim()) errors.district = 'กรุณากรอกอำเภอ/เขต';
    if (!addr.province.trim()) errors.province = 'กรุณากรอกจังหวัด';
    if (!addr.postalCode.trim()) errors.postalCode = 'กรุณากรอกรหัสไปรษณีย์';
    else if (!/^[0-9]{5}$/.test(addr.postalCode)) errors.postalCode = 'รหัสไปรษณีย์ต้องเป็นตัวเลข 5 หลัก';
    
    return errors;
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    const errors = validateStep1();
    if (Object.keys(errors).length) {
      setValidationErrors(errors);
      return;
    }
    
    // Auto-fill address recipient name and phone
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        recipientName: prev.firstName + ' ' + prev.lastName,
        phone: prev.phone || prev.address.phone
      }
    }));
    
    setStep(2);
  };

  const handlePrevStep = () => {
    setStep(1);
    setValidationErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateStep2();
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
    <div className="auth-page">
      <div className="auth-card auth-card-large">
        <div className="auth-header">
          <div className="auth-icon-wrapper">
            <div className="auth-icon">🔐</div>
            <div className="auth-icon-ring"></div>
          </div>
          <h2 className="auth-title">สมัครสมาชิก</h2>
          <p className="auth-subtitle">
            ขั้นตอนที่ {step} จาก 2: {step === 1 ? 'ข้อมูลบัญชี' : 'ที่อยู่จัดส่ง'}
          </p>
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ 
            height: '4px', 
            backgroundColor: '#e5e7eb', 
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: step === 1 ? '50%' : '100%',
              backgroundColor: '#3b82f6',
              transition: 'width 0.3s ease'
            }}></div>
          </div>
        </div>

        {error && <div className="alert alert-error"><svg viewBox="0 0 20 20"><path fill="currentColor" d="M10 2a8 8 0 100 16A8 8 0 0010 2zM9 9h2v4H9V9zm0 5h2v2H9v-2z"/></svg>{error}</div>}

        {/* STEP 1: Account Information */}
        {step === 1 && (
          <form className="auth-form" onSubmit={handleNextStep}>
            <div className="form-grid form-grid-2">
              <div className="form-group">
                <label className="form-label">ชื่อ <span className="form-required">*</span></label>
                <input name="firstName" type="text" className="form-input" value={formData.firstName} onChange={handleChange} placeholder="ชื่อ" />
                {validationErrors.firstName && <div className="form-error">⚠ {validationErrors.firstName}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">นามสกุล <span className="form-required">*</span></label>
                <input name="lastName" type="text" className="form-input" value={formData.lastName} onChange={handleChange} placeholder="นามสกุล" />
                {validationErrors.lastName && <div className="form-error">⚠ {validationErrors.lastName}</div>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">อีเมล <span className="form-required">*</span></label>
              <input name="email" type="email" className="form-input" value={formData.email} onChange={handleChange} placeholder="your@email.com" />
              {validationErrors.email && <div className="form-error">⚠ {validationErrors.email}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">เบอร์โทรศัพท์ <span className="form-required">*</span></label>
              <input name="phone" type="tel" className="form-input" value={formData.phone} onChange={handleChange} placeholder="08X-XXX-XXXX" />
              {validationErrors.phone && <div className="form-error">⚠ {validationErrors.phone}</div>}
            </div>

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

            <div className="auth-terms">
              <label>
                <input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} />{' '}
                ฉันยอมรับ <Link to="/terms" className="auth-link">ข้อกำหนดการใช้งาน</Link>
              </label>
              {validationErrors.terms && <div className="form-error">⚠ {validationErrors.terms}</div>}
            </div>

            <button type="submit" className="btn-submit">
              ถัดไป: กรอกที่อยู่จัดส่ง →
            </button>
          </form>
        )}

        {/* STEP 2: Address Information */}
        {step === 2 && (
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-grid form-grid-2">
              <div className="form-group">
                <label className="form-label">ชื่อผู้รับ <span className="form-required">*</span></label>
                <input 
                  name="address.recipientName" 
                  type="text" 
                  className="form-input" 
                  value={formData.address.recipientName} 
                  onChange={handleChange} 
                  placeholder="ชื่อผู้รับ" 
                />
                {validationErrors.recipientName && <div className="form-error">⚠ {validationErrors.recipientName}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">เบอร์โทรศัพท์ <span className="form-required">*</span></label>
                <input 
                  name="address.phone" 
                  type="tel" 
                  className="form-input" 
                  value={formData.address.phone} 
                  onChange={handleChange} 
                  placeholder="08X-XXX-XXXX" 
                />
                {validationErrors.phone && <div className="form-error">⚠ {validationErrors.phone}</div>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">ที่อยู่บรรทัด 1 <span className="form-required">*</span></label>
              <input 
                name="address.addressLine1" 
                type="text" 
                className="form-input" 
                value={formData.address.addressLine1} 
                onChange={handleChange} 
                placeholder="บ้านเลขที่, ชื่ออาคาร, ชั้น, ห้อง" 
              />
              {validationErrors.addressLine1 && <div className="form-error">⚠ {validationErrors.addressLine1}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">ที่อยู่บรรทัด 2</label>
              <input 
                name="address.addressLine2" 
                type="text" 
                className="form-input" 
                value={formData.address.addressLine2} 
                onChange={handleChange} 
                placeholder="ซอย, ถนน, หมู่บ้าน (ถ้ามี)" 
              />
            </div>

            <div className="form-grid form-grid-2">
              <div className="form-group">
                <label className="form-label">แขวง/ตำบล <span className="form-required">*</span></label>
                <input 
                  name="address.subdistrict" 
                  type="text" 
                  className="form-input" 
                  value={formData.address.subdistrict} 
                  onChange={handleChange} 
                />
                {validationErrors.subdistrict && <div className="form-error">⚠ {validationErrors.subdistrict}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">เขต/อำเภอ <span className="form-required">*</span></label>
                <input 
                  name="address.district" 
                  type="text" 
                  className="form-input" 
                  value={formData.address.district} 
                  onChange={handleChange} 
                />
                {validationErrors.district && <div className="form-error">⚠ {validationErrors.district}</div>}
              </div>
            </div>

            <div className="form-grid form-grid-2">
              <div className="form-group">
                <label className="form-label">จังหวัด <span className="form-required">*</span></label>
                <input 
                  name="address.province" 
                  type="text" 
                  className="form-input" 
                  value={formData.address.province} 
                  onChange={handleChange} 
                />
                {validationErrors.province && <div className="form-error">⚠ {validationErrors.province}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">รหัสไปรษณีย์ <span className="form-required">*</span></label>
                <input 
                  name="address.postalCode" 
                  type="text" 
                  className="form-input" 
                  value={formData.address.postalCode} 
                  onChange={handleChange} 
                  placeholder="xxxxx" 
                  maxLength={5}
                />
                {validationErrors.postalCode && <div className="form-error">⚠ {validationErrors.postalCode}</div>}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="button" onClick={handlePrevStep} className="btn-submit-1" style={{ backgroundColor: '#6b7280' }}>
                ← กลับ
              </button>
              <button type="submit" className="btn-submit" disabled={loading} style={{ flex: 1 }}>
                {loading ? <div className="btn-loading"><div className="spinner"></div> กำลังสมัคร...</div> : <span>สมัครสมาชิก</span>}
              </button>
            </div>
          </form>
        )}

        {step === 1 && (
          <>
            <div className="auth-divider">
              <span>หรือ</span>
            </div>
            
            <button 
              onClick={handleGoogleLogin}
              className="btn-google"
              type="button"
            >
              <img src="/google.svg" alt="Google" className="google-icon" />
              <span>สมัครสมาชิกด้วย Google</span>
            </button>
          </>
        )}

        <div className="auth-footer">
          มีบัญชีอยู่แล้วใช่ไหม?{' '}
          <Link to="/login" className="auth-link">เข้าสู่ระบบ</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;