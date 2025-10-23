// backend/utils/rbac.js
// Role-Based Access Control middleware

export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRole = req.user.role;
    
    // Convert single role to array for consistency
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    
    if (!roles.includes(userRole)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: roles,
        current: userRole
      });
    }

    next();
  };
};

// Specific role middlewares for common use cases
export const requireAdmin = requireRole(['admin']);
export const requireCustomer = requireRole(['customer', 'admin']);
export const requireAuthenticated = requireRole(['customer', 'admin']);

// Check if user can access specific resource (for future use with resource ownership)
export const canAccessResource = (resourceOwnerField = 'user_id') => {
  return (req, res, next) => {
    const userRole = req.user.role;
    const userId = req.user.id;

    // Admin can access everything
    if (userRole === 'admin') {
      return next();
    }

    // For customers, check if they own the resource
    if (userRole === 'customer') {
      // This would be used with resource-specific logic
      // For now, we'll assume the resource check happens in the route handler
      req.resourceOwnerCheck = { userId, field: resourceOwnerField };
    }

    next();
  };
};

// Role hierarchy helper
export const getRoleLevel = (role) => {
  const roleLevels = {
    'visitor': 0,
    'customer': 1,
    'admin': 2
  };
  return roleLevels[role] || 0;
};

export const requireMinimumRole = (minimumRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRoleLevel = getRoleLevel(req.user.role);
    const requiredRoleLevel = getRoleLevel(minimumRole);

    if (userRoleLevel < requiredRoleLevel) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: minimumRole,
        current: req.user.role
      });
    }

    next();
  };
};