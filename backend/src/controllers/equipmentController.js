const { prisma } = require('../config/db');
const { generateQRCode } = require('../utils/qrGenerator');
const { logAudit } = require('../utils/auditLogger');

// 1. Get all equipment with filters, search, and pagination
exports.getAllEquipment = async (req, res, next) => {
  try {
    const { categoryId, status, condition, search, page = 1, limit = 50 } = req.query;

    const where = {};

    if (categoryId && categoryId !== 'ALL') {
      where.categoryId = categoryId;
    }

    if (status && status !== 'ALL') {
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
        { model: { contains: q, mode: 'insensitive' } },
        { location: { contains: q, mode: 'insensitive' } }
      ];
    }

    const take = parseInt(limit, 10);
    const skip = (parseInt(page, 10) - 1) * take;

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
          take: 5,
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
          take: 5,
          orderBy: { actionDate: 'desc' },
          include: {
            handledBy: { select: { id: true, name: true } }
          }
        },
        maintenances: {
          take: 5,
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

// 3. Lookup equipment by QR code, assetTag, or serialNumber (Fast Barcode/QR Lookup)
exports.lookupEquipment = async (req, res, next) => {
  try {
    const { code } = req.params;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Scan code is required.' });
    }

    let parsedTag = code.trim();
    // In case the QR code holds a JSON payload string
    try {
      const parsed = JSON.parse(code);
      if (parsed.assetTag) parsedTag = parsed.assetTag;
      else if (parsed.serial) parsedTag = parsed.serial;
    } catch (e) {
      // not json, proceed with plain string
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

// 4. Create new equipment item
exports.createEquipment = async (req, res, next) => {
  try {
    const {
      assetTag,
      name,
      brand,
      model,
      serialNumber,
      categoryId,
      status,
      condition,
      purchaseDate,
      purchasePrice,
      dailyRate,
      location,
      imageUrl,
      accessories,
      specifications,
      notes
    } = req.body;

    if (!assetTag || !name || !brand || !serialNumber || !categoryId) {
      return res.status(400).json({
        success: false,
        message: 'Asset Tag, Name, Brand, Serial Number, and Category are required.'
      });
    }

    // Check unique constraints
    const existing = await prisma.equipment.findFirst({
      where: {
        OR: [
          { assetTag: assetTag.trim().toUpperCase() },
          { serialNumber: serialNumber.trim() }
        ]
      }
    });

    if (existing) {
      const matchField = existing.assetTag.toUpperCase() === assetTag.trim().toUpperCase() ? 'Asset Tag' : 'Serial Number';
      return res.status(409).json({
        success: false,
        message: `Equipment with this ${matchField} already exists.`
      });
    }

    // Generate QR Code
    const cleanTag = assetTag.trim().toUpperCase();
    const cleanSerial = serialNumber.trim();
    const qrPayload = {
      assetTag: cleanTag,
      name: name.trim(),
      serial: cleanSerial,
      brand: brand.trim(),
      model: model ? model.trim() : ''
    };
    const qrCode = await generateQRCode(qrPayload);

    // Normalize accessories array
    let parsedAccessories = [];
    if (Array.isArray(accessories)) {
      parsedAccessories = accessories;
    } else if (typeof accessories === 'string') {
      try {
        parsedAccessories = JSON.parse(accessories);
      } catch (e) {
        parsedAccessories = accessories.split(',').map(s => s.trim()).filter(Boolean);
      }
    }

    const newEquipment = await prisma.equipment.create({
      data: {
        assetTag: cleanTag,
        name: name.trim(),
        brand: brand.trim(),
        model: model ? model.trim() : '',
        serialNumber: cleanSerial,
        categoryId,
        status: status || 'AVAILABLE',
        condition: condition || 'EXCELLENT',
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        purchasePrice: purchasePrice ? parseFloat(purchasePrice) : null,
        dailyRate: dailyRate ? parseFloat(dailyRate) : null,
        location: location ? location.trim() : null,
        imageUrl: imageUrl || null,
        accessories: parsedAccessories,
        specifications: specifications || null,
        notes: notes ? notes.trim() : null,
        qrCode
      },
      include: {
        category: true
      }
    });

    await logAudit({
      userId: req.user.id,
      action: 'CREATE_EQUIPMENT',
      entity: 'Equipment',
      entityId: newEquipment.id,
      details: { assetTag: newEquipment.assetTag, name: newEquipment.name },
      req
    });

    return res.status(201).json({
      success: true,
      message: 'Equipment created successfully.',
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
      status,
      condition,
      purchaseDate,
      purchasePrice,
      dailyRate,
      location,
      imageUrl,
      accessories,
      specifications,
      notes
    } = req.body;

    const existing = await prisma.equipment.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Equipment not found.' });
    }

    // Check unique conflicts if tag or serial changed
    if (assetTag && assetTag.trim().toUpperCase() !== existing.assetTag) {
      const tagExists = await prisma.equipment.findUnique({
        where: { assetTag: assetTag.trim().toUpperCase() }
      });
      if (tagExists) {
        return res.status(409).json({ success: false, message: 'Asset Tag is already assigned to another item.' });
      }
    }

    if (serialNumber && serialNumber.trim() !== existing.serialNumber) {
      const serialExists = await prisma.equipment.findUnique({
        where: { serialNumber: serialNumber.trim() }
      });
      if (serialExists) {
        return res.status(409).json({ success: false, message: 'Serial Number is already assigned to another item.' });
      }
    }

    // Normalize accessories
    let parsedAccessories = existing.accessories;
    if (accessories !== undefined) {
      if (Array.isArray(accessories)) {
        parsedAccessories = accessories;
      } else if (typeof accessories === 'string') {
        try {
          parsedAccessories = JSON.parse(accessories);
        } catch (e) {
          parsedAccessories = accessories.split(',').map(s => s.trim()).filter(Boolean);
        }
      }
    }

    const updatedTag = assetTag ? assetTag.trim().toUpperCase() : existing.assetTag;
    const updatedSerial = serialNumber ? serialNumber.trim() : existing.serialNumber;
    const updatedName = name ? name.trim() : existing.name;

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

    const updated = await prisma.equipment.update({
      where: { id },
      data: {
        assetTag: updatedTag,
        name: updatedName,
        brand: brand ? brand.trim() : undefined,
        model: model !== undefined ? model.trim() : undefined,
        serialNumber: updatedSerial,
        categoryId: categoryId || undefined,
        status: status || undefined,
        condition: condition || undefined,
        purchaseDate: purchaseDate !== undefined ? (purchaseDate ? new Date(purchaseDate) : null) : undefined,
        purchasePrice: purchasePrice !== undefined ? (purchasePrice ? parseFloat(purchasePrice) : null) : undefined,
        dailyRate: dailyRate !== undefined ? (dailyRate ? parseFloat(dailyRate) : null) : undefined,
        location: location !== undefined ? location.trim() : undefined,
        imageUrl: imageUrl !== undefined ? imageUrl : undefined,
        accessories: parsedAccessories,
        specifications: specifications !== undefined ? specifications : undefined,
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

    return res.json({
      success: true,
      message: 'Equipment updated successfully.',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

// 6. Delete equipment item (Admin only)
exports.deleteEquipment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const equipment = await prisma.equipment.findUnique({
      where: { id },
      include: {
        borrowItems: {
          where: { status: 'CHECKED_OUT' }
        }
      }
    });

    if (!equipment) {
      return res.status(404).json({ success: false, message: 'Equipment not found.' });
    }

    if (equipment.borrowItems.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete equipment that is currently checked out on a loan.'
      });
    }

    await prisma.equipment.delete({ where: { id } });

    await logAudit({
      userId: req.user.id,
      action: 'DELETE_EQUIPMENT',
      entity: 'Equipment',
      entityId: id,
      details: { assetTag: equipment.assetTag, name: equipment.name },
      req
    });

    return res.json({
      success: true,
      message: `Equipment ${equipment.assetTag} deleted successfully.`
    });
  } catch (error) {
    next(error);
  }
};

// 7. Get all categories
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

// 8. Create category (Admin/Stock)
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

    const created = await prisma.category.create({
      data: {
        name: name.trim(),
        description: description ? description.trim() : null,
        icon: icon || 'bi-camera'
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

// 9. Upload equipment image
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
