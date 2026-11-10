const { prisma } = require('../config/db');
const { logAudit } = require('../utils/auditLogger');

// 1. Get all borrow requests (User gets their own; Admin/Stock gets all)
exports.getAllRequests = async (req, res, next) => {
  try {
    const { status, search, userId } = req.query;
    const isStaff = ['ADMIN', 'STOCK_CONTROLLER'].includes(req.user.role);

    const where = {};

    // Non-staff can only see their own requests unless specified
    if (!isStaff) {
      where.userId = req.user.id;
    } else if (userId && userId !== 'ALL') {
      where.userId = userId;
    }

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (search && search.trim() !== '') {
      const q = search.trim();
      where.OR = [
        { requestNumber: { contains: q, mode: 'insensitive' } },
        { purpose: { contains: q, mode: 'insensitive' } },
        { destination: { contains: q, mode: 'insensitive' } },
        { user: { name: { contains: q, mode: 'insensitive' } } },
        { project: { title: { contains: q, mode: 'insensitive' } } }
      ];
    }

    const requests = await prisma.borrowRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true, department: true, phone: true }
        },
        project: {
          select: { id: true, projectCode: true, title: true, client: true }
        },
        approvedBy: {
          select: { id: true, name: true }
        },
        items: {
          include: {
            equipment: {
              select: {
                id: true,
                assetTag: true,
                name: true,
                brand: true,
                model: true,
                status: true,
                condition: true,
                imageUrl: true,
                location: true,
                accessories: true
              }
            }
          }
        },
        checkInsOuts: {
          orderBy: { actionDate: 'desc' },
          include: {
            handledBy: { select: { id: true, name: true } }
          }
        }
      }
    });

    return res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    next(error);
  }
};

// 2. Get single request by ID
exports.getRequestById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isStaff = ['ADMIN', 'STOCK_CONTROLLER'].includes(req.user.role);

    const request = await prisma.borrowRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true, department: true, phone: true }
        },
        project: true,
        approvedBy: {
          select: { id: true, name: true, email: true }
        },
        items: {
          include: {
            equipment: {
              include: {
                category: true
              }
            }
          }
        },
        checkInsOuts: {
          orderBy: { actionDate: 'desc' },
          include: {
            handledBy: { select: { id: true, name: true } },
            equipment: { select: { id: true, assetTag: true, name: true } }
          }
        }
      }
    });

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    if (!isStaff && request.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    return res.json({
      success: true,
      data: request
    });
  } catch (error) {
    next(error);
  }
};

// 3. Create new borrow request
exports.createRequest = async (req, res, next) => {
  try {
    const { projectId, startDate, endDate, purpose, destination, equipmentIds, notes } = req.body;

    if (!startDate || !endDate || !purpose) {
      return res.status(400).json({
        success: false,
        message: 'Start Date, End Date, and Purpose are required.'
      });
    }

    if (!equipmentIds || !Array.isArray(equipmentIds) || equipmentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please select at least one equipment item to request.'
      });
    }

    const normalizedItems = equipmentIds.map(item => {
      if (typeof item === 'string') return { equipmentId: item, quantity: 1 };
      return { equipmentId: item.id || item.equipmentId, quantity: item.quantity || 1 };
    });
    const ids = normalizedItems.map(i => i.equipmentId);

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) {
      return res.status(400).json({
        success: false,
        message: 'End date cannot be earlier than start date.'
      });
    }

    // Verify equipment availability
    const requestedEquipment = await prisma.equipment.findMany({
      where: { id: { in: ids } }
    });

    if (requestedEquipment.length !== ids.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more selected equipment items do not exist.'
      });
    }

    const unavailable = requestedEquipment.filter(e => {
      const avail = e.availableQuantity !== undefined ? e.availableQuantity : (e.status === 'AVAILABLE' ? 1 : 0);
      return avail <= 0 || e.status === 'UNDER_MAINTENANCE' || e.status === 'DAMAGED' || e.status === 'RETIRED';
    });
    if (unavailable.length > 0) {
      const names = unavailable.map(e => `${e.assetTag} (${e.name})`).join(', ');
      return res.status(400).json({
        success: false,
        message: `The following items have no available stock: ${names}`
      });
    }

    // Generate requestNumber REQ-YYYY-XXX
    const year = new Date().getFullYear();
    const count = await prisma.borrowRequest.count();
    const requestNumber = `REQ-${year}-${String(count + 1).padStart(3, '0')}`;

    const newRequest = await prisma.borrowRequest.create({
      data: {
        requestNumber,
        userId: req.user.id,
        projectId: projectId || null,
        startDate: start,
        endDate: end,
        purpose: purpose.trim(),
        destination: destination ? destination.trim() : null,
        status: 'PENDING',
        notes: notes ? notes.trim() : null,
        items: {
          create: ids.map(eqId => ({
            equipmentId: eqId,
            status: 'REQUESTED'
          }))
        }
      },
      include: {
        items: {
          include: { equipment: true }
        },
        project: true
      }
    });

    // Notify Admins and Stock Controllers
    const staffUsers = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'STOCK_CONTROLLER'] } }
    });

    for (const staff of staffUsers) {
      await prisma.notification.create({
        data: {
          userId: staff.id,
          title: 'New Equipment Request',
          message: `${req.user.name} submitted ${newRequest.requestNumber} for ${requestedEquipment.length} item(s).`,
          type: 'INFO',
          link: '/requests'
        }
      });
    }

    await logAudit({
      userId: req.user.id,
      action: 'CREATE_REQUEST',
      entity: 'BorrowRequest',
      entityId: newRequest.id,
      details: { requestNumber: newRequest.requestNumber, itemsCount: equipmentIds.length },
      req
    });

    return res.status(201).json({
      success: true,
      message: 'Borrow request submitted successfully.',
      data: newRequest
    });
  } catch (error) {
    next(error);
  }
};

