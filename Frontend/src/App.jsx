// Frontend/src/App.jsx
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { GoogleOAuthProvider } from '@react-oauth/google';
import Header from "./components/Header";
import Footer from "./components/Footer";
import CartModal from "./components/CartModal"; 
import Notification from "./components/Notification";
import ProtectedRoute from "./components/ProtectedRoute";

// Pages
import Home from "./pages/Home";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Products from "./sections/Products";
import ProductsList from "./pages/ProductsList";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Unauthorized from "./pages/Unauthorized";
import AddressManagement from "./pages/AddressManagement";
import Profile from "./pages/Profile";
import AdminUsers from "./pages/AdminUsers";
import Checkout from "./pages/Checkout";
import MyOrders from "./pages/MyOrders";

export default function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <CartProvider>
          <Header />
        <CartModal /> 
        <Notification /> 
        <main className="pt-20">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/products" element={<Products />} />
            <Route path="/productslist" element={<ProductsList />} />
            
            {/* Auth routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            {/* Protected routes - Admin only */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <Admin />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/users" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminUsers />
                </ProtectedRoute>
              } 
            />
            
            {/* Protected routes - Customer & Admin */}
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute allowedRoles={['customer', 'admin']}>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            
            {/* Address Management - ลบ route ที่ซ้ำออก */}
            <Route 
              path="/addresses" 
              element={
                <ProtectedRoute allowedRoles={['customer', 'admin']}>
                  <AddressManagement />
                </ProtectedRoute>
              } 
            />
            
            {/* Orders */}
            <Route 
              path="/orders" 
              element={
                <ProtectedRoute allowedRoles={['customer', 'admin']}>
                  <div className="min-h-screen pt-20 px-4">
                    <div className="container mx-auto py-8">
                      <h1 className="text-3xl font-bold text-gray-900 mb-6">คำสั่งซื้อของฉัน</h1>
                      <p className="text-gray-600">รายการคำสั่งซื้อของคุณจะแสดงที่นี่</p>
                    </div>
                  </div>
                </ProtectedRoute>
              } 
            />

            {/* --- เพิ่ม Checkout และ MyOrders routes --- */}
            <Route
              path="/checkout"
              element={
                <ProtectedRoute allowedRoles={['customer','admin']}>
                  <Checkout />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-orders"
              element={
                <ProtectedRoute allowedRoles={['customer','admin']}>
                  <MyOrders />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
        <Footer />
      </CartProvider>
    </AuthProvider>
    </GoogleOAuthProvider>
  );
}