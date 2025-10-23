// Frontend/src/pages/Unauthorized.jsx
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Unauthorized = () => {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center space-y-6">
          {/* Icon */}
          <div className="mx-auto h-24 w-24 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold text-gray-900">
            ไม่มีสิทธิ์เข้าถึง
          </h2>

          {/* Description */}
          <div className="text-gray-600 space-y-2">
            {isAuthenticated ? (
              <>
                <p>คุณไม่มีสิทธิ์เข้าถึงหน้านี้</p>
                {user && (
                  <div className="bg-gray-50 rounded-lg p-4 mt-4">
                    <p className="text-sm text-gray-500">บทบาทปัจจุบันของคุณ:</p>
                    <p className="font-semibold text-blue-600 mt-1">
                      {user.role === 'admin' ? '👑 ผู้ดูแลระบบ' : 
                       user.role === 'customer' ? '✨ ลูกค้า' : 
                       '👤 ผู้ใช้ทั่วไป'}
                    </p>
                  </div>
                )}
                <p className="text-sm mt-4">
                  หน้านี้ต้องการสิทธิ์พิเศษที่คุณยังไม่มี
                </p>
              </>
            ) : (
              <p>กรุณาเข้าสู่ระบบเพื่อเข้าถึงหน้านี้</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4">
            {isAuthenticated ? (
              <>
                <Link
                  to="/"
                  className="block w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-full font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  กลับไปหน้าหลัก
                </Link>
                <Link
                  to="/products"
                  className="block w-full border-2 border-gray-300 text-gray-700 py-3 px-6 rounded-full font-medium hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300"
                >
                  ดูสินค้า
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-full font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  เข้าสู่ระบบ
                </Link>
                <Link
                  to="/register"
                  className="block w-full border-2 border-gray-300 text-gray-700 py-3 px-6 rounded-full font-medium hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300"
                >
                  สมัครสมาชิก
                </Link>
              </>
            )}
          </div>

          {/* Footer */}
          <p className="text-xs text-gray-500 pt-4 border-t border-gray-200">
            หากคุณคิดว่านี่เป็นข้อผิดพลาด กรุณาติดต่อผู้ดูแลระบบ
          </p>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
