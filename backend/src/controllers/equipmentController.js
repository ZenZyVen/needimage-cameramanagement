const { prisma } = require('../config/db');
const { generateQRCode } = require('../utils/qrGenerator');
const { logAudit } = require('../utils/auditLogger');
const { notifyTeam } = require('../utils/notify');
const {
  generateNextEquipmentCodes,
  stripDeletedSuffix,
  makeArchivedCode
} = require('../utils/codeGenerator');

// 0. Get next auto-generated Asset Tag & Serial Number (NE01, SN-NE01, ...)
exports.getNextEquipmentCodes = async (req, res, next) => {
  try {
    const codes = await generateNextEquipmentCodes(prisma);
    return res.json({
      success: true,
      data: codes
    });
  } catch (error) {
    next(error);
  }
};

// 1. Get all equipment with filters, search, soft-delete filter, and pagination
exports.getAllEquipment = async (req, res, next) => {
  try {
    const { categoryId, status, condition, search, page = 1, limit = 50, showDeleted = false } = req.query;

    const where = {};

    if (showDeleted === 'true' || showDeleted === true || status === 'RETIRED' || status === 'DELETED') {
      where.isDeleted = true;
    } else {
      where.isDeleted = false;
    }

    if (categoryId && categoryId !== 'ALL') {
      where.categoryId = categoryId;
    }

    if (status && status !== 'ALL' && status !== 'DELETED') {
      where.status = status;
    }

    if (condition && condition !== 'ALL') {
      where.condition = condition;
    }

    if (search && search.trim() !== '') {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { assetTag: { contains: q, mode: 'insensitive' } },
        { serialNumber: { contains: q, mode: 'insensitive' } },
        { brand: { contains: q, mode: 'insensitive' } },
        { model: { contains: q, mode: 'insensitive' } }
      ];
    }

    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const take = Math.min(500, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (safePage - 1) * take;

    const [total, equipment] = await Promise.all([
      prisma.equipment.count({ where }),
      prisma.equipment.findMany({
        where,
        take,
        skip,
        orderBy: { assetTag: 'asc' },
        include: {
          category: {
            select: { id: true, name: true, icon: true }
          },
          borrowItems: {
            where: { status: 'CHECKED_OUT' },
            include: {
              request: {
                select: {
                  id: true,
                  requestNumber: true,
                  startDate: true,
                  endDate: true,
                  user: { select: { id: true, name: true, email: true } },
                  project: { select: { id: true, title: true } }
                }
              }
            },
            take: 1
          }
        }
      })
    ]);

    return res.json({
      success: true,
      total,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / take),
      data: equipment
    });
  } catch (error) {
    next(error);
  }
};

// 2. Get single equipment by ID
exports.getEquipmentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const equipment = await prisma.equipment.findUnique({
      where: { id },
      include: {
        category: true,
        borrowItems: {
          take: 10,
          orderBy: { request: { createdAt: 'desc' } },
          include: {
            request: {
              include: {
                user: { select: { id: true, name: true, email: true } },
                project: { select: { id: true, title: true } }
              }
            }
          }
        },
        checkInsOuts: {
          take: 10,
          orderBy: { actionDate: 'desc' },
          include: {
            handledBy: { select: { id: true, name: true } }
          }
        },
        maintenances: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            reportedBy: { select: { id: true, name: true } }
          }
        }
      }
    });

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment item not found.'
      });
    }

    return res.json({
      success: true,
      data: equipment
    });
  } catch (error) {
    next(error);
  }
};

