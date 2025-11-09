// Frontend/src/App.jsx
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from './context/WishlistContext'; // ✅ เพิ่ม
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
import ProductDetail from "./pages/ProductDetail";
import Wishlist from './pages/Wishlist'; // ✅ เพิ่ม
import SearchResults from './pages/SearchResults';

export default function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <WishlistProvider> {/* ✅ ครอบด้วย WishlistProvider */}
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
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/products/:id" element={<ProductDetail />} />
                <Route path="/search" element={<SearchResults />} />
                
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
                
                <Route 
                  path="/addresses" 
                  element={
                    <ProtectedRoute allowedRoles={['customer', 'admin']}>
                      <AddressManagement />
                    </ProtectedRoute>
                  } 
                />
                
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

                {/* ✅ เพิ่ม Wishlist Route */}
                <Route
                  path="/wishlist"
                  element={
                    <ProtectedRoute allowedRoles={['customer','admin']}>
                      <Wishlist />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </main>
            <Footer />
          </CartProvider>
        </WishlistProvider> {/* ✅ ปิด WishlistProvider */}
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}