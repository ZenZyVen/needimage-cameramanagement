const { prisma } = require('../config/db');
const { logAudit } = require('../utils/auditLogger');

// 1. Get all maintenance tickets
exports.getAllMaintenance = async (req, res, next) => {
  try {
    const { status, severity, equipmentId } = req.query;
    const where = {};

    if (status && status !== 'ALL') where.status = status;
    if (severity && severity !== 'ALL') where.severity = severity;
    if (equipmentId) where.equipmentId = equipmentId;

    const tickets = await prisma.maintenance.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        equipment: {
          select: {
            id: true,
            assetTag: true,
            name: true,
            brand: true,
            model: true,
            serialNumber: true,
            status: true,
            imageUrl: true
          }
        },
        reportedBy: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return res.json({
      success: true,
      data: tickets
    });
  } catch (error) {
    next(error);
  }
};

// 2. Create new maintenance / damage ticket
exports.createMaintenance = async (req, res, next) => {
  try {
    const {
      equipmentId,
      issueTitle,
      description,
      severity = 'MEDIUM',
      vendor,
      cost,
      scheduledDate,
      notes
    } = req.body;

    if (!equipmentId || !issueTitle || !description) {
      return res.status(400).json({
        success: false,
        message: 'Equipment, Issue Title, and Description are required.'
      });
    }

    const eq = await prisma.equipment.findUnique({ where: { id: equipmentId } });
    if (!eq) {
      return res.status(404).json({ success: false, message: 'Equipment not found.' });
    }

    // Auto-generate ticket number MNT-YYYY-XXX
    const year = new Date().getFullYear();
    const count = await prisma.maintenance.count();
    const ticketNumber = `MNT-${year}-${String(count + 1).padStart(3, '0')}`;

    const newTicket = await prisma.maintenance.create({
      data: {
        ticketNumber,
        equipmentId,
        reportedById: req.user.id,
        issueTitle: issueTitle.trim(),
        description: description.trim(),
        severity,
        status: 'REPORTED',
        vendor: vendor ? vendor.trim() : null,
        cost: cost ? parseFloat(cost) : null,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        notes: notes ? notes.trim() : null
      },
      include: {
        equipment: true,
        reportedBy: { select: { id: true, name: true } }
      }
    });

    // Update equipment status to UNDER_MAINTENANCE
    await prisma.equipment.update({
      where: { id: equipmentId },
      data: { status: 'UNDER_MAINTENANCE' }
    });

    await logAudit({
      userId: req.user.id,
      action: 'CREATE_MAINTENANCE',
      entity: 'Maintenance',
      entityId: newTicket.id,
      details: { ticketNumber, equipment: eq.assetTag },
      req
    });

    return res.status(201).json({
      success: true,
      message: `Maintenance ticket ${ticketNumber} created successfully.`,
      data: newTicket
    });
  } catch (error) {
    next(error);
  }
};

// 3. Update maintenance ticket
exports.updateMaintenance = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      issueTitle,
      description,
      severity,
      status,
      vendor,
      cost,
      scheduledDate,
      resolutionNotes
    } = req.body;

    const existing = await prisma.maintenance.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    const updated = await prisma.maintenance.update({
      where: { id },
      data: {
        issueTitle: issueTitle ? issueTitle.trim() : undefined,
        description: description ? description.trim() : undefined,
        severity: severity || undefined,
        status: status || undefined,
        vendor: vendor !== undefined ? (vendor ? vendor.trim() : null) : undefined,
        cost: cost !== undefined ? (cost ? parseFloat(cost) : null) : undefined,
        scheduledDate: scheduledDate !== undefined ? (scheduledDate ? new Date(scheduledDate) : null) : undefined,
        resolutionNotes: resolutionNotes !== undefined ? (resolutionNotes ? resolutionNotes.trim() : null) : undefined
      },
      include: {
        equipment: true
      }
    });

    return res.json({
      success: true,
      message: 'Maintenance ticket updated.',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

// 4. Resolve maintenance ticket
exports.resolveMaintenance = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { resolutionNotes, cost, finalStatus = 'RESOLVED', equipmentCondition = 'GOOD' } = req.body;

    const ticket = await prisma.maintenance.findUnique({
      where: { id },
      include: { equipment: true }
    });

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    const updatedTicket = await prisma.maintenance.update({
      where: { id },
      data: {
        status: finalStatus,
        completedDate: new Date(),
        cost: cost !== undefined ? parseFloat(cost) : ticket.cost,
        resolutionNotes: resolutionNotes ? resolutionNotes.trim() : ticket.resolutionNotes
      }
    });

    // Update equipment back to AVAILABLE (or RETIRED if written off)
    const newEqStatus = finalStatus === 'WRITTEN_OFF' ? 'RETIRED' : 'AVAILABLE';
    await prisma.equipment.update({
      where: { id: ticket.equipmentId },
      data: {
        status: newEqStatus,
        condition: equipmentCondition
      }
    });

    await logAudit({
      userId: req.user.id,
      action: 'RESOLVE_MAINTENANCE',
      entity: 'Maintenance',
      entityId: id,
      details: { ticketNumber: ticket.ticketNumber, finalStatus },
      req
    });

    return res.json({
      success: true,
      message: `Maintenance ticket ${ticket.ticketNumber} marked as ${finalStatus}.`,
      data: updatedTicket
    });
  } catch (error) {
    next(error);
  }
};
