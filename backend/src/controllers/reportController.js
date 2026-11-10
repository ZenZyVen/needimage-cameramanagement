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

// 4. Crew Field Work & Performance Report ("Who Went Out For Work")
exports.getCrewWorkReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const [requests, projects] = await Promise.all([
      prisma.borrowRequest.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true, department: true } },
          project: { select: { id: true, title: true, client: true, projectCode: true } },
          items: {
            include: {
              equipment: {
                select: {
                  id: true,
                  assetTag: true,
                  name: true,
                  brand: true,
                  purchasePrice: true,
                  dailyRate: true
                }
              }
            }
          }
        }
      }),
      prisma.project.findMany({
        orderBy: { startDate: 'desc' },
        select: { id: true, title: true, projectCode: true, startDate: true, endDate: true, notes: true }
      })
    ]);

    // 1. Crew Performance / Best Workers Ranking
    const crewStats = {};

    requests.forEach(reqItem => {
      const u = reqItem.user;
      if (!u) return;

      if (!crewStats[u.id]) {
        crewStats[u.id] = {
          userId: u.id,
          name: u.name,
          email: u.email,
          department: u.department || 'Production',
          totalShoots: 0,
          totalGearItems: 0,
          totalDaysInField: 0,
          totalAssetValue: 0,
          completedReturns: 0,
          activeLoans: 0
        };
      }

      crewStats[u.id].totalShoots += 1;
      const itemCount = reqItem.items?.length || 0;
      crewStats[u.id].totalGearItems += itemCount;

      const s = new Date(reqItem.startDate);
      const e = new Date(reqItem.endDate);
      const days = Math.max(1, Math.round((e - s) / (1000 * 60 * 60 * 24)));
      crewStats[u.id].totalDaysInField += days;

      const reqValue = reqItem.items?.reduce((sum, i) => sum + (i.equipment?.purchasePrice || 0), 0) || 0;
      crewStats[u.id].totalAssetValue += reqValue;

      if (reqItem.status === 'RETURNED') {
        crewStats[u.id].completedReturns += 1;
      } else if (['APPROVED', 'CHECKED_OUT'].includes(reqItem.status)) {
        crewStats[u.id].activeLoans += 1;
      }
    });

    const crewLeaderboard = Object.values(crewStats).sort((a, b) => {
      // Sort by total days in field first, then total shoots
      if (b.totalDaysInField !== a.totalDaysInField) return b.totalDaysInField - a.totalDaysInField;
      return b.totalShoots - a.totalShoots;
    });

    // Assign ranking badges
    crewLeaderboard.forEach((crew, idx) => {
      if (idx === 0) crew.rankBadge = 'Top Field Lead';
      else if (idx === 1) crew.rankBadge = 'Most Active Crew';
      else if (idx === 2) crew.rankBadge = 'Reliable Specialist';
      else crew.rankBadge = 'Active Crew';
    });

    // 2. Work by Day (Timeline breakdown)
    const dayMap = {};
    requests.forEach(reqItem => {
      const dateKey = new Date(reqItem.startDate).toISOString().substring(0, 10);
      if (!dayMap[dateKey]) {
        dayMap[dateKey] = {
          date: dateKey,
          shootsCount: 0,
          itemsDeployed: 0,
          crewMembers: new Set(),
          projectTitles: new Set()
        };
      }
      dayMap[dateKey].shootsCount += 1;
      dayMap[dateKey].itemsDeployed += (reqItem.items?.length || 0);
      if (reqItem.user?.name) dayMap[dateKey].crewMembers.add(reqItem.user.name);
      if (reqItem.project?.title) dayMap[dateKey].projectTitles.add(reqItem.project.title);
    });

    const workByDay = Object.values(dayMap)
      .map(d => ({
        date: d.date,
        shootsCount: d.shootsCount,
        itemsDeployed: d.itemsDeployed,
        crewMembers: Array.from(d.crewMembers),
        projects: Array.from(d.projectTitles)
      }))
      .sort((a, b) => b.date.localeCompare(a.date));

    // 3. Most Deployed Gear
    const gearMap = {};
    requests.forEach(reqItem => {
      reqItem.items?.forEach(i => {
        if (!i.equipment) return;
        const eq = i.equipment;
        if (!gearMap[eq.id]) {
          gearMap[eq.id] = {
            id: eq.id,
            assetTag: eq.assetTag,
            name: eq.name,
            brand: eq.brand,
            timesDeployed: 0,
            dailyRate: eq.dailyRate || 0
          };
        }
        gearMap[eq.id].timesDeployed += 1;
      });
    });

    const topGear = Object.values(gearMap)
      .sort((a, b) => b.timesDeployed - a.timesDeployed)
      .slice(0, 10);

    const totalDaysLogged = crewLeaderboard.reduce((sum, c) => sum + c.totalDaysInField, 0);

    return res.json({
      success: true,
      summary: {
        totalCrewMembers: crewLeaderboard.length,
        totalShootsLogged: requests.length,
        totalDaysLogged,
        topPerformer: crewLeaderboard[0]?.name || 'N/A'
      },
      crewLeaderboard,
      workByDay,
      topGear
    });
  } catch (error) {
    next(error);
  }
};
