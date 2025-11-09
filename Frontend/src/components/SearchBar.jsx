import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../style/SearchBar.css';

export default function SearchBar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  // ฟังก์ชันค้นหาสินค้า
  const searchProducts = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/products/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchProducts(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ปิด dropdown เมื่อคลิกข้างนอก
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ฟังก์ชันแสดงรูปภาพ
  const getImageUrl = (images) => {
    if (!images || images.length === 0) return null;
    const firstImage = Array.isArray(images) ? images[0] : images;
    
    if (firstImage.startsWith('http')) {
      return firstImage;
    } else if (firstImage.startsWith('/uploads/')) {
      return `http://localhost:3001${firstImage}`;
    } else {
      return `http://localhost:3001/uploads/${firstImage}`;
    }
  };

  // ไปยังหน้ารายละเอียดสินค้า
  const handleProductClick = (productId) => {
    setShowResults(false);
    setSearchQuery('');
    navigate(`/product/${productId}`);
  };

  // ค้นหาทั้งหมด
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowResults(false);
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const getCategoryLabel = (category) => {
    const categories = {
      food: 'อาหารสัตว์เลี้ยง',
      toys: 'ของเล่น',
      accessories: 'อุปกรณ์และของใช้',
    };
    return categories[category] || category;
  };

  return (
    <div ref={searchRef} className="search-container">
      <form onSubmit={handleSearchSubmit} className="search-form">
        <div className="search-wrapper">
          
          <input
            type="text"
            placeholder="ค้นหาสินค้า..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
            className="search-input"
          />

          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSearchResults([]);
              }}
              className="clear-button"
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </form>

      {/* Search Results Dropdown */}
      {showResults && searchQuery && (
        <div className="results-dropdown">
          {isLoading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>กำลังค้นหา...</p>
            </div>
          ) : searchResults.length > 0 ? (
            <>
              <div className="results-header">
                พบ {searchResults.length} รายการ
              </div>
              <div className="results-list">
                {searchResults.slice(0, 5).map((product) => (
                  <div
                    key={product.id}
                    onClick={() => handleProductClick(product.id)}
                    className="result-item"
                  >
                    <div className="result-image">
                      {getImageUrl(product.images) ? (
                        <img
                          src={getImageUrl(product.images)}
                          alt={product.name}
                          className="product-img"
                        />
                      ) : (
                        <div className="no-image">📦</div>
                      )}
                    </div>
                    
                    <div className="result-info">
                      <h4 className="result-name">{product.name}</h4>
                      <p className="result-category">{getCategoryLabel(product.category)}</p>
                      <p className="result-price">฿{Number(product.price).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              {searchResults.length > 5 && (
                <button
                  onClick={handleSearchSubmit}
                  className="view-all-button"
                >
                  ดูทั้งหมด {searchResults.length} รายการ →
                </button>
              )}
            </>
          ) : (
            <div className="no-results">
              <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>ไม่พบสินค้าที่ค้นหา</p>
              <small>ลองใช้คำค้นหาอื่น</small>
            </div>
          )}
        </div>
      )}
    </div>
  );
}