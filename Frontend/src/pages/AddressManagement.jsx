// Frontend/src/pages/AddressManagement.jsx
import { useState, useEffect } from 'react';
import { addressAPI } from '../utils/api';
import '../style/AddressManagement.css';

export default function AddressManagement() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    recipientName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    subdistrict: '',
    district: '',
    province: '',
    postalCode: '',
    isDefault: false
  });

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const data = await addressAPI.getAddresses();
      setAddresses(data);
    } catch (err) {
      setError('ไม่สามารถโหลดข้อมูลที่อยู่ได้');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingAddress(null);
    setFormData({
      recipientName: '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      subdistrict: '',
      district: '',
      province: '',
      postalCode: '',
      isDefault: false
    });
    setShowModal(true);
  };

  const handleEdit = (address) => {
    setEditingAddress(address);
    setFormData({
      recipientName: address.recipient_name,
      phone: address.phone,
      addressLine1: address.address_line1,
      addressLine2: address.address_line2 || '',
      subdistrict: address.subdistrict,
      district: address.district,
      province: address.province,
      postalCode: address.postal_code,
      isDefault: address.is_default
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      if (editingAddress) {
        await addressAPI.updateAddress(editingAddress.id, formData);
        setMessage('อัปเดตที่อยู่สำเร็จ');
      } else {
        await addressAPI.createAddress(formData);
        setMessage('เพิ่มที่อยู่สำเร็จ');
      }
      setShowModal(false);
      fetchAddresses();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'เกิดข้อผิดพลาด');
    }
  };

  const handleDelete = async (addressId) => {
    if (!window.confirm('คุณแน่ใจหรือไม่ที่จะลบที่อยู่นี้?')) return;

    try {
      await addressAPI.deleteAddress(addressId);
      setMessage('ลบที่อยู่สำเร็จ');
      fetchAddresses();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'ไม่สามารถลบที่อยู่ได้');
    }
  };

  const handleSetDefault = async (addressId) => {
    try {
      await addressAPI.setDefaultAddress(addressId);
      setMessage('ตั้งเป็นที่อยู่เริ่มต้นสำเร็จ');
      fetchAddresses();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'เกิดข้อผิดพลาด');
    }
  };

  return (
    <div className="address-management-page">
      <div className="address-container">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1>จัดการที่อยู่จัดส่ง</h1>
            <p>จัดการที่อยู่สำหรับการจัดส่งสินค้า</p>
          </div>
          <button onClick={handleCreate} className="btn-create">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            เพิ่มที่อยู่ใหม่
          </button>
        </div>

        {/* Messages */}
        {message && (
          <div className="alert alert-success">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {message}
          </div>
        )}

        {error && (
          <div className="alert alert-error">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {/* Addresses List */}
        {loading ? (
          <div className="loading">กำลังโหลดข้อมูล...</div>
        ) : addresses.length === 0 ? (
          <div className="empty-state">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p>ยังไม่มีที่อยู่จัดส่ง</p>
            <button onClick={handleCreate} className="btn-primary">เพิ่มที่อยู่แรก</button>
          </div>
        ) : (
          <div className="addresses-grid">
            {addresses.map((address) => (
              <div key={address.id} className={`address-card ${address.is_default ? 'default' : ''}`}>
                {address.is_default && (
                  <div className="default-badge">
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    ที่อยู่เริ่มต้น
                  </div>
                )}
                
                <div className="address-content">
                  <div className="address-header">
                    <h3>{address.recipient_name}</h3>
                    <span className="phone">{address.phone}</span>
                  </div>
                  
                  <div className="address-details">
                    <p>{address.address_line1}</p>
                    {address.address_line2 && <p>{address.address_line2}</p>}
                    <p>
                      {address.subdistrict} {address.district} {address.province} {address.postal_code}
                    </p>
                  </div>
                </div>

                <div className="address-actions">
                  {!address.is_default && (
                    <button 
                      onClick={() => handleSetDefault(address.id)} 
                      className="btn-secondary"
                    >
                      ตั้งเป็นค่าเริ่มต้น
                    </button>
                  )}
                  <button 
                    onClick={() => handleEdit(address)} 
                    className="btn-icon"
                    title="แก้ไข"
                  >
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button 
                    onClick={() => handleDelete(address.id)} 
                    className="btn-icon btn-delete"
                    title="ลบ"
                  >
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h2>{editingAddress ? 'แก้ไขที่อยู่' : 'เพิ่มที่อยู่ใหม่'}</h2>
                <button onClick={() => setShowModal(false)} className="btn-close">×</button>
              </div>
              
              <form onSubmit={handleSubmit} className="modal-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>ชื่อผู้รับ *</label>
                    <input
                      type="text"
                      value={formData.recipientName}
                      onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>เบอร์โทรศัพท์ *</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                      placeholder="08X-XXX-XXXX"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>ที่อยู่บรรทัด 1 *</label>
                  <input
                    type="text"
                    value={formData.addressLine1}
                    onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                    required
                    placeholder="บ้านเลขที่, ชื่ออาคาร, ชั้น, ห้อง"
                  />
                </div>

                <div className="form-group">
                  <label>ที่อยู่บรรทัด 2</label>
                  <input
                    type="text"
                    value={formData.addressLine2}
                    onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                    placeholder="ซอย, ถนน, หมู่บ้าน (ถ้ามี)"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>แขวง/ตำบล *</label>
                    <input
                      type="text"
                      value={formData.subdistrict}
                      onChange={(e) => setFormData({ ...formData, subdistrict: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>เขต/อำเภอ *</label>
                    <input
                      type="text"
                      value={formData.district}
                      onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>จังหวัด *</label>
                    <input
                      type="text"
                      value={formData.province}
                      onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>รหัสไปรษณีย์ *</label>
                    <input
                      type="text"
                      value={formData.postalCode}
                      onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                      required
                      pattern="[0-9]{5}"
                      placeholder="xxxxx"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.isDefault}
                      onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    />
                    ตั้งเป็นที่อยู่เริ่มต้น
                  </label>
                </div>

                <div className="modal-actions">
                  <button type="submit" className="btn-save">
                    {editingAddress ? 'บันทึก' : 'เพิ่ม'}
                  </button>
                  <button type="button" onClick={() => setShowModal(false)} className="btn-cancel">
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