const { prisma } = require('../config/db');
const { logAudit } = require('../utils/auditLogger');

// Helper to generate sequential invoice number
async function generateNextInvoiceNumber() {
  const year = new Date().getFullYear();
  const count = await prisma.invoice.count();
  return `INV-${year}-${String(count + 1).padStart(3, '0')}`;
}

// 1. Get all invoices (Admin/Stock can view all; Normal user views their own)
exports.getAllInvoices = async (req, res, next) => {
  try {
    const { status, search, userId, projectId } = req.query;
    const isStaff = ['ADMIN', 'STOCK_MANAGEMENT', 'STOCK_CONTROLLER'].includes(req.user.role);

    const where = {};
    if (!isStaff) {
      where.userId = req.user.id;
    } else if (userId && userId !== 'ALL') {
      where.userId = userId;
    }

    if (projectId && projectId !== 'ALL') {
      where.projectId = projectId;
    }

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { invoiceNumber: { contains: q, mode: 'insensitive' } },
        { borrowerName: { contains: q, mode: 'insensitive' } },
        { projectName: { contains: q, mode: 'insensitive' } },
        { projectCode: { contains: q, mode: 'insensitive' } }
      ];
    }

    const invoices = await prisma.invoice.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true, department: true, phone: true } },
        project: { select: { id: true, projectCode: true, title: true, client: true } },
        request: { select: { id: true, requestNumber: true, status: true, purpose: true } },
        issuedBy: { select: { id: true, name: true, email: true } }
      }
    });

    return res.json({
      success: true,
      total: invoices.length,
      data: invoices
    });
  } catch (error) {
    next(error);
  }
};

// 2. Get single invoice by ID
exports.getInvoiceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isStaff = ['ADMIN', 'STOCK_MANAGEMENT', 'STOCK_CONTROLLER'].includes(req.user.role);

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, department: true, phone: true } },
        project: true,
        request: {
          include: {
            items: {
              include: { equipment: true }
            }
          }
        },
        issuedBy: { select: { id: true, name: true } }
      }
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    if (!isStaff && invoice.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied: You can only view your own invoices.' });
    }

    return res.json({
      success: true,
      data: invoice
    });
  } catch (error) {
    next(error);
  }
};

// 3. Create invoice (Admin / Stock Management)
exports.createInvoice = async (req, res, next) => {
  try {
    const {
      invoiceNumber,
      requestId,
      userId,
      projectId,
      borrowerName,
      borrowerDepartment,
      borrowerPhone,
      borrowerEmail,
      projectName,
      projectCode,
      projectLocation,
      borrowingDate,
      expectedReturnDate,
      totalAmount = 0,
      taxRate = 0,
      taxAmount = 0,
      grandTotal = 0,
      status = 'ISSUED',
      terms,
      declaration,
      authorizedSigner,
      items = [],
      notes
    } = req.body;

    const finalInvoiceNumber = invoiceNumber && invoiceNumber.trim()
      ? invoiceNumber.trim().toUpperCase()
      : await generateNextInvoiceNumber();

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: finalInvoiceNumber,
        requestId: requestId || null,
        userId: userId || null,
        projectId: projectId || null,
        issuedById: req.user.id,
        borrowerName: borrowerName || req.user.name,
        borrowerDepartment: borrowerDepartment || null,
        borrowerPhone: borrowerPhone || null,
        borrowerEmail: borrowerEmail || null,
        projectName: projectName || null,
        projectCode: projectCode || null,
        projectLocation: projectLocation || null,
        borrowingDate: borrowingDate ? new Date(borrowingDate) : new Date(),
        expectedReturnDate: expectedReturnDate ? new Date(expectedReturnDate) : new Date(Date.now() + 7 * 86400000),
        totalAmount: parseFloat(totalAmount) || 0,
        taxRate: parseFloat(taxRate) || 0,
        taxAmount: parseFloat(taxAmount) || 0,
        grandTotal: parseFloat(grandTotal) || parseFloat(totalAmount) || 0,
        status,
        terms: terms || null,
        declaration: declaration || null,
        authorizedSigner: authorizedSigner || req.user.name,
        items: items.length > 0 ? items : null,
        notes: notes ? notes.trim() : null
      },
      include: {
        user: { select: { id: true, name: true, email: true, department: true, phone: true } },
        project: true,
        request: true
      }
    });

    await logAudit({
      userId: req.user.id,
      action: 'CREATE_INVOICE',
      entity: 'Invoice',
      entityId: invoice.id,
      details: { invoiceNumber: invoice.invoiceNumber, grandTotal: invoice.grandTotal },
      req
    });

    return res.status(201).json({
      success: true,
      message: `Invoice ${invoice.invoiceNumber} created successfully.`,
      data: invoice
    });
  } catch (error) {
    next(error);
  }
};

// 4. Update invoice (Admin only)
exports.updateInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      status,
      terms,
      declaration,
      authorizedSigner,
      totalAmount,
      taxRate,
      taxAmount,
      grandTotal,
      notes,
      actualReturnDate
    } = req.body;

    const existing = await prisma.invoice.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        status: status || undefined,
        terms: terms !== undefined ? terms : undefined,
        declaration: declaration !== undefined ? declaration : undefined,
        authorizedSigner: authorizedSigner !== undefined ? authorizedSigner : undefined,
        totalAmount: totalAmount !== undefined ? parseFloat(totalAmount) : undefined,
        taxRate: taxRate !== undefined ? parseFloat(taxRate) : undefined,
        taxAmount: taxAmount !== undefined ? parseFloat(taxAmount) : undefined,
        grandTotal: grandTotal !== undefined ? parseFloat(grandTotal) : undefined,
        notes: notes !== undefined ? notes : undefined,
        actualReturnDate: actualReturnDate ? new Date(actualReturnDate) : undefined
      }
    });

    await logAudit({
      userId: req.user.id,
      action: 'UPDATE_INVOICE',
      entity: 'Invoice',
      entityId: id,
      details: { invoiceNumber: updated.invoiceNumber, status: updated.status },
      req
    });

    return res.json({
      success: true,
      message: `Invoice ${updated.invoiceNumber} updated successfully.`,
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

// 5. Delete invoice (Admin only)
exports.deleteInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.invoice.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    await prisma.invoice.delete({ where: { id } });

    await logAudit({
      userId: req.user.id,
      action: 'DELETE_INVOICE',
      entity: 'Invoice',
      entityId: id,
      details: { invoiceNumber: existing.invoiceNumber },
      req
    });

    return res.json({
      success: true,
      message: `Invoice ${existing.invoiceNumber} deleted.`
    });
  } catch (error) {
    next(error);
  }
};
