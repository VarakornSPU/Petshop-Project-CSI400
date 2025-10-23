// Frontend/src/components/AuthModal.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function AuthModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8 animate-in zoom-in-95 duration-300">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Content */}
        <div className="text-center">
          {/* Icon */}
          <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            เข้าสู่ระบบเพื่อเพิ่มสินค้าในตะกร้า
          </h3>

          {/* Description */}
          <p className="text-gray-600 mb-6">
            คุณต้องเข้าสู่ระบบก่อนเพื่อเพิ่มสินค้าลงในตะกร้าและทำการสั่งซื้อ
          </p>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link
              to="/login"
              onClick={onClose}
              className="block w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-full font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              เข้าสู่ระบบ
            </Link>
            
            <Link
              to="/register"
              onClick={onClose}
              className="block w-full border-2 border-gray-300 text-gray-700 py-3 px-6 rounded-full font-medium hover:border-blue-300 hover:text-blue-600 transition-all duration-300"
            >
              สมัครสมาชิกใหม่
            </Link>
          </div>

          {/* Footer */}
          <p className="text-sm text-gray-500 mt-4">
            มีบัญชีแล้ว? <Link to="/login" onClick={onClose} className="text-blue-600 hover:underline">เข้าสู่ระบบที่นี่</Link>
          </p>
        </div>
      </div>
    </div>
  );
}