// 3. Lookup equipment by QR code, assetTag, or serialNumber (Fast Barcode/QR Scanner)
exports.lookupEquipment = async (req, res, next) => {
  try {
    const { code } = req.params;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Scan code is required.' });
    }

    let parsedTag = code.trim();
    // In case QR code contains JSON payload
    try {
      const parsed = JSON.parse(code);
      if (parsed.assetTag) parsedTag = parsed.assetTag;
      else if (parsed.serial) parsedTag = parsed.serial;
    } catch (e) {
      // plain text string
    }

    const equipment = await prisma.equipment.findFirst({
      where: {
        OR: [
          { assetTag: { equals: parsedTag, mode: 'insensitive' } },
          { serialNumber: { equals: parsedTag, mode: 'insensitive' } },
          { id: parsedTag }
        ]
      },
      include: {
        category: true,
        borrowItems: {
          where: { status: 'CHECKED_OUT' },
          include: {
            request: {
              include: {
                user: { select: { id: true, name: true, email: true, phone: true } },
                project: { select: { id: true, title: true } }
              }
            }
          },
          take: 1
        }
      }
    });

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: `No equipment found matching code or serial: "${code}"`
      });
    }

    return res.json({
      success: true,
      data: equipment
    });
  } catch (error) {
    next(error);
  }
};

// 4. Create new equipment item (Simplified form with Stock Management)
exports.createEquipment = async (req, res, next) => {
  try {
    const {
      assetTag,
      name,
      brand,
      model,
      serialNumber,
      categoryId,
      quantity = 1,
      availableQuantity,
      status,
      condition,
      purchaseDate,
      purchasePrice,
      dailyRate,
      imageUrl,
      notes
    } = req.body;

    if (!name || !categoryId) {
      return res.status(400).json({
        success: false,
        message: 'Equipment Name and Category are required.'
      });
    }

    const wasAutoTag = !(assetTag && assetTag.trim());
    const wasAutoSerial = !(serialNumber && serialNumber.trim());
    const autoCodes = (wasAutoTag || wasAutoSerial)
      ? await generateNextEquipmentCodes(prisma)
      : null;

    let cleanTag = !wasAutoTag ? assetTag.trim().toUpperCase() : autoCodes.assetTag;
    let cleanSerial = !wasAutoSerial ? serialNumber.trim() : autoCodes.serialNumber;
    const cleanBrand = (brand && brand.trim()) ? brand.trim() : 'General';

    // Check unique constraints (allow reclaiming codes from archived/soft-deleted items)
    const conflicts = await prisma.equipment.findMany({
      where: {
        OR: [
          { assetTag: cleanTag },
          { serialNumber: cleanSerial }
        ]
      }
    });

    const activeConflict = conflicts.find(c => !c.isDeleted);
    if (activeConflict) {
      const matchField = activeConflict.assetTag.toUpperCase() === cleanTag ? 'Asset Tag' : 'Serial Number';
      return res.status(409).json({
        success: false,
        message: `Equipment with this ${matchField} already exists.`
      });
    }

    // Release slots held by legacy soft-deleted rows so deleted codes auto-fill seamlessly
    for (let i = 0; i < conflicts.length; i += 1) {
      const archived = conflicts[i];
      const stamp = `${Date.now()}_${i}`;
      await prisma.equipment.update({
        where: { id: archived.id },
        data: {
          assetTag: makeArchivedCode(archived.assetTag, stamp),
          serialNumber: makeArchivedCode(archived.serialNumber, stamp)
        }
      });
    }

    const parsedQty = Math.max(1, parseInt(quantity, 10) || 1);
    const parsedAvail = availableQuantity !== undefined ? Math.max(0, parseInt(availableQuantity, 10)) : parsedQty;

    let initialStatus = status || 'AVAILABLE';
    if (parsedAvail === 0) initialStatus = 'OUT_OF_STOCK';

    let newEquipment = null;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const qrPayload = {
        assetTag: cleanTag,
        name: name.trim(),
        serial: cleanSerial,
        brand: cleanBrand,
        model: model ? model.trim() : ''
      };
      const qrCode = await generateQRCode(qrPayload);

      try {
        newEquipment = await prisma.equipment.create({
          data: {
            assetTag: cleanTag,
            name: name.trim(),
            brand: cleanBrand,
            model: model ? model.trim() : '',
            serialNumber: cleanSerial,
            categoryId,
            quantity: parsedQty,
            availableQuantity: parsedAvail,
            status: initialStatus,
            condition: condition || 'EXCELLENT',
            purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
            purchasePrice: purchasePrice ? parseFloat(purchasePrice) : null,
            dailyRate: dailyRate ? parseFloat(dailyRate) : null,
            imageUrl: imageUrl || null,
            notes: notes ? notes.trim() : null,
            qrCode,
            isDeleted: false
          },
          include: {
            category: true
          }
        });
        break;
      } catch (err) {
        if (err.code === 'P2002' && (wasAutoTag || wasAutoSerial) && attempt < 2) {
          const retryCodes = await generateNextEquipmentCodes(prisma);
          if (wasAutoTag) cleanTag = retryCodes.assetTag;
          if (wasAutoSerial) cleanSerial = retryCodes.serialNumber;
          continue;
        }
        throw err;
      }
    }

    await logAudit({
      userId: req.user.id,
      action: 'CREATE_EQUIPMENT',
      entity: 'Equipment',
      entityId: newEquipment.id,
      details: { assetTag: newEquipment.assetTag, name: newEquipment.name, quantity: parsedQty },
      req
    });

    if (prisma.stockMovement?.create) {
      await prisma.stockMovement.create({
        data: {
          equipmentId: newEquipment.id,
          assetTag: newEquipment.assetTag,
          equipmentName: newEquipment.name,
          type: 'INITIAL_STOCK',
          quantityChanged: parsedQty,
          previousAvailable: 0,
          newAvailable: parsedAvail,
          previousTotal: 0,
          newTotal: parsedQty,
          reference: 'VAULT_REGISTRATION',
          notes: 'Registered new equipment in vault.',
          performedBy: req.user?.name || 'Admin'
        }
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Equipment registered successfully.',
      data: newEquipment
    });
  } catch (error) {
    next(error);
  }
};

