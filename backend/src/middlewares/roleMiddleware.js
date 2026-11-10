/**
 * Role-based access control middleware
 * @param {string[]|string} allowedRoles - Array or single role string allowed
 */
function requireRole(...allowedRoles) {
  const roles = allowedRoles.flat();
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: This action requires one of the following roles: [${roles.join(', ')}]. Your role is ${req.user.role}.`
      });
    }

    next();
  };
}

module.exports = { requireRole };
