const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { authenticate } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

// Authenticated users can list and get invoices (Normal users scoped to their own; Admin/Stock see all)
router.get('/', authenticate, invoiceController.getAllInvoices);
router.get('/:id', authenticate, invoiceController.getInvoiceById);

// Creation allowed for Admin & Stock Management
router.post('/', authenticate, requireRole('ADMIN', 'STOCK_MANAGEMENT', 'STOCK_CONTROLLER'), invoiceController.createInvoice);

// Modification & deletion restricted strictly to Admin
router.put('/:id', authenticate, requireRole('ADMIN'), invoiceController.updateInvoice);
router.delete('/:id', authenticate, requireRole('ADMIN'), invoiceController.deleteInvoice);

module.exports = router;