// 5. Update equipment item
exports.updateEquipment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      assetTag,
      name,
      brand,
      model,
      serialNumber,
      categoryId,
      quantity,
      availableQuantity,
      status,
      condition,
      purchaseDate,
      purchasePrice,
      dailyRate,
      imageUrl,
      notes
    } = req.body;

    const existing = await prisma.equipment.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Equipment not found.' });
    }

    const updatedTag = assetTag ? assetTag.trim().toUpperCase() : existing.assetTag;
    const updatedSerial = serialNumber ? serialNumber.trim() : existing.serialNumber;
    const updatedName = name ? name.trim() : existing.name;

    // Check unique conflicts if tag or serial changed
    if (updatedTag !== existing.assetTag) {
      const tagExists = await prisma.equipment.findUnique({ where: { assetTag: updatedTag } });
      if (tagExists && tagExists.id !== id) {
        return res.status(409).json({ success: false, message: 'Asset Tag is already assigned to another item.' });
      }
    }

    if (updatedSerial !== existing.serialNumber) {
      const serialExists = await prisma.equipment.findUnique({ where: { serialNumber: updatedSerial } });
      if (serialExists && serialExists.id !== id) {
        return res.status(409).json({ success: false, message: 'Serial Number is already assigned to another item.' });
      }
    }

    // Regenerate QR code if tag, serial, or name changed
    let qrCode = existing.qrCode;
    if (updatedTag !== existing.assetTag || updatedSerial !== existing.serialNumber || updatedName !== existing.name) {
      qrCode = await generateQRCode({
        assetTag: updatedTag,
        name: updatedName,
        serial: updatedSerial,
        brand: brand ? brand.trim() : existing.brand,
        model: model ? model.trim() : existing.model
      });
    }

    const newQty = quantity !== undefined ? Math.max(0, parseInt(quantity, 10)) : existing.quantity;
    let newAvail = availableQuantity !== undefined ? Math.max(0, parseInt(availableQuantity, 10)) : existing.availableQuantity;
    if (newAvail > newQty) newAvail = newQty;

    let targetStatus = status || existing.status;
    if (newAvail === 0 && targetStatus === 'AVAILABLE') {
      targetStatus = newQty > 0 ? 'BORROWED' : 'OUT_OF_STOCK';
    } else if (newAvail > 0 && targetStatus === 'OUT_OF_STOCK') {
      targetStatus = 'AVAILABLE';
    }

    const updated = await prisma.equipment.update({
      where: { id },
      data: {
        assetTag: updatedTag,
        name: updatedName,
        brand: brand ? brand.trim() : undefined,
        model: model !== undefined ? model.trim() : undefined,
        serialNumber: updatedSerial,
        categoryId: categoryId || undefined,
        quantity: newQty,
        availableQuantity: newAvail,
        status: targetStatus,
        condition: condition || undefined,
        purchaseDate: purchaseDate !== undefined ? (purchaseDate ? new Date(purchaseDate) : null) : undefined,
        purchasePrice: purchasePrice !== undefined ? (purchasePrice ? parseFloat(purchasePrice) : null) : undefined,
        dailyRate: dailyRate !== undefined ? (dailyRate ? parseFloat(dailyRate) : null) : undefined,
        imageUrl: imageUrl !== undefined ? imageUrl : undefined,
        notes: notes !== undefined ? notes.trim() : undefined,
        qrCode
      },
      include: {
        category: true
      }
    });

    await logAudit({
      userId: req.user.id,
      action: 'UPDATE_EQUIPMENT',
      entity: 'Equipment',
      entityId: id,
      details: { assetTag: updated.assetTag, name: updated.name },
      req
    });

    if (
      (newQty !== existing.quantity || newAvail !== existing.availableQuantity) &&
      prisma.stockMovement?.create
    ) {
      await prisma.stockMovement.create({
        data: {
          equipmentId: id,
          assetTag: updated.assetTag,
          equipmentName: updated.name,
          type: 'ADJUSTMENT',
          quantityChanged: newAvail - existing.availableQuantity,
          previousAvailable: existing.availableQuantity,
          newAvailable: newAvail,
          previousTotal: existing.quantity,
          newTotal: newQty,
          reference: 'MANUAL_UPDATE',
          notes: 'Stock levels updated via equipment editor.',
          performedBy: req.user?.name || 'Admin'
        }
      });
    }

    // Notify staff of record update
    await notifyTeam({
      notifyStaff: true,
      actorId: req.user.id,
      title: 'Equipment Record Updated',
      message: `${req.user.name} updated gear details for [${updated.assetTag}] ${updated.name}.`,
      type: 'INFO',
      link: '/equipment'
    });

    return res.json({
      success: true,
      message: 'Equipment updated successfully.',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

// 6. Delete equipment item (Soft-delete to archive with permanent option; Admin can force-delete anytime)
exports.deleteEquipment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { permanent = false, force = false } = req.query;

    const equipment = await prisma.equipment.findUnique({
      where: { id },
      include: {
        borrowItems: {
          where: { status: 'CHECKED_OUT' }
        },
        _count: {
          select: {
            borrowItems: true,
            checkInsOuts: true,
            maintenances: true
          }
        }
      }
    });

    if (!equipment) {
      return res.status(404).json({ success: false, message: 'Equipment not found.' });
    }

    const isAdmin = req.user.role === 'ADMIN';
    const activeCheckouts = Array.isArray(equipment.borrowItems)
      ? equipment.borrowItems.filter(b => b.status === 'CHECKED_OUT')
      : [];

    if (!isAdmin && activeCheckouts.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete equipment that is currently checked out on a loan.'
      });
    }

    const originalTag = stripDeletedSuffix(equipment.assetTag);
    const originalSerial = stripDeletedSuffix(equipment.serialNumber);
    const counts = equipment._count || {};
    const hasLinkedHistory =
      (counts.borrowItems || 0) +
      (counts.checkInsOuts || 0) +
      (counts.maintenances || 0) > 0;

    let actionType = 'moved to archive';
    const wantPermanent = permanent === 'true' || permanent === true || force === 'true' || force === true;

    if (wantPermanent && (isAdmin || !hasLinkedHistory)) {
      await prisma.$transaction(async (tx) => {
        if (tx.borrowRequestItem?.deleteMany) {
          await tx.borrowRequestItem.deleteMany({ where: { equipmentId: id } });
        }
        if (tx.checkInOut?.deleteMany) {
          await tx.checkInOut.deleteMany({ where: { equipmentId: id } });
        }
        if (tx.maintenance?.deleteMany) {
          await tx.maintenance.deleteMany({ where: { equipmentId: id } });
        }
        if (tx.stockMovement?.deleteMany) {
          await tx.stockMovement.deleteMany({ where: { equipmentId: id } });
        }
        await tx.equipment.delete({ where: { id } });
      }, {
        maxWait: 10000,
        timeout: 30000
      });
      actionType = 'permanently deleted';
    } else {
      const archiveStamp = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      await prisma.$transaction(async (tx) => {
        if (isAdmin && activeCheckouts.length > 0 && tx.borrowRequestItem?.updateMany) {
          await tx.borrowRequestItem.updateMany({
            where: { equipmentId: id, status: 'CHECKED_OUT' },
            data: { status: 'RETURNED' }
          });
        }
        await tx.equipment.update({
          where: { id },
          data: {
            isDeleted: true,
            deletedAt: new Date(),
            status: 'RETIRED',
            assetTag: makeArchivedCode(originalTag, archiveStamp),
            serialNumber: makeArchivedCode(originalSerial, archiveStamp)
          }
        });
      }, {
        maxWait: 10000,
        timeout: 30000
      });
      actionType = wantPermanent
        ? 'archived (linked history preserved; code released)'
        : 'moved to archive (code released for reuse)';
    }

    await logAudit({
      userId: req.user.id,
      action: 'DELETE_EQUIPMENT',
      entity: 'Equipment',
      entityId: id,
      details: { assetTag: originalTag, name: equipment.name, permanent: wantPermanent, actionType },
      req
    });

    return res.json({
      success: true,
      message: `Equipment ${originalTag} ${actionType}.`
    });
  } catch (error) {
    next(error);
  }
};

