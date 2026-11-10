const express = require('express');
const router = express.Router();
const requestController = require('../controllers/borrowRequestController');
const { authenticate } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

router.get('/', authenticate, requestController.getAllRequests);
router.get('/:id', authenticate, requestController.getRequestById);
router.post('/', authenticate, requestController.createRequest);
router.patch('/:id/approve', authenticate, requireRole('ADMIN', 'STOCK_CONTROLLER'), requestController.approveRequest);
router.patch('/:id/reject', authenticate, requireRole('ADMIN', 'STOCK_CONTROLLER'), requestController.rejectRequest);
router.patch('/:id/cancel', authenticate, requestController.cancelRequest);

module.exports = router;
