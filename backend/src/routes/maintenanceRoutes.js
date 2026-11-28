const express = require('express');
const router = express.Router();
const maintenanceController = require('../controllers/maintenanceController');
const { authenticate } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');
const { upload } = require('../middlewares/uploadMiddleware');

router.get('/', authenticate, maintenanceController.getAllMaintenance);
router.post('/', authenticate, requireRole('ADMIN', 'STOCK_CONTROLLER'), maintenanceController.createMaintenance);
router.put('/:id', authenticate, requireRole('ADMIN', 'STOCK_CONTROLLER'), maintenanceController.updateMaintenance);
router.patch('/:id/resolve', authenticate, requireRole('ADMIN', 'STOCK_CONTROLLER'), maintenanceController.resolveMaintenance);
router.delete('/:id', authenticate, requireRole('ADMIN'), maintenanceController.deleteMaintenance);
router.post('/upload', authenticate, requireRole('ADMIN', 'STOCK_CONTROLLER'), upload.single('image'), maintenanceController.uploadDamageImage);

module.exports = router;