// 7. Restore equipment from archive
exports.restoreEquipment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const equipment = await prisma.equipment.findUnique({ where: { id } });
    if (!equipment) {
      return res.status(404).json({ success: false, message: 'Equipment item not found.' });
    }

    const avail = equipment.availableQuantity !== undefined ? equipment.availableQuantity : equipment.quantity;
    const targetStatus = avail > 0 ? 'AVAILABLE' : 'OUT_OF_STOCK';

    const recoveredTag = stripDeletedSuffix(equipment.assetTag);
    const recoveredSerial = stripDeletedSuffix(equipment.serialNumber);

    const collisions = await prisma.equipment.findMany({
      where: {
        OR: [
          { assetTag: recoveredTag },
          { serialNumber: recoveredSerial }
        ]
      }
    });
    const otherConflict = collisions.some(item => item.id !== id);

    let finalTag = recoveredTag;
    let finalSerial = recoveredSerial;
    if (otherConflict || !finalTag || !finalSerial) {
      const nextCodes = await generateNextEquipmentCodes(prisma);
      finalTag = nextCodes.assetTag;
      finalSerial = nextCodes.serialNumber;
    }

    let qrCode = equipment.qrCode;
    if (finalTag !== equipment.assetTag || finalSerial !== equipment.serialNumber) {
      qrCode = await generateQRCode({
        assetTag: finalTag,
        name: equipment.name,
        serial: finalSerial,
        brand: equipment.brand,
        model: equipment.model || ''
      });
    }

    const restored = await prisma.equipment.update({
      where: { id },
      data: {
        isDeleted: false,
        deletedAt: null,
        status: targetStatus,
        assetTag: finalTag,
        serialNumber: finalSerial,
        qrCode
      },
      include: { category: true }
    });

    await logAudit({
      userId: req.user.id,
      action: 'RESTORE_EQUIPMENT',
      entity: 'Equipment',
      entityId: id,
      details: { assetTag: restored.assetTag, name: restored.name },
      req
    });

    return res.json({
      success: true,
      message: `Equipment ${restored.assetTag} successfully restored to active stock.`,
      data: restored
    });
  } catch (error) {
    next(error);
  }
};

