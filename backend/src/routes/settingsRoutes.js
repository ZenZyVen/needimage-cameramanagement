const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticate } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');
const { upload } = require('../middlewares/uploadMiddleware');

// Public/Authenticated read of branding & system settings
router.get('/', authenticate, settingsController.getSettings);

// Admin-only management routes
router.put('/', authenticate, requireRole('ADMIN'), settingsController.updateSettings);
router.get('/audit-logs', authenticate, requireRole('ADMIN'), settingsController.getAuditLogs);
router.get('/backup', authenticate, requireRole('ADMIN'), settingsController.exportBackup);
router.post('/upload-logo', authenticate, requireRole('ADMIN'), upload.single('logo'), settingsController.uploadLogo);

module.exports = router;