// 4. Approve request (Admin / Stock Controller)
exports.approveRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const request = await prisma.borrowRequest.findUnique({
      where: { id },
      include: { items: true, user: true }
    });

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Only PENDING requests can be approved. Current status: ${request.status}`
      });
    }

    const updated = await prisma.borrowRequest.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedById: req.user.id,
        approvedAt: new Date(),
        notes: notes ? `${request.notes || ''}\nApproval Note: ${notes}`.trim() : request.notes
      },
      include: {
        items: { include: { equipment: true } },
        user: true
      }
    });

    // Notify requester
    await prisma.notification.create({
      data: {
        userId: request.userId,
        title: 'Borrow Request Approved',
        message: `Your request ${request.requestNumber} has been approved by ${req.user.name}. You may proceed to checkout.`,
        type: 'SUCCESS',
        link: '/requests'
      }
    });

    await logAudit({
      userId: req.user.id,
      action: 'APPROVE_REQUEST',
      entity: 'BorrowRequest',
      entityId: id,
      details: { requestNumber: request.requestNumber, approvedBy: req.user.name },
      req
    });

    return res.json({
      success: true,
      message: `Request ${request.requestNumber} approved successfully.`,
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

// 5. Reject request (Admin / Stock Controller)
exports.rejectRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required.'
      });
    }

    const request = await prisma.borrowRequest.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Only PENDING requests can be rejected. Current status: ${request.status}`
      });
    }

    const updated = await prisma.borrowRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionReason: rejectionReason.trim(),
        approvedById: req.user.id
      }
    });

    // Notify requester
    await prisma.notification.create({
      data: {
        userId: request.userId,
        title: 'Borrow Request Rejected',
        message: `Your request ${request.requestNumber} was rejected. Reason: ${rejectionReason.trim()}`,
        type: 'DANGER',
        link: '/requests'
      }
    });

    await logAudit({
      userId: req.user.id,
      action: 'REJECT_REQUEST',
      entity: 'BorrowRequest',
      entityId: id,
      details: { requestNumber: request.requestNumber, reason: rejectionReason },
      req
    });

    return res.json({
      success: true,
      message: `Request ${request.requestNumber} rejected.`,
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

// 6. Cancel request (requester only, when pending)
exports.cancelRequest = async (req, res, next) => {
  try {
    const { id } = req.params;

    const request = await prisma.borrowRequest.findUnique({ where: { id } });
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    if (request.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Only pending requests can be cancelled.'
      });
    }

    const updated = await prisma.borrowRequest.update({
      where: { id },
      data: { status: 'CANCELLED' }
    });

    return res.json({
      success: true,
      message: `Request ${request.requestNumber} cancelled.`,
      data: updated
    });
  } catch (error) {
    next(error);
  }
};