// 8. Adjust / Restock equipment stock quantity
exports.adjustStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { adjustment, reason, notes, type } = req.body;
    const delta = parseInt(adjustment, 10);
    if (isNaN(delta) || delta === 0) {
      return res.status(400).json({ success: false, message: 'Valid non-zero adjustment amount required.' });
    }

    const equipment = await prisma.equipment.findUnique({ where: { id } });
    if (!equipment) {
      return res.status(404).json({ success: false, message: 'Equipment item not found.' });
    }

    const currentQty = equipment.quantity || 1;
    const currentAvail = equipment.availableQuantity !== undefined ? equipment.availableQuantity : currentQty;
    const isAdmin = req.user.role === 'ADMIN';

    // Non-admins cannot remove more stock than is physically available in the vault
    if (!isAdmin && delta < 0 && Math.abs(delta) > currentAvail) {
      return res.status(400).json({
        success: false,
        message: `Cannot remove ${Math.abs(delta)} unit(s). Only ${currentAvail} unit(s) are currently available in the vault (some may be checked out on active loans).`
      });
    }

    const newQty = Math.max(0, currentQty + delta);
    const newAvail = Math.min(newQty, Math.max(0, currentAvail + delta));

    let newStatus = equipment.status;
    if (newAvail <= 0 && newStatus === 'AVAILABLE') {
      newStatus = newQty > 0 ? 'BORROWED' : 'OUT_OF_STOCK';
    } else if (newAvail > 0 && ['OUT_OF_STOCK', 'BORROWED'].includes(newStatus)) {
      newStatus = 'AVAILABLE';
    }

    const updated = await prisma.equipment.update({
      where: { id },
      data: {
        quantity: newQty,
        availableQuantity: newAvail,
        status: newStatus
      },
      include: { category: true }
    });

    const movementType = type || (delta > 0 ? 'RESTOCK' : 'STOCK_REDUCTION');
    const performedByName = req.user?.name || 'Administrator';

    if (prisma.stockMovement?.create) {
      await prisma.stockMovement.create({
        data: {
          equipmentId: id,
          assetTag: equipment.assetTag,
          equipmentName: equipment.name,
          type: movementType,
          quantityChanged: delta,
          previousAvailable: currentAvail,
          newAvailable: newAvail,
          previousTotal: currentQty,
          newTotal: newQty,
          reference: reason || (delta > 0 ? 'RESTOCK_INTAKE' : 'STOCK_DEDUCTION'),
          notes: notes ? notes.trim() : null,
          performedBy: performedByName
        }
      });
    }

    await logAudit({
      userId: req.user.id,
      action: delta > 0 ? 'RESTOCK_EQUIPMENT' : 'REDUCE_STOCK',
      entity: 'Equipment',
      entityId: id,
      details: {
        assetTag: equipment.assetTag,
        name: equipment.name,
        delta,
        actionType: movementType,
        previousAvailable: currentAvail,
        newAvailable: newAvail,
        previousTotal: currentQty,
        newTotal: newQty,
        reason: reason || null,
        notes: notes || null
      },
      req
    });

    // Notify all staff in real-time
    await notifyTeam({
      notifyStaff: true,
      actorId: req.user.id,
      title: delta > 0 ? 'Equipment Restocked' : 'Equipment Stock Reduced',
      message: `${req.user.name} ${delta > 0 ? 'restocked' : 'deducted'} ${Math.abs(delta)} unit(s) of [${equipment.assetTag}] ${equipment.name}. New available: ${newAvail} units. Reason: ${reason || 'Inventory Adjustment'}.`,
      type: delta > 0 ? 'SUCCESS' : 'WARNING',
      link: '/stock'
    });

    return res.json({
      success: true,
      message: `Stock for ${equipment.assetTag} updated: ${newAvail} available of ${newQty} total.`,
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

// 8b. Get Stock Movements History
exports.getStockMovements = async (req, res, next) => {
  try {
    const { equipmentId, type, search, startDate, endDate, page = 1, limit = 100 } = req.query;
    const where = {};
    if (equipmentId && equipmentId !== 'ALL') where.equipmentId = equipmentId;
    if (type && type !== 'ALL') where.type = type;

    let movements = [];
    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const safeLimit = Math.min(500, Math.max(1, parseInt(limit, 10) || 100));
    if (prisma.stockMovement?.findMany) {
      movements = await prisma.stockMovement.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: safeLimit,
        skip: (safePage - 1) * safeLimit
      });
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      movements = movements.filter(m =>
        (m.equipmentName && m.equipmentName.toLowerCase().includes(q)) ||
        (m.assetTag && m.assetTag.toLowerCase().includes(q)) ||
        (m.reference && m.reference.toLowerCase().includes(q)) ||
        (m.performedBy && m.performedBy.toLowerCase().includes(q)) ||
        (m.notes && m.notes.toLowerCase().includes(q))
      );
    }
    if (startDate) {
      const s = new Date(startDate);
      movements = movements.filter(m => new Date(m.createdAt) >= s);
    }
    if (endDate) {
      const e = new Date(endDate);
      e.setHours(23, 59, 59, 999);
      movements = movements.filter(m => new Date(m.createdAt) <= e);
    }

    // Sort descending by date
    movements.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.json({
      success: true,
      total: movements.length,
      data: movements
    });
  } catch (error) {
    next(error);
  }
};

