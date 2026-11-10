const { prisma } = require('../config/db');
const { logAudit } = require('../utils/auditLogger');

// 1. Equipment Checkout (Handover)
exports.checkoutItems = async (req, res, next) => {
  try {
    const {
      requestId,
      itemIds, // array of equipmentId or borrowRequestItemId
      borrowerName,
      borrowerSignature,
      accessoriesChecked,
      notes
    } = req.body;

    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one equipment item must be selected for checkout.'
      });
    }

    let request = null;
    if (requestId) {
      request = await prisma.borrowRequest.findUnique({
        where: { id: requestId },
        include: { items: true, user: true }
      });

      if (!request) {
        return res.status(404).json({ success: false, message: 'Borrow request not found.' });
      }

      if (!['APPROVED', 'CHECKED_OUT', 'PARTIALLY_RETURNED'].includes(request.status)) {
        return res.status(400).json({
          success: false,
          message: `Cannot checkout request with status ${request.status}. Must be APPROVED first.`
        });
      }
    }

    const handledById = req.user.id;
    const finalBorrower = borrowerName || (request ? request.user.name : 'Crew Member');

    const checkOutRecords = [];

    // Transaction to update equipment, request items, and create CheckInOut log
    await prisma.$transaction(async (tx) => {
      for (const eqId of itemIds) {
        // Find equipment
        const eq = await tx.equipment.findUnique({ where: { id: eqId } });
        if (!eq) continue;

        // Create CheckInOut record
        const record = await tx.checkInOut.create({
          data: {
            requestId: requestId || null,
            equipmentId: eqId,
            type: 'CHECK_OUT',
            handledById,
            borrowerName: finalBorrower,
            borrowerSignature: borrowerSignature || null,
            conditionAtAction: eq.condition,
            accessoriesChecked: accessoriesChecked || eq.accessories,
            actionDate: new Date(),
            notes: notes ? notes.trim() : null
          }
        });
        checkOutRecords.push(record);

        // Update Equipment status to BORROWED
        await tx.equipment.update({
          where: { id: eqId },
          data: { status: 'BORROWED' }
        });

        // Update BorrowRequestItem if in request
        if (requestId) {
          await tx.borrowRequestItem.updateMany({
            where: {
              requestId,
              equipmentId: eqId
            },
            data: { status: 'CHECKED_OUT' }
          });
        }
      }

      // Update request overall status if all items checked out
      if (requestId) {
        await tx.borrowRequest.update({
          where: { id: requestId },
          data: { status: 'CHECKED_OUT' }
        });

        // Notify user
        if (request && request.userId) {
          await tx.notification.create({
            data: {
              userId: request.userId,
              title: 'Equipment Handed Over',
              message: `${itemIds.length} item(s) from ${request.requestNumber} have been checked out by ${req.user.name}.`,
              type: 'SUCCESS',
              link: `/requests/${request.id}`
            }
          });
        }
      }
    });

    await logAudit({
      userId: req.user.id,
      action: 'CHECK_OUT',
      entity: 'CheckInOut',
      entityId: requestId || itemIds[0],
      details: { itemsCount: itemIds.length, borrower: finalBorrower },
      req
    });

    return res.json({
      success: true,
      message: `Successfully checked out ${itemIds.length} item(s) to ${finalBorrower}.`,
      data: checkOutRecords
    });
  } catch (error) {
    next(error);
  }
};

