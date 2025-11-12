// Frontend/src/components/BannedAccountModal.jsx
import '../style/BannedAccountModal.css';

export default function BannedAccountModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="banned-modal-overlay">
      <div className="banned-modal">
        <div className="banned-modal-header">
          <div className="banned-icon">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
            </svg>
          </div>
          <h2>บัญชีของคุณถูกระงับการใช้งาน</h2>
        </div>

        <div className="banned-modal-body">
          <p className="banned-message">
            บัญชีของคุณถูกระงับชั่วคราวเนื่องจากฝ่าฝืนข้อกำหนดการใช้งาน
          </p>

          {/* <p className="banned-message">
            การระงับจะหมดอายุใน <strong>30 วัน</strong> นับจากวันที่ถูกระงับ
          </p> */}

          <div className="banned-notice">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <p><strong>หมายเหตุ:</strong></p>
              <p>หากคุณคิดว่านี่เป็นข้อผิดพลาด กรุณาติดต่อทีมสนับสนุนของเรา</p>
              <p className="support-email">📧 support@petshop.com</p>
            </div>
          </div>
        </div>

        <div className="banned-modal-footer">
          <button 
            onClick={onClose}
            className="btn-understand"
          >
            เข้าใจแล้ว
          </button>
        </div>
      </div>
    </div>
  );
}