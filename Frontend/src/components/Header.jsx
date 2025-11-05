// Frontend/src/components/Header.jsx 
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import RoleBasedComponent from './RoleBasedComponent';
import { useCart } from '../context/CartContext';

import '../style/Header.css';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const { cartItems, setIsCartOpen, cartItemsCount } = useCart(); 
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    navigate('/');
  };

  const handleCartClick = (e) => {
    e.preventDefault();
    console.log('Cart button clicked!');
    console.log('Cart items:', cartItems);
    console.log('Cart count:', cartItemsCount);
    setIsCartOpen(true);
  };

  const handleAddressClick = (e) => {
    console.log('Address link clicked!');
    console.log('Current path:', window.location.pathname);
    console.log('Navigating to /addresses');
    setShowUserMenu(false);
  };

  return (
    <>
      <header className={`header ${scrolled ? 'header-scrolled' : ''}`}>
        <div className="header-container">
          <div className="header-content">
            {/* Logo */}
            <Link to="/" className="logo-container">
              <div className="logo-wrapper">
                <div className="logo-icon">
                  <span className="logo-emoji">🐾</span>
                </div>
              </div>
              <div className="logo-text">
                <span className="logo-title">Pet Shop</span>
                <span className="logo-subtitle">ร้านขายของสัตว์เลี้ยง</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="desktop-nav">
              <Link to="/" className="nav-link">
                หน้าหลัก
                <span className="nav-underline"></span>
              </Link>
              <Link to="/products" className="nav-link">
                สินค้า
                <span className="nav-underline"></span>
              </Link>
              <Link to="/about" className="nav-link">
                เกี่ยวกับเรา
                <span className="nav-underline"></span>
              </Link>
              <Link to="/contact" className="nav-link">
                ติดต่อ
                <span className="nav-underline"></span>
              </Link>
              
              {/* Admin Link */}
              <RoleBasedComponent requiredRole="admin">
                <Link to="/admin" className="admin-link">
                  <svg className="admin-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>จัดการระบบ</span>
                </Link>
              </RoleBasedComponent>
            </nav>

            {/* Right Side - Cart & Auth */}
            <div className="header-actions">
              <button 
                onClick={handleCartClick} 
                className="cart-button"
                type="button"
                aria-label="View shopping cart"
              >
                <div className="cart-icon-wrapper">
                  <svg className="cart-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5 6m0 0h12" />
                  </svg>
                  {cartItemsCount > 0 && (
                    <span className="cart-badge">{cartItemsCount}</span>
                  )}
                  <div className="cart-bg"></div>
                </div>
              </button>

              {/* Auth Section */}
              {isAuthenticated ? (
                <div className="user-menu-container">
                  <button onClick={() => setShowUserMenu(!showUserMenu)} className="user-button">
                    <div className="user-avatar-wrapper">
                      <div className="user-avatar">
                        <span className="user-initial">{user?.firstName?.charAt(0) || 'U'}</span>
                      </div>
                      <div className="user-status"></div>
                    </div>
                    <div className="user-info">
                      <div className="user-name">{user?.firstName} {user?.lastName}</div>
                      <div className="user-role">
                        {user?.role === 'admin' ? '👑 ผู้ดูแลระบบ' : '✨ สมาชิก'}
                      </div>
                    </div>
                    <svg className="dropdown-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* User Dropdown Menu */}
                  {showUserMenu && (
                    <div className="dropdown-menu">
                      <div className="dropdown-header">
                        <div className="dropdown-avatar">
                          <span>{user?.firstName?.charAt(0) || 'U'}</span>
                        </div>
                        <div className="dropdown-user-info">
                          <div className="dropdown-user-name">{user?.firstName} {user?.lastName}</div>
                          <div className="dropdown-user-email">{user?.email}</div>
                          <div className="dropdown-user-badge">
                            {user?.role === 'admin' ? '👑 ผู้ดูแลระบบ' : '✨ สมาชิก'}
                          </div>
                        </div>
                      </div>
                      
                      <Link to="/profile" className="dropdown-item" onClick={() => setShowUserMenu(false)}>
                        <svg className="dropdown-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        โปรไฟล์
                      </Link>
                      
                      {/* <RoleBasedComponent allowedRoles={['customer', 'admin']}> */}
                      <RoleBasedComponent allowedRoles={['customer']}>
                        <Link 
                          to="/addresses" 
                          className="dropdown-item" 
                          onClick={handleAddressClick}
                        >
                          <svg className="dropdown-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          ที่อยู่จัดส่ง
                        </Link>
                        
                        <Link to="/orders" className="dropdown-item" onClick={() => setShowUserMenu(false)}>
                          <svg className="dropdown-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                          </svg>
                          คำสั่งซื้อของฉัน
                        </Link>
                      </RoleBasedComponent>
                      
                      <div className="dropdown-divider"></div>
                      <button onClick={handleLogout} className="dropdown-item dropdown-item-logout">
                        <svg className="dropdown-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        ออกจากระบบ
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="auth-buttons">
                  <Link to="/login" className="btn-login">
                    เข้าสู่ระบบ
                  </Link>
                  <Link to="/register" className="btn-register">
                    สมัครสมาชิก
                  </Link>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="mobile-menu-btn">
                <svg className="menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="mobile-nav">
              <nav className="mobile-nav-links">
                <Link to="/" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>
                  หน้าหลัก
                </Link>
                <Link to="/products" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>
                  สินค้า
                </Link>
                <Link to="/about" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>
                  เกี่ยวกับเรา
                </Link>
                <Link to="/contact" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>
                  ติดต่อ
                </Link>
                
                <RoleBasedComponent requiredRole="admin">
                  <Link to="/admin" className="mobile-nav-link mobile-admin-link" onClick={() => setIsMenuOpen(false)}>
                    👑 จัดการระบบ
                  </Link>
                </RoleBasedComponent>

                {!isAuthenticated && (
                  <div className="mobile-auth-section">
                    <Link to="/login" className="mobile-btn-login" onClick={() => setIsMenuOpen(false)}>
                      เข้าสู่ระบบ
                    </Link>
                    <Link to="/register" className="mobile-btn-register" onClick={() => setIsMenuOpen(false)}>
                      สมัครสมาชิก
                    </Link>
                  </div>
                )}
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Overlay */}
      {(showUserMenu || isMenuOpen) && (
        <div 
          className="header-overlay" 
          onClick={() => {
            setShowUserMenu(false);
            setIsMenuOpen(false);
          }} 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.3)',
            zIndex: 40,
          }}
        />
      )}
    </>
  );
}