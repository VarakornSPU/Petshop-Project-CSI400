// Frontend/src/utils/api.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ REQUEST INTERCEPTOR - Add token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    
    console.log('📤 API Request:', config.method?.toUpperCase(), config.url);
    console.log('🔑 Token:', token ? 'EXISTS (' + token.substring(0, 20) + '...)' : 'NOT FOUND');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ Token added to header');
    } else {
      console.warn('⚠️ No token found in localStorage');
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request Interceptor Error:', error);
    return Promise.reject(error);
  }
);

// ✅ RESPONSE INTERCEPTOR - Handle errors
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', error.response?.status, error.config?.url);
    console.error('Error Details:', error.response?.data);
    
    if (error.response?.status === 401) {
      console.error('🚫 Unauthorized - Token invalid or expired');
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    if (error.response?.status === 403) {
      console.error('🚫 Forbidden - Insufficient permissions');
    }
    
    return Promise.reject(error);
  }
);

// ==========================================
// ✅ AUTH API
// ==========================================
export const authAPI = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },
  
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  
  verifyToken: async () => {
    const response = await api.get('/auth/verify');
    return response.data;
  },
  
  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },
  
  resetPassword: async (token, password) => {
    const response = await api.post('/auth/reset-password', { token, password });
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await api.put('/auth/profile', profileData);
    return response.data;
  },

  changePassword: async (currentPassword, newPassword) => {
    const response = await api.put('/auth/change-password', {
      currentPassword,
      newPassword
    });
    return response.data;
  }
};

// ==========================================
// ✅ ADMIN API
// ==========================================
export const adminAPI = {
  getUsers: async (params) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  getUser: async (id) => {
    const response = await api.get(`/admin/users/${id}`);
    return response.data;
  },

  createUser: async (userData) => {
    const response = await api.post('/admin/users', userData);
    return response.data;
  },

  updateUser: async (id, userData) => {
    const response = await api.put(`/admin/users/${id}`, userData);
    return response.data;
  },

  deleteUser: async (id) => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },

  banUser: async (id, isBanned) => {
    const response = await api.post(`/admin/users/${id}/ban`, { isBanned });
    return response.data;
  },

  resetUserPassword: async (id, newPassword) => {
    const response = await api.post(`/admin/users/${id}/reset-password`, { newPassword });
    return response.data;
  }
};

// ==========================================
// ✅ ADDRESS API
// ==========================================
export const addressAPI = {
  getAddresses: async () => {
    console.log('🏠 Fetching addresses...');
    const response = await api.get('/addresses');
    return response.data;
  },
  
  createAddress: async (addressData) => {
    console.log('🏠 Creating address...', addressData);
    const response = await api.post('/addresses', addressData);
    return response.data;
  },
  
  updateAddress: async (id, addressData) => {
    console.log('🏠 Updating address...', id, addressData);
    const response = await api.put(`/addresses/${id}`, addressData);
    return response.data;
  },
  
  deleteAddress: async (id) => {
    console.log('🏠 Deleting address...', id);
    const response = await api.delete(`/addresses/${id}`);
    return response.data;
  },
  
  setDefaultAddress: async (id) => {
    console.log('🏠 Setting default address...', id);
    const response = await api.put(`/addresses/${id}/default`);
    return response.data;
  },
  
  getAddressUsage: async (id) => {
    console.log('🏠 Getting address usage...', id);
    const response = await api.get(`/addresses/${id}/usage`);
    return response.data;
  }
};

// ==========================================
// ✅ USER ACCOUNT API
// ==========================================
export const userAccountAPI = {
  requestDelete: async (password, reason) => {
    const response = await api.post('/user-account/delete-request', { password, reason });
    return response.data;
  },
  
  canDelete: async () => {
    const response = await api.get('/user-account/can-delete');
    return response.data;
  }
};

// ==========================================
// ✅ ADMIN ADDRESS API
// ==========================================
export const adminAddressAPI = {
  getAllAddresses: async (params) => {
    console.log('📍 Admin: Fetching all addresses...');
    const response = await api.get('/admin/addresses', { params });
    return response.data;
  },
  
  getUserAddresses: async (userId) => {
    console.log('📍 Admin: Fetching user addresses...', userId);
    const response = await api.get(`/admin/addresses/user/${userId}`);
    return response.data;
  },
  
  getStats: async () => {
    console.log('📊 Admin: Fetching address stats...');
    const response = await api.get('/admin/addresses/stats');
    return response.data;
  },
  
  forceDeleteAddress: async (id) => {
    console.log('🗑️ Admin: Force deleting address...', id);
    const response = await api.delete(`/admin/addresses/${id}/force`);
    return response.data;
  }
};

export default api;