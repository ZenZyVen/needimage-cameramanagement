const express = require('express');
const router = express.Router();
const checkInOutController = require('../controllers/checkInOutController');
const { authenticate } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

// Staff only for checkout and checkin actions (Admin & Stock Controller)
router.post('/checkout', authenticate, requireRole('ADMIN', 'STOCK_CONTROLLER'), checkInOutController.checkoutItems);
router.post('/checkin', authenticate, requireRole('ADMIN', 'STOCK_CONTROLLER'), checkInOutController.checkinItems);
router.get('/history', authenticate, checkInOutController.getHistory);

module.exports = router;