// 8c. Delete single stock movement record (Admin only)
exports.deleteStockMovement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.stockMovement.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Stock movement record not found.' });
    }

    await prisma.stockMovement.delete({ where: { id } });

    return res.json({
      success: true,
      message: 'Stock movement record deleted.'
    });
  } catch (error) {
    next(error);
  }
};

// 8d. Clear multiple or all stock movement records (Admin only)
exports.clearStockMovements = async (req, res, next) => {
  try {
    const { ids, all } = req.body || {};
    let deletedCount = 0;

    if (Array.isArray(ids) && ids.length > 0) {
      const result = await prisma.stockMovement.deleteMany({
        where: { id: { in: ids } }
      });
      deletedCount = result.count || 0;
    } else if (all === true) {
      const result = await prisma.stockMovement.deleteMany({});
      deletedCount = result.count || 0;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Specify ids array or all: true to clear stock movements.'
      });
    }

    return res.json({
      success: true,
      message: `Cleared ${deletedCount} stock movement record(s).`,
      deletedCount
    });
  } catch (error) {
    next(error);
  }
};

// 9. Stock Dashboard with interactive time filtering (Daily, Weekly, Monthly, Yearly, All)
exports.getStockDashboard = async (req, res, next) => {
  try {
    const { timeframe = 'monthly' } = req.query;
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

    const [allEquipment, movementsRaw] = await Promise.all([
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
      prisma.stockMovement?.findMany
        ? prisma.stockMovement.findMany({
            where: timeframe !== 'all' ? { createdAt: { gte: startDate } } : {},
            orderBy: { createdAt: 'desc' },
            take: 30
          })
        : Promise.resolve([])
    ]);

    let totalStock = 0;
    let availableStock = 0;
    let borrowedStock = 0;
    let damagedStock = 0;
    let maintenanceStock = 0;
    let outOfStockCount = 0;
    let totalValuation = 0;
    const lowStockAlerts = [];

    allEquipment.forEach(eq => {
      const qty = eq.quantity || 1;
      const avail = eq.availableQuantity !== undefined ? eq.availableQuantity : (eq.status === 'AVAILABLE' ? qty : 0);
      totalStock += qty;
      availableStock += avail;
      totalValuation += (eq.purchasePrice || 0) * qty;

      if (avail === 0) outOfStockCount++;

      if (eq.status === 'BORROWED' || eq.status === 'IN_USE') {
        borrowedStock += Math.max(1, qty - avail);
      } else if (eq.status === 'DAMAGED') {
        damagedStock += Math.max(1, qty - avail);
      } else if (eq.status === 'UNDER_MAINTENANCE') {
        maintenanceStock += Math.max(1, qty - avail);
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

    const movements = movementsRaw || [];

    // Category stock distribution
    const categoryMap = {};
    allEquipment.forEach(eq => {
      const catName = eq.category?.name || 'General';
      if (!categoryMap[catName]) {
        categoryMap[catName] = { name: catName, totalStock: 0, availableStock: 0, count: 0 };
      }
      categoryMap[catName].totalStock += (eq.quantity || 1);
      categoryMap[catName].availableStock += (eq.availableQuantity !== undefined ? eq.availableQuantity : 1);
      categoryMap[catName].count += 1;
    });

    return res.json({
      success: true,
      timeframe,
      summary: {
        totalEquipmentCount: allEquipment.length,
        totalStockUnits: totalStock,
        availableStockUnits: availableStock,
        borrowedStockUnits: borrowedStock,
        damagedStockUnits: damagedStock,
        maintenanceStockUnits: maintenanceStock,
        outOfStockUnits: outOfStockCount,
        totalValuation,
        lowStockCount: lowStockAlerts.length
      },
      lowStockAlerts,
      categoryBreakdown: Object.values(categoryMap),
      recentMovements: movements
    });
  } catch (error) {
    next(error);
  }
};

// 10. Get all categories
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { equipment: true }
        }
      }
    });

    return res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};