// 2. Equipment Check-in (Return & Inspection)
exports.checkinItems = async (req, res, next) => {
  try {
    const {
      requestId,
      items, // array of: { equipmentId, condition, missingAccessories, damageReported, damageNotes, notes }
      borrowerName,
      staffSignature
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one item return must be provided.'
      });
    }

    let request = null;
    if (requestId) {
      request = await prisma.borrowRequest.findUnique({
        where: { id: requestId },
        include: { items: true, user: true }
      });
    }

    const handledById = req.user.id;
    const finalBorrower = borrowerName || (request ? request.user.name : 'Returning Crew');
    const returnRecords = [];

    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        const {
          equipmentId,
          condition = 'GOOD',
          missingAccessories = [],
          damageReported = false,
          damageNotes,
          notes
        } = item;

        const eq = await tx.equipment.findUnique({ where: { id: equipmentId } });
        if (!eq) continue;

        // Determine new equipment status
        let newStatus = 'AVAILABLE';
        let newCondition = condition;

        if (damageReported || condition === 'DAMAGED' || condition === 'POOR') {
          newStatus = 'UNDER_MAINTENANCE';
          newCondition = condition === 'DAMAGED' ? 'DAMAGED' : 'POOR';

          // Automatically generate Maintenance Ticket if damaged
          const year = new Date().getFullYear();
          const mntCount = await tx.maintenance.count();
          const ticketNumber = `MNT-${year}-${String(mntCount + 1).padStart(3, '0')}`;

          await tx.maintenance.create({
            data: {
              ticketNumber,
              equipmentId,
              reportedById: handledById,
              issueTitle: `Damage reported upon check-in: ${eq.name}`,
              description: damageNotes || `Returned in ${condition} condition. Missing accessories: ${JSON.stringify(missingAccessories)}`,
              severity: condition === 'DAMAGED' ? 'HIGH' : 'MEDIUM',
              status: 'REPORTED',
              notes: `Checked in by ${req.user.name}. Borrower: ${finalBorrower}`
            }
          });
        }

        // Create CheckInOut record for return
        const record = await tx.checkInOut.create({
          data: {
            requestId: requestId || null,
            equipmentId,
            type: 'CHECK_IN',
            handledById,
            borrowerName: finalBorrower,
            staffSignature: staffSignature || null,
            conditionAtAction: newCondition,
            missingAccessories: missingAccessories.length > 0 ? missingAccessories : null,
            damageReported: Boolean(damageReported),
            damageNotes: damageNotes || null,
            actionDate: new Date(),
            notes: notes ? notes.trim() : null
          }
        });
        returnRecords.push(record);

        // Update Equipment status
        await tx.equipment.update({
          where: { id: equipmentId },
          data: {
            status: newStatus,
            condition: newCondition
          }
        });

        // Update BorrowRequestItem
        if (requestId) {
          let itemLoanStatus = 'RETURNED';
          if (damageReported) itemLoanStatus = 'DAMAGED_RETURN';
          else if (missingAccessories.length > 0) itemLoanStatus = 'MISSING_RETURN';

          await tx.borrowRequestItem.updateMany({
            where: {
              requestId,
              equipmentId
            },
            data: {
              status: itemLoanStatus,
              returnedCondition: newCondition,
              notes: notes || damageNotes || null
            }
          });
        }
      }

      // Check overall request status if linked to a request
      if (requestId) {
        const remainingItems = await tx.borrowRequestItem.findMany({
          where: {
            requestId,
            status: { in: ['REQUESTED', 'PREPARED', 'CHECKED_OUT'] }
          }
        });

        const isFullyReturned = remainingItems.length === 0;

        await tx.borrowRequest.update({
          where: { id: requestId },
          data: {
            status: isFullyReturned ? 'RETURNED' : 'PARTIALLY_RETURNED',
            actualReturnDate: isFullyReturned ? new Date() : null
          }
        });

        if (request && request.userId) {
          await tx.notification.create({
            data: {
              userId: request.userId,
              title: isFullyReturned ? 'Equipment Return Complete' : 'Partial Equipment Return Received',
              message: isFullyReturned
                ? `All equipment for ${request.requestNumber} has been received and inspected.`
                : `${items.length} item(s) returned for ${request.requestNumber}. Some items remain checked out.`,
              type: isFullyReturned ? 'SUCCESS' : 'INFO',
              link: `/requests/${request.id}`
            }
          });
        }
      }
    });

    await logAudit({
      userId: req.user.id,
      action: 'CHECK_IN',
      entity: 'CheckInOut',
      entityId: requestId || items[0].equipmentId,
      details: { itemsCount: items.length, borrower: finalBorrower },
      req
    });

    return res.json({
      success: true,
      message: `Successfully checked in ${items.length} item(s).`,
      data: returnRecords
    });
  } catch (error) {
    next(error);
  }
};

// 3. Get Check In/Out History
exports.getHistory = async (req, res, next) => {
  try {
    const { type, equipmentId, requestId, page = 1, limit = 50 } = req.query;

    const where = {};
    if (type && type !== 'ALL') where.type = type;
    if (equipmentId) where.equipmentId = equipmentId;
    if (requestId) where.requestId = requestId;

    const take = parseInt(limit, 10);
    const skip = (parseInt(page, 10) - 1) * take;

    const [total, records] = await Promise.all([
      prisma.checkInOut.count({ where }),
      prisma.checkInOut.findMany({
        where,
        take,
        skip,
        orderBy: { actionDate: 'desc' },
        include: {
          handledBy: { select: { id: true, name: true, email: true } },
          equipment: {
            select: {
              id: true,
              assetTag: true,
              name: true,
              brand: true,
              model: true,
              serialNumber: true,
              imageUrl: true
            }
          },
          request: {
            select: {
              id: true,
              requestNumber: true,
              purpose: true,
              project: { select: { title: true } }
            }
          }
        }
      })
    ]);

    return res.json({
      success: true,
      total,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / take),
      data: records
    });
  } catch (error) {
    next(error);
  }
};
