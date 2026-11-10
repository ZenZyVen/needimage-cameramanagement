const { prisma } = require('../config/db');

exports.getDashboardStats = async (req, res, next) => {
  try {
    const user = req.user;
    const now = new Date();

    // 1. Overall Equipment Counts
    const [
      totalEquipment,
      availableCount,
      borrowedCount,
      maintenanceCount,
      damagedCount,
      retiredCount
    ] = await Promise.all([
      prisma.equipment.count(),
      prisma.equipment.count({ where: { status: 'AVAILABLE' } }),
      prisma.equipment.count({ where: { status: 'BORROWED' } }),
      prisma.equipment.count({ where: { status: 'UNDER_MAINTENANCE' } }),
      prisma.equipment.count({ where: { status: 'DAMAGED' } }),
      prisma.equipment.count({ where: { status: 'RETIRED' } })
    ]);

    // Inventory Valuation
    const equipmentList = await prisma.equipment.findMany({
      select: { purchasePrice: true }
    });
    const totalValuation = equipmentList.reduce((sum, item) => sum + (item.purchasePrice || 0), 0);

    // 2. Requests Stats
    const [
      pendingRequestsCount,
      approvedRequestsCount,
      checkedOutRequestsCount,
      overdueRequestsCount
    ] = await Promise.all([
      prisma.borrowRequest.count({ where: { status: 'PENDING' } }),
      prisma.borrowRequest.count({ where: { status: 'APPROVED' } }),
      prisma.borrowRequest.count({ where: { status: 'CHECKED_OUT' } }),
      prisma.borrowRequest.count({
        where: {
          status: 'CHECKED_OUT',
          endDate: { lt: now }
        }
      })
    ]);

    // 3. Equipment By Category (for Chart)
    const categoriesWithCount = await prisma.category.findMany({
      include: {
        _count: { select: { equipment: true } }
      }
    });

    const categoryChartData = {
      labels: categoriesWithCount.map(c => c.name),
      counts: categoriesWithCount.map(c => c._count.equipment)
    };

    // 4. Equipment Status Breakdown (for Pie/Doughnut Chart)
    const statusChartData = {
      labels: ['Available', 'Borrowed', 'Under Maintenance', 'Damaged', 'Retired'],
      data: [availableCount, borrowedCount, maintenanceCount, damagedCount, retiredCount]
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
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true, department: true } },
        project: { select: { id: true, title: true } },
        items: { include: { equipment: { select: { assetTag: true, name: true } } } }
      }
    });

    // 7. Recent CheckInOuts
    const recentActivity = await prisma.checkInOut.findMany({
      take: 6,
      orderBy: { actionDate: 'desc' },
      include: {
        handledBy: { select: { id: true, name: true } },
        equipment: { select: { id: true, assetTag: true, name: true } }
      }
    });

    // 8. Overdue List
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
      stats: {
        totalEquipment,
        availableCount,
        borrowedCount,
        maintenanceCount,
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
      overdueLoans,
      userStats
    });
  } catch (error) {
    next(error);
  }
};
