// Middleware for role-based authorization
const roleAuth = (roles = []) => {
  // Convert single role to array if not already
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Check if user's role is included in the allowed roles
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden - Insufficient permissions' });
    }

    // User has required role, proceed
    next();
  };
};

module.exports = roleAuth;