const { ROLES, ROLE_NAMES } = require('../config/constants');

/**
 * Authorization middleware
 * Check if user has required role(s)
 * @param {Array<string>} allowedRoles - Array of allowed role names (e.g., ['admin', 'staff'])
 */
const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - No user found',
      });
    }

    // Get user's role name
    const userRole = ROLE_NAMES[req.user.role_id];

    // Check if user's role is in allowed roles
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden - Bạn không có quyền truy cập',
        required_roles: allowedRoles,
        your_role: userRole,
      });
    }

    next();
  };
};

/**
 * Check if user is admin
 */
const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role_id !== ROLES.ADMIN) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden - Chỉ admin mới có quyền truy cập',
    });
  }
  next();
};

/**
 * Check if user is staff (staff or barista)
 */
const isStaff = (req, res, next) => {
  if (
    !req.user ||
    ![ROLES.STAFF, ROLES.BARISTA, ROLES.ADMIN].includes(req.user.role_id)
  ) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden - Chỉ nhân viên mới có quyền truy cập',
    });
  }
  next();
};

/**
 * Check if user is barista
 */
const isBarista = (req, res, next) => {
  if (!req.user || ![ROLES.BARISTA, ROLES.ADMIN].includes(req.user.role_id)) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden - Chỉ barista mới có quyền truy cập',
    });
  }
  next();
};

/**
 * Check if user is customer
 */
const isCustomer = (req, res, next) => {
  if (!req.user || req.user.role_id !== ROLES.CUSTOMER) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden - Chỉ khách hàng mới có quyền truy cập',
    });
  }
  next();
};

/**
 * Check if user is owner of resource or admin
 */
const isOwnerOrAdmin = (resourceUserIdField = 'user_id') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Admin can access all resources
    if (req.user.role_id === ROLES.ADMIN) {
      return next();
    }

    // Check if user is owner
    const resourceUserId =
      req.params[resourceUserIdField] ||
      req.body[resourceUserIdField] ||
      req.query[resourceUserIdField];

    if (parseInt(resourceUserId) !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden - Bạn không có quyền truy cập tài nguyên này',
      });
    }

    next();
  };
};

module.exports = {
  authorize,
  isAdmin,
  isStaff,
  isBarista,
  isCustomer,
  isOwnerOrAdmin,
};
