// frontend/src/context/AuthContext.jsx 
import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { authAPI } from "../utils/api";

const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case "LOGIN_START":
      return { ...state, loading: true, error: null };
    case "LOGIN_SUCCESS":
      return {
        ...state,
        loading: false,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        error: null,
      };
    case "LOGIN_FAILURE":
      return {
        ...state,
        loading: false,
        isAuthenticated: false,
        user: null,
        token: null,
        error: action.payload,
      };
    case "LOGOUT":
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
        error: null,
      };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "CLEAR_ERROR":
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
      try {
        const params = new URLSearchParams(window.location.search);
        const tokenFromUrl = params.get("token");
        const authError = params.get("authError");

        if (authError) {
          console.warn("Auth error from OAuth callback:", authError);
          params.delete("authError");
          const newUrl =
            window.location.pathname +
            (params.toString() ? `?${params.toString()}` : "");
          window.history.replaceState({}, document.title, newUrl);
        }

        if (tokenFromUrl) {
          // เก็บ token ชั่วคราวใน sessionStorage แทน localStorage
          sessionStorage.setItem("authToken", tokenFromUrl);
          params.delete("token");
          const newUrl =
            window.location.pathname +
            (params.toString() ? `?${params.toString()}` : "");
          window.history.replaceState({}, document.title, newUrl);
        }
      } catch (err) {
        console.error("Error processing OAuth redirect params:", err);
      }

      const token = sessionStorage.getItem("authToken");
      const savedUser = null;

      if (token) {
        try {
          const response = await authAPI.verifyToken();

          dispatch({
            type: "LOGIN_SUCCESS",
            payload: {
              user: response.user,
              token: token,
            },
          });

          console.log("User data verified:", response.user);
        } catch (error) {
          console.error("Token verification failed:", error);
          sessionStorage.removeItem("authToken");
          dispatch({ type: "LOGOUT" });
        }
      } else {
        console.log("⚠️ No token found, user not authenticated");
        dispatch({ type: "SET_LOADING", payload: false });
      }
    };

    checkAuthStatus();
  }, []);

  const login = useCallback(async (credentials) => {
    dispatch({ type: "LOGIN_START" });
    try {
      const response = await authAPI.login(credentials);
      const token = response.accessToken || response.token;

      // เก็บ token ไว้ใน sessionStorage
      sessionStorage.setItem("authToken", token);

      dispatch({
        type: "LOGIN_SUCCESS",
        payload: {
          user: response.user,
          token: token,
        },
      });

      console.log("User data:", response.user);
      return { success: true, message: response.message };
    } catch (error) {
      console.error("Login error:", error);
      const errorMessage =
        error.response?.data?.error || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ";
      dispatch({
        type: "LOGIN_FAILURE",
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  }, []);

  const register = useCallback(async (userData) => {
    dispatch({ type: "LOGIN_START" });
    try {
      const response = await authAPI.register(userData);
      const token = response.accessToken || response.token;

      // เก็บ token ไว้ใน sessionStorage
      sessionStorage.setItem("authToken", token);

      dispatch({
        type: "LOGIN_SUCCESS",
        payload: {
          user: response.user,
          token: token,
        },
      });

      return { success: true, message: response.message };
    } catch (error) {
      console.error("Register error:", error);
      const errorMessage =
        error.response?.data?.error || "เกิดข้อผิดพลาดในการสมัครสมาชิก";
      dispatch({
        type: "LOGIN_FAILURE",
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  }, []);

  const logout = useCallback(() => {
    console.log("Logging out...");
    sessionStorage.removeItem("authToken");
    dispatch({ type: "LOGOUT" });
  }, []);

  const forgotPassword = useCallback(async (email) => {
    try {
      const response = await authAPI.forgotPassword(email);
      return { success: true, message: response.message };
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || "เกิดข้อผิดพลาดในการขอรีเซ็ตรหัสผ่าน";
      return { success: false, error: errorMessage };
    }
  }, []);

  const resetPassword = useCallback(async (token, password) => {
    try {
      const response = await authAPI.resetPassword(token, password);
      return { success: true, message: response.message };
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || "เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน";
      return { success: false, error: errorMessage };
    }
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: "CLEAR_ERROR" });
  }, []);

  const hasRole = useCallback(
    (role) => {
      if (!state.user) return false;
      if (Array.isArray(role)) {
        return role.includes(state.user.role);
      }
      return state.user.role === role;
    },
    [state.user]
  );

  const isAdmin = useCallback(() => hasRole("admin"), [hasRole]);
  const isCustomer = useCallback(
    () => hasRole(["customer", "admin"]),
    [hasRole]
  );
  const isVisitor = useCallback(
    () => !state.isAuthenticated,
    [state.isAuthenticated]
  );

  const value = useMemo(
    () => ({
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
    }),
    [
      state,
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
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
