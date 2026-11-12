/**
 * Role-based access control middleware
 * Exactly supports three primary system roles:
 *  - ADMIN (Full System Authority)
 *  - STOCK_MANAGEMENT (Stock Management / Inventory / Handovers / Inspections)
 *  - USER (Normal User / Borrowing Requisitions)
 * Also aliases legacy STOCK_CONTROLLER for backwards compatibility.
 * @param {string[]|string} allowedRoles - Array or single role string allowed
 */
function requireRole(...allowedRoles) {
  const rawRoles = allowedRoles.flat();
  const expandedRoles = new Set();
  for (const r of rawRoles) {
    expandedRoles.add(r);
    if (r === 'STOCK_MANAGEMENT' || r === 'STOCK_CONTROLLER') {
      expandedRoles.add('STOCK_MANAGEMENT');
      expandedRoles.add('STOCK_CONTROLLER');
    }
  }

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    const userRole = req.user.role;
    const isAllowed = expandedRoles.has(userRole) || (
      (userRole === 'STOCK_MANAGEMENT' || userRole === 'STOCK_CONTROLLER') &&
      (expandedRoles.has('STOCK_MANAGEMENT') || expandedRoles.has('STOCK_CONTROLLER'))
    );

    if (!isAllowed) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: This action requires one of the following roles: [${rawRoles.join(', ')}]. Your role is ${userRole}.`
      });
    }

    next();
  };
}

module.exports = { requireRole };
