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

    const userScopeFilter = user.role === 'USER' ? { userId: user.id } : {};
    const isTimeFiltered = timeframe !== 'all';

    // Run all database queries in parallel in a single roundtrip batch (excluding heavy qrCode blobs)
    const [
      equipmentList,
      allRequestsMeta,
      recentRequestsRaw,
      recentActivityRaw,
      recentStockMovementsRaw,
      overdueLoans,
      myActiveBorrowList
    ] = await Promise.all([
      prisma.equipment.findMany({
        where: { isDeleted: false },
        select: {
          id: true,
          assetTag: true,
          name: true,
          brand: true,
          model: true,
          quantity: true,
          availableQuantity: true,
          status: true,
          condition: true,
          purchasePrice: true,
          dailyRate: true,
          imageUrl: true,
          category: { select: { id: true, name: true, icon: true } }
        }
      }),
      prisma.borrowRequest.findMany({
        where: userScopeFilter,
        select: {
          id: true,
          status: true,
          startDate: true,
          endDate: true,
          createdAt: true
        }
      }),
      prisma.borrowRequest.findMany({
        where: userScopeFilter,
        take: 15,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true, department: true } },
          project: { select: { id: true, title: true, projectCode: true } },
          items: { include: { equipment: { select: { id: true, assetTag: true, name: true } } } }
        }
      }),
      prisma.checkInOut.findMany({
        where: user.role === 'USER' ? { request: { userId: user.id } } : {},
        take: 15,
        orderBy: { actionDate: 'desc' },
        include: {
          handledBy: { select: { id: true, name: true } },
          equipment: { select: { id: true, assetTag: true, name: true } }
        }
      }),
      user.role !== 'USER' && prisma.stockMovement?.findMany
        ? prisma.stockMovement.findMany({
            take: 15,
            orderBy: { createdAt: 'desc' }
          })
        : Promise.resolve([]),
      prisma.borrowRequest.findMany({
        where: {
          status: 'CHECKED_OUT',
          endDate: { lt: now },
          ...userScopeFilter
        },
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          items: {
            include: {
              equipment: {
                select: { id: true, assetTag: true, name: true, brand: true, model: true, status: true }
              }
            }
          },
          project: true
        }
      }),
      user.role === 'USER'
        ? prisma.borrowRequest.findMany({
            where: { userId: user.id, status: { in: ['CHECKED_OUT', 'PARTIALLY_RETURNED'] } },
            include: {
              items: {
                include: {
                  equipment: {
                    select: { id: true, assetTag: true, name: true, brand: true, model: true, imageUrl: true }
                  }
                }
              },
              project: true
            },
            orderBy: { endDate: 'asc' }
          })
        : Promise.resolve([])
    ]);

    // 1. Equipment Inventory & Stock Totals
    const totalEquipment = equipmentList.length;
    let totalStockUnits = 0;
    let availableUnits = 0;
    let borrowedUnits = 0;
    let damagedUnits = 0;
    let maintenanceUnits = 0;
    let outOfStockCount = 0;
    let totalValuation = 0;
    const lowStockAlerts = [];

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

      if (avail <= 2) {
        lowStockAlerts.push({
          id: eq.id,
          assetTag: eq.assetTag,
          name: eq.name,
          category: eq.category?.name || 'General',
          quantity: qty,
          availableQuantity: avail,
          status: eq.status,
          imageUrl: eq.imageUrl
        });
      }
    });

    // 2. Requests Stats (Both Global Active Counts & Timeframe-Scoped Counts)
    const inPeriod = (dateVal) => !isTimeFiltered || (dateVal && new Date(dateVal) >= startDate);

    const pendingRequestsCount = allRequestsMeta.filter(r => r.status === 'PENDING').length;
    const approvedRequestsCount = allRequestsMeta.filter(r => r.status === 'APPROVED').length;
    const checkedOutRequestsCount = allRequestsMeta.filter(r => r.status === 'CHECKED_OUT').length;
    const overdueRequestsCount = overdueLoans.length;

    // Filter recent feeds by timeframe (matching createdAt or startDate/actionDate)
    const recentRequestsInPeriod = recentRequestsRaw.filter(
      r => inPeriod(r.createdAt) || inPeriod(r.startDate)
    );
    const recentActivityInPeriod = recentActivityRaw.filter(
      a => inPeriod(a.actionDate || a.createdAt)
    );
    const recentMovementsInPeriod = recentStockMovementsRaw.filter(
      m => inPeriod(m.createdAt)
    );

    const recentRequests = (recentRequestsInPeriod.length > 0 ? recentRequestsInPeriod : recentRequestsRaw).slice(0, 6);
    const recentActivity = (recentActivityInPeriod.length > 0 ? recentActivityInPeriod : recentActivityRaw).slice(0, 6);
    const recentStockMovements = (recentMovementsInPeriod.length > 0 ? recentMovementsInPeriod : recentStockMovementsRaw).slice(0, 6);

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
      const myActiveLoans = allRequestsMeta.filter(r => ['CHECKED_OUT', 'PARTIALLY_RETURNED'].includes(r.status)).length;
      const myPendingRequests = allRequestsMeta.filter(r => r.status === 'PENDING').length;
      const myCompletedLoans = allRequestsMeta.filter(r => r.status === 'RETURNED').length;

      userStats = {
        myActiveLoans,
        myPendingRequests,
        myCompletedLoans,
        myActiveBorrowList
      };
    }

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
        lowStockCount: lowStockAlerts.length,
        totalValuation,
        pendingRequestsCount,
        approvedRequestsCount,
        checkedOutRequestsCount,
        overdueRequestsCount,
        requestsInTimeframe: recentRequestsInPeriod.length,
        handoversInTimeframe: recentActivityInPeriod.length,
        movementsInTimeframe: recentMovementsInPeriod.length
      },
      charts: {
        categoryChart: categoryChartData,
        statusChart: statusChartData
      },
      lowStockAlerts: lowStockAlerts.slice(0, 6),
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
