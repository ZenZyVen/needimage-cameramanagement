const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

router.get('/inventory', authenticate, reportController.getInventoryReport);
router.get('/loans', authenticate, requireRole('ADMIN', 'STOCK_CONTROLLER'), reportController.getLoansReport);
router.get('/maintenance', authenticate, requireRole('ADMIN', 'STOCK_CONTROLLER'), reportController.getMaintenanceReport);

module.exports = router;
