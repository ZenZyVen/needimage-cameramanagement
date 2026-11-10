const bcrypt = require('bcryptjs');
const { prisma } = require('../config/db');
const { logAudit } = require('../utils/auditLogger');

// 1. Get all users (Admin only)
exports.getAllUsers = async (req, res, next) => {
  try {
    const { role, search } = req.query;
    const where = {};

    if (role && role !== 'ALL') where.role = role;
    if (search && search.trim() !== '') {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { department: { contains: q, mode: 'insensitive' } }
      ];
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        phone: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            borrowRequests: true,
            checkInsOuts: true
          }
        }
      }
    });

    return res.json({
      success: true,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

// 2. Create user (Admin only)
exports.createUser = async (req, res, next) => {
  try {
    const { name, email, password, role = 'USER', department, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.'
      });
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email address already exists.'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role,
        department: department ? department.trim() : null,
        phone: phone ? phone.trim() : null,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        phone: true,
        isActive: true,
        createdAt: true
      }
    });

    await logAudit({
      userId: req.user.id,
      action: 'ADMIN_CREATE_USER',
      entity: 'User',
      entityId: user.id,
      details: { email: user.email, role: user.role },
      req
    });

    return res.status(201).json({
      success: true,
      message: 'User account created successfully.',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// 3. Update user role / active status (Admin only)
exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, role, department, phone, isActive, password } = req.body;

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Prevent deactivating own account
    if (id === req.user.id && isActive === false) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own admin account.'
      });
    }

    const dataToUpdate = {};
    if (name) dataToUpdate.name = name.trim();
    if (role) dataToUpdate.role = role;
    if (department !== undefined) dataToUpdate.department = department ? department.trim() : null;
    if (phone !== undefined) dataToUpdate.phone = phone ? phone.trim() : null;
    if (isActive !== undefined) dataToUpdate.isActive = Boolean(isActive);

    if (password && password.trim() !== '') {
      dataToUpdate.password = await bcrypt.hash(password.trim(), 10);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        phone: true,
        isActive: true,
        updatedAt: true
      }
    });

    await logAudit({
      userId: req.user.id,
      action: 'ADMIN_UPDATE_USER',
      entity: 'User',
      entityId: id,
      details: { email: updated.email, role: updated.role, isActive: updated.isActive },
      req
    });

    return res.json({
      success: true,
      message: 'User updated successfully.',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

// 4. Delete user (Admin only)
exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account.'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: { borrowRequests: true }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (user._count.borrowRequests > 0) {
      return res.status(400).json({
        success: false,
        message: 'User has borrow history and cannot be deleted. Deactivate account instead.'
      });
    }

    await prisma.user.delete({ where: { id } });

    await logAudit({
      userId: req.user.id,
      action: 'ADMIN_DELETE_USER',
      entity: 'User',
      entityId: id,
      details: { email: user.email },
      req
    });

    return res.json({
      success: true,
      message: 'User deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};
