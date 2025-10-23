// frontend/src/components/RoleBasedComponent.jsx
import { useAuth } from '../context/AuthContext';

const RoleBasedComponent = ({ 
  children, 
  allowedRoles = [], 
  requiredRole = null,
  fallback = null 
}) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return fallback;
  }

  // Check specific role requirement
  if (requiredRole && user.role !== requiredRole) {
    return fallback;
  }

  // Check allowed roles
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return fallback;
  }

  return children;
};

export default RoleBasedComponent;