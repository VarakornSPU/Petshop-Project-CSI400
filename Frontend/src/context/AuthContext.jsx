// frontend/src/context/AuthContext.jsx
import { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import { authAPI } from '../utils/api';

const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, loading: true, error: null };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        loading: false,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        error: null,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        loading: false,
        isAuthenticated: false,
        user: null,
        token: null,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
        error: null,
      };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

const initialState = {
  isAuthenticated: false,
  user: null,
  token: null,
  loading: true,
  error: null,
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('authToken');
      const savedUser = localStorage.getItem('user');

      if (token && savedUser) {
        try {
          const response = await authAPI.verifyToken();
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: {
              user: response.user,
              token: token,
            },
          });
        } catch (error) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          dispatch({ type: 'LOGOUT' });
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    checkAuthStatus();
  }, []);

  const login = useCallback(async (credentials) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const response = await authAPI.login(credentials);

      localStorage.setItem('authToken', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: response.user,
          token: response.token,
        },
      });

      return { success: true, message: response.message };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ';
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  }, []);

  const register = useCallback(async (userData) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const response = await authAPI.register(userData);

      localStorage.setItem('authToken', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: response.user,
          token: response.token,
        },
      });

      return { success: true, message: response.message };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'เกิดข้อผิดพลาดในการสมัครสมาชิก';
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    dispatch({ type: 'LOGOUT' });
  }, []);

  const forgotPassword = useCallback(async (email) => {
    try {
      const response = await authAPI.forgotPassword(email);
      return { success: true, message: response.message };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'เกิดข้อผิดพลาดในการขอรีเซ็ตรหัสผ่าน';
      return { success: false, error: errorMessage };
    }
  }, []);

  const resetPassword = useCallback(async (token, password) => {
    try {
      const response = await authAPI.resetPassword(token, password);
      return { success: true, message: response.message };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน';
      return { success: false, error: errorMessage };
    }
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const hasRole = useCallback((role) => {
    if (!state.user) return false;
    if (Array.isArray(role)) {
      return role.includes(state.user.role);
    }
    return state.user.role === role;
  }, [state.user]);

  const isAdmin = useCallback(() => hasRole('admin'), [hasRole]);
  const isCustomer = useCallback(() => hasRole(['customer', 'admin']), [hasRole]);
  const isVisitor = useCallback(() => !state.isAuthenticated, [state.isAuthenticated]);

  const value = useMemo(() => ({
    ...state,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    clearError,
    hasRole,
    isAdmin,
    isCustomer,
    isVisitor,
  }), [state, login, register, logout, forgotPassword, resetPassword, clearError, hasRole, isAdmin, isCustomer, isVisitor]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// ===============================
// ลืมรหัสผ่าน (ขอลิงก์รีเซ็ต)
// ===============================
const forgotPassword = async (email) => {
  try {
    const res = await axios.post(`${import.meta.env.VITE_API_URL}/auth/forgot-password`, { email });
    return { success: true, message: 'ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลแล้ว' };
  } catch (err) {
    console.error(err);
    const msg = err.response?.data?.message || 'ไม่สามารถส่งอีเมลรีเซ็ตรหัสผ่านได้';
    return { success: false, error: msg };
  }
};

// ===============================
// รีเซ็ตรหัสผ่าน (เมื่อคลิกลิงก์จากอีเมล)
// ===============================
const resetPassword = async (token, password) => {
  try {
    const res = await axios.post(`${import.meta.env.VITE_API_URL}/auth/reset-password`, {
      token,
      password,
    });
    return { success: true, message: 'รีเซ็ตรหัสผ่านสำเร็จ' };
  } catch (err) {
    console.error(err);
    const msg = err.response?.data?.message || 'โทเค็นไม่ถูกต้องหรือหมดอายุ';
    return { success: false, error: msg };
  }
};

export default AuthContext;