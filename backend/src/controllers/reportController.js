const { prisma } = require('../config/db');

// 1. Full Inventory Report
exports.getInventoryReport = async (req, res, next) => {
  try {
    const { categoryId, status } = req.query;
    const where = {};
    if (categoryId && categoryId !== 'ALL') where.categoryId = categoryId;
    if (status && status !== 'ALL') where.status = status;

    const equipment = await prisma.equipment.findMany({
      where,
      orderBy: [{ categoryId: 'asc' }, { assetTag: 'asc' }],
      include: {
        category: { select: { id: true, name: true } }
      }
    });

    const totalValuation = equipment.reduce((sum, item) => sum + (item.purchasePrice || 0), 0);
    const statusCounts = equipment.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {});

    return res.json({
      success: true,
      summary: {
        totalItems: equipment.length,
        totalValuation,
        statusCounts
      },
      data: equipment
    });
  } catch (error) {
    next(error);
  }
};

// 2. Loans & Utilization Report
exports.getLoansReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const where = {};

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const requests = await prisma.borrowRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true, department: true } },
        project: { select: { id: true, title: true, client: true } },
        items: {
          include: {
            equipment: { select: { id: true, assetTag: true, name: true, categoryId: true } }
          }
        }
      }
    });

    return res.json({
      success: true,
      totalRequests: requests.length,
      data: requests
    });
  } catch (error) {
    next(error);
  }
};

// 3. Maintenance & Damages Report
exports.getMaintenanceReport = async (req, res, next) => {
  try {
    const tickets = await prisma.maintenance.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        equipment: {
          select: { id: true, assetTag: true, name: true, brand: true, model: true }
        },
        reportedBy: { select: { id: true, name: true } }
      }
    });

    const totalExpenditure = tickets.reduce((sum, item) => sum + (item.cost || 0), 0);
    const resolvedCount = tickets.filter(t => t.status === 'RESOLVED').length;
    const activeCount = tickets.filter(t => ['REPORTED', 'IN_INSPECTION', 'SENT_TO_VENDOR', 'IN_REPAIR'].includes(t.status)).length;

    return res.json({
      success: true,
      summary: {
        totalTickets: tickets.length,
        totalExpenditure,
        resolvedCount,
        activeCount
      },
      data: tickets
    });
  } catch (error) {
    next(error);
  }
};
