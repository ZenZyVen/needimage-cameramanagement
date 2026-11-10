const { prisma } = require('../config/db');

exports.getDashboardStats = async (req, res, next) => {
  try {
    const user = req.user;
    const { timeframe = 'monthly' } = req.query; // daily, weekly, monthly, yearly, all
    const now = new Date();

    let startDate = new Date(0);
    if (timeframe === 'daily') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (timeframe === 'weekly') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (timeframe === 'monthly') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (timeframe === 'yearly') {
      startDate = new Date(now.getFullYear(), 0, 1);
    }

    // 1. Equipment Inventory & Stock Totals
    const equipmentList = await prisma.equipment.findMany({
      where: { isDeleted: false },
      include: { category: true }
    });

    const totalEquipment = equipmentList.length;
    let totalStockUnits = 0;
    let availableUnits = 0;
    let borrowedUnits = 0;
    let damagedUnits = 0;
    let maintenanceUnits = 0;
    let outOfStockCount = 0;
    let totalValuation = 0;

    equipmentList.forEach(eq => {
      const qty = eq.quantity || 1;
      const avail = eq.availableQuantity !== undefined ? eq.availableQuantity : (eq.status === 'AVAILABLE' ? qty : 0);
      totalStockUnits += qty;
      availableUnits += avail;
      totalValuation += (eq.purchasePrice || 0) * qty;

      if (avail === 0) outOfStockCount++;

      if (eq.status === 'BORROWED' || eq.status === 'IN_USE') {
        borrowedUnits += Math.max(1, qty - avail);
      } else if (eq.status === 'DAMAGED') {
        damagedUnits += Math.max(1, qty - avail);
      } else if (eq.status === 'UNDER_MAINTENANCE') {
        maintenanceUnits += Math.max(1, qty - avail);
      }
    });

    // 2. Requests Stats
    const requestDateFilter = timeframe !== 'all' ? { createdAt: { gte: startDate } } : {};
    const [
      pendingRequestsCount,
      approvedRequestsCount,
      checkedOutRequestsCount,
      overdueRequestsCount
    ] = await Promise.all([
      prisma.borrowRequest.count({ where: { status: 'PENDING', ...requestDateFilter } }),
      prisma.borrowRequest.count({ where: { status: 'APPROVED', ...requestDateFilter } }),
      prisma.borrowRequest.count({ where: { status: 'CHECKED_OUT' } }),
      prisma.borrowRequest.count({
        where: {
          status: 'CHECKED_OUT',
          endDate: { lt: now }
        }
      })
    ]);

    // 3. Equipment By Category (for Chart)
    const categoryCounts = {};
    equipmentList.forEach(eq => {
      const catName = eq.category?.name || 'General';
      categoryCounts[catName] = (categoryCounts[catName] || 0) + (eq.quantity || 1);
    });

    const categoryChartData = {
      labels: Object.keys(categoryCounts),
      counts: Object.values(categoryCounts)
    };

    // 4. Stock Status Breakdown (for Pie/Doughnut Chart)
    const statusChartData = {
      labels: ['Available', 'Borrowed / In Use', 'Under Maintenance', 'Damaged', 'Out of Stock'],
      data: [availableUnits, borrowedUnits, maintenanceUnits, damagedUnits, outOfStockCount]
    };

    // 5. User Specific Stats
    let userStats = null;
    if (user.role === 'USER') {
      const [
        myActiveLoans,
        myPendingRequests,
        myCompletedLoans
      ] = await Promise.all([
        prisma.borrowRequest.count({
          where: { userId: user.id, status: { in: ['CHECKED_OUT', 'PARTIALLY_RETURNED'] } }
        }),
        prisma.borrowRequest.count({
          where: { userId: user.id, status: 'PENDING' }
        }),
        prisma.borrowRequest.count({
          where: { userId: user.id, status: 'RETURNED' }
        })
      ]);

      const myActiveBorrowList = await prisma.borrowRequest.findMany({
        where: { userId: user.id, status: { in: ['CHECKED_OUT', 'PARTIALLY_RETURNED'] } },
        include: {
          items: {
            include: { equipment: true }
          },
          project: true
        },
        orderBy: { endDate: 'asc' }
      });

      userStats = {
        myActiveLoans,
        myPendingRequests,
        myCompletedLoans,
        myActiveBorrowList
      };
    }

    // 6. Recent Requests
    const recentRequests = await prisma.borrowRequest.findMany({
      where: timeframe !== 'all' ? { createdAt: { gte: startDate } } : {},
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true, department: true } },
        project: { select: { id: true, title: true } },
        items: { include: { equipment: { select: { assetTag: true, name: true } } } }
      }
    });

    // 7. Recent CheckInOuts & Activities
    const recentActivity = await prisma.checkInOut.findMany({
      where: timeframe !== 'all' ? { actionDate: { gte: startDate } } : {},
      take: 6,
      orderBy: { actionDate: 'desc' },
      include: {
        handledBy: { select: { id: true, name: true } },
        equipment: { select: { id: true, assetTag: true, name: true } }
      }
    });

    // 8. Recent Stock Movements
    let recentStockMovements = [];
    if (prisma.stockMovement?.findMany) {
      recentStockMovements = await prisma.stockMovement.findMany({
        where: timeframe !== 'all' ? { createdAt: { gte: startDate } } : {},
        take: 6,
        orderBy: { createdAt: 'desc' }
      });
    }

    // 9. Overdue List
    const overdueLoans = await prisma.borrowRequest.findMany({
      where: {
        status: 'CHECKED_OUT',
        endDate: { lt: now }
      },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        items: { include: { equipment: true } },
        project: true
      }
    });

    return res.json({
      success: true,
      timeframe,
      stats: {
        totalEquipment,
        totalStockUnits,
        availableCount: availableUnits,
        borrowedCount: borrowedUnits,
        maintenanceCount: maintenanceUnits,
        damagedCount: damagedUnits,
        outOfStockCount,
        totalValuation,
        pendingRequestsCount,
        approvedRequestsCount,
        checkedOutRequestsCount,
        overdueRequestsCount
      },
      charts: {
        categoryChart: categoryChartData,
        statusChart: statusChartData
      },
      recentRequests,
      recentActivity,
      recentStockMovements,
      overdueLoans,
      userStats
    });
  } catch (error) {
    next(error);
  }
};
