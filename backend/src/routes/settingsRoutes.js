const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticate } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');
const { upload } = require('../middlewares/uploadMiddleware');

// Public read of branding & system settings (used by Login, Sidebar, and Print headers)
router.get('/', settingsController.getSettings);

// Authenticated read of audit logs (Normal users scoped to their own; Admin & Staff see system logs)
router.get('/audit-logs', authenticate, settingsController.getAuditLogs);

// Admin-only management routes
router.delete('/audit-logs/:id', authenticate, requireRole('ADMIN'), settingsController.deleteAuditLog);
router.delete('/audit-logs', authenticate, requireRole('ADMIN'), settingsController.clearAuditLogs);
router.put('/', authenticate, requireRole('ADMIN'), settingsController.updateSettings);
router.get('/backup', authenticate, requireRole('ADMIN'), settingsController.exportBackup);
router.post('/upload-logo', authenticate, requireRole('ADMIN'), upload.single('logo'), settingsController.uploadLogo);

module.exports = router;
