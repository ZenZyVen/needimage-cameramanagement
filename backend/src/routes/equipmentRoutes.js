const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/equipmentController');
const { authenticate } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');
const { upload } = require('../middlewares/uploadMiddleware');

// Public/Authenticated read routes
router.get('/', authenticate, equipmentController.getAllEquipment);
router.get('/categories', authenticate, equipmentController.getCategories);
router.get('/stock-dashboard', authenticate, equipmentController.getStockDashboard);
router.get('/lookup/:code', authenticate, equipmentController.lookupEquipment);
router.get('/:id', authenticate, equipmentController.getEquipmentById);

// Staff management routes (Admin & Stock Controller)
router.post('/', authenticate, requireRole('ADMIN', 'STOCK_CONTROLLER'), equipmentController.createEquipment);
router.put('/:id', authenticate, requireRole('ADMIN', 'STOCK_CONTROLLER'), equipmentController.updateEquipment);
router.delete('/:id', authenticate, requireRole('ADMIN', 'STOCK_CONTROLLER'), equipmentController.deleteEquipment);
router.post('/:id/restore', authenticate, requireRole('ADMIN', 'STOCK_CONTROLLER'), equipmentController.restoreEquipment);
router.post('/:id/adjust-stock', authenticate, requireRole('ADMIN', 'STOCK_CONTROLLER'), equipmentController.adjustStock);

router.post('/categories', authenticate, requireRole('ADMIN', 'STOCK_CONTROLLER'), equipmentController.createCategory);
router.delete('/categories/:id', authenticate, requireRole('ADMIN', 'STOCK_CONTROLLER'), equipmentController.deleteCategory);
router.post('/upload', authenticate, requireRole('ADMIN', 'STOCK_CONTROLLER'), upload.single('image'), equipmentController.uploadImage);

module.exports = router;
