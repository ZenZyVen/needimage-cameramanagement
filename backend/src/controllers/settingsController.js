const { prisma } = require('../config/db');
const { logAudit } = require('../utils/auditLogger');
const { mockStore } = require('../config/mockDb');

let inMemorySettings = {
  companyName: 'CineVault Media Production Studios',
  companyTagline: 'Professional Camera Equipment & Stock Vault',
  logoUrl: '/logo.svg',
  address: 'Studio Lot 4B, 742 Sunset Boulevard, Media Arts District, CA 90028',
  phone: '+1 (555) 019-2831',
  email: 'operations@cinevault-studios.com',
  website: 'www.cinevault-studios.com',
  brandColor: '#0f172a',
  accentColor: '#2563eb',
  currency: 'USD',
  maxLoanDurationDays: 14,
  requireApproval: true,
  autoOverdueCheck: true,
  allowMultipleItemsPerRequest: true,
  lowStockThreshold: 2,
  autoOutOfStockStatus: true,
  enableStockMovementLogging: true,
  defaultInspectorTitle: 'Lead Vault Inspector',
  requireInspectionSignature: true,
  autoCreateTicketOnDamagedCheckin: true,
  notifyOnBorrowRequest: true,
  notifyOnOverdue: true,
  notifyOnLowStock: true,
  invoiceHeader: 'EQUIPMENT LOAN & CUSTODY INVOICE',
  invoiceTaxId: 'EIN-84-9182903',
  invoiceTerms: 'The borrower acknowledges full custody and legal responsibility for all equipment listed herein. All items must be returned in their original flight cases with verified components. Any damaged optical sensors, missing cables, or body damage will be billed according to standard studio repair rates.',
  invoiceDeclaration: 'I confirm receipt and satisfactory visual inspection of the listed items and agree to return them on or before the due date.',
  invoiceAuthorizedSigner: 'Vault Operations Director'
};

// 1. Get system settings
exports.getSettings = async (req, res, next) => {
  try {
    let settings = inMemorySettings;
    if (prisma.systemSetting?.findFirst) {
      try {
        const dbSetting = await prisma.systemSetting.findFirst();
        if (dbSetting && dbSetting.value) {
          settings = { ...inMemorySettings, ...dbSetting.value };
        }
      } catch (e) {
        // use in-memory fallback
      }
    }
    return res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    next(error);
  }
};

// 2. Update system settings (Admin only)
exports.updateSettings = async (req, res, next) => {
  try {
    const payload = req.body;
    inMemorySettings = { ...inMemorySettings, ...payload };

    if (prisma.systemSetting?.upsert) {
      try {
        await prisma.systemSetting.upsert({
          where: { key: 'global' },
          create: { key: 'global', value: inMemorySettings },
          update: { value: inMemorySettings }
        });
      } catch (e) {
        // mockStore fallback
        if (mockStore.updateSystemSettings) {
          mockStore.updateSystemSettings(inMemorySettings);
        }
      }
    }

    await logAudit({
      userId: req.user.id,
      action: 'UPDATE_SETTINGS',
      entity: 'SystemSettings',
      entityId: 'global',
      details: { updatedKeys: Object.keys(payload) },
      req
    });

    return res.json({
      success: true,
      message: 'System settings updated successfully.',
      data: inMemorySettings
    });
  } catch (error) {
    next(error);
  }
};

// 3. Get system activity & audit logs (Admin only)
exports.getAuditLogs = async (req, res, next) => {
  try {
    const { action, entity, userId, search, startDate, endDate, limit = 150, page = 1 } = req.query;
    const where = {};
    if (action && action !== 'ALL') where.action = action;
    if (entity && entity !== 'ALL') where.entity = entity;
    if (userId && userId !== 'ALL') where.userId = userId;

    let logs = [];
    if (prisma.auditLog?.findMany) {
      logs = await prisma.auditLog.findMany({
        where,
        take: parseInt(limit, 10),
        skip: (parseInt(page, 10) - 1) * parseInt(limit, 10),
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true, role: true, department: true } }
        }
      });
    }

    // In-memory filters for search and date range
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      logs = logs.filter(l =>
        (l.action && l.action.toLowerCase().includes(q)) ||
        (l.entity && l.entity.toLowerCase().includes(q)) ||
        (l.entityId && l.entityId.toLowerCase().includes(q)) ||
        (l.user && l.user.name && l.user.name.toLowerCase().includes(q)) ||
        (l.user && l.user.email && l.user.email.toLowerCase().includes(q)) ||
        (l.details && JSON.stringify(l.details).toLowerCase().includes(q))
      );
    }

    if (startDate) {
      const s = new Date(startDate);
      logs = logs.filter(l => new Date(l.createdAt) >= s);
    }
    if (endDate) {
      const e = new Date(endDate);
      e.setHours(23, 59, 59, 999);
      logs = logs.filter(l => new Date(l.createdAt) <= e);
    }

    // Sort descending by date
    logs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.json({
      success: true,
      total: logs.length,
      count: logs.length,
      data: logs
    });
  } catch (error) {
    next(error);
  }
};

// 4. Export complete database backup (Admin only)
exports.exportBackup = async (req, res, next) => {
  try {
    let backupData = {};
    if (mockStore.getBackup) {
      backupData = mockStore.getBackup();
    } else {
      const [users, categories, equipment, projects, requests] = await Promise.all([
        prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, department: true } }),
        prisma.category.findMany(),
        prisma.equipment.findMany(),
        prisma.project.findMany(),
        prisma.borrowRequest.findMany()
      ]);
      backupData = {
        timestamp: new Date().toISOString(),
        systemSettings: inMemorySettings,
        users,
        categories,
        equipment,
        projects,
        borrowRequests: requests
      };
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=cinevault-backup-${new Date().toISOString().slice(0, 10)}.json`);
    return res.json({
      success: true,
      meta: {
        exportedAt: new Date().toISOString(),
        exportedBy: req.user.name,
        system: inMemorySettings.companyName
      },
      data: backupData
    });
  } catch (error) {
    next(error);
  }
};

// 5. Upload company logo
exports.uploadLogo = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }
    const logoUrl = `/uploads/${req.file.filename}`;
    inMemorySettings.logoUrl = logoUrl;

    return res.json({
      success: true,
      message: 'Company logo uploaded successfully.',
      logoUrl
    });
  } catch (error) {
    next(error);
  }
};