// 11. Create category
exports.createCategory = async (req, res, next) => {
  try {
    const { name, description, icon } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required.' });
    }

    const existing = await prisma.category.findUnique({
      where: { name: name.trim() }
    });

    if (existing) {
      return res.status(409).json({ success: false, message: 'Category already exists.' });
    }

    const cleanIcon = typeof icon === 'string' && icon.trim() ? icon.trim() : 'bi-camera';

    const created = await prisma.category.create({
      data: {
        name: name.trim(),
        description: description ? description.trim() : null,
        icon: cleanIcon
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Category created.',
      data: created
    });
  } catch (error) {
    next(error);
  }
};

// 11b. Update category
exports.updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, icon } = req.body;

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    const cleanName = name !== undefined ? name.trim() : existing.name;
    if (!cleanName) {
      return res.status(400).json({ success: false, message: 'Category name is required.' });
    }

    if (cleanName !== existing.name) {
      const conflict = await prisma.category.findUnique({ where: { name: cleanName } });
      if (conflict && conflict.id !== id) {
        return res.status(409).json({ success: false, message: 'Another category with this name already exists.' });
      }
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        name: cleanName,
        description: description !== undefined ? (description ? description.trim() : null) : existing.description,
        icon: icon !== undefined
          ? (typeof icon === 'string' && icon.trim() ? icon.trim() : 'bi-camera')
          : existing.icon
      }
    });

    return res.json({
      success: true,
      message: `Category "${updated.name}" updated.`,
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

// 12. Delete category
exports.deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.category.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    const count = await prisma.equipment.count({
      where: { categoryId: id, isDeleted: false }
    });

    if (count > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category "${existing.name}". It contains ${count} active equipment item(s). Reassign them first.`
      });
    }

    await prisma.$transaction(async (tx) => {
      if (req.user.role === 'ADMIN') {
        const archivedItems = await tx.equipment.findMany({
          where: { categoryId: id, isDeleted: true },
          select: { id: true }
        });
        const archivedIds = archivedItems.map(item => item.id);
        if (archivedIds.length > 0) {
          if (tx.borrowRequestItem?.deleteMany) {
            await tx.borrowRequestItem.deleteMany({ where: { equipmentId: { in: archivedIds } } });
          }
          if (tx.checkInOut?.deleteMany) {
            await tx.checkInOut.deleteMany({ where: { equipmentId: { in: archivedIds } } });
          }
          if (tx.maintenance?.deleteMany) {
            await tx.maintenance.deleteMany({ where: { equipmentId: { in: archivedIds } } });
          }
          if (tx.stockMovement?.deleteMany) {
            await tx.stockMovement.deleteMany({ where: { equipmentId: { in: archivedIds } } });
          }
          await tx.equipment.deleteMany({ where: { id: { in: archivedIds } } });
        }
      }
      await tx.category.delete({ where: { id } });
    }, {
      maxWait: 10000,
      timeout: 30000
    });

    return res.json({
      success: true,
      message: `Category "${existing.name}" deleted successfully.`
    });
  } catch (error) {
    next(error);
  }
};

// 13. Upload equipment image
exports.uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    return res.json({
      success: true,
      message: 'Image uploaded successfully.',
      imageUrl
    });
  } catch (error) {
    next(error);
  }
};
