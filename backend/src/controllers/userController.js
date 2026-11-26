const bcrypt = require('bcryptjs');
const { prisma } = require('../config/db');
const { logAudit } = require('../utils/auditLogger');
const { invalidateUserCache } = require('../middlewares/authMiddleware');

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
        { username: { contains: q, mode: 'insensitive' } },
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
        username: true,
        email: true,
        role: true,
        department: true,
        phone: true,
        avatar: true,
        profilePhoto: true,
        signatureUrl: true,
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

    const formatted = users.map(u => ({
      ...u,
      roleNote: u.avatar || ''
    }));

    return res.json({
      success: true,
      data: formatted
    });
  } catch (error) {
    next(error);
  }
};

const VALID_ROLES = new Set(['ADMIN', 'STOCK_MANAGEMENT', 'STOCK_CONTROLLER', 'USER']);
const USERNAME_REGEX = /^[a-z0-9._-]{3,30}$/;

// 2. Create user (Admin only)
exports.createUser = async (req, res, next) => {
  try {
    const { name, username, email, password, role = 'USER', department, phone, roleNote } = req.body;
    const normalizedUsername = String(username || '').trim().toLowerCase();
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!name || !normalizedUsername || !normalizedEmail || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, username, email, and password are required.'
      });
    }

    if (!USERNAME_REGEX.test(normalizedUsername)) {
      return res.status(400).json({
        success: false,
        message: 'Username must be 3-30 characters and contain only letters, numbers, dots, underscores, or hyphens.'
      });
    }

    if (String(password).length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    if (!VALID_ROLES.has(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user role specified.'
      });
    }

    const existingUsername = await prisma.user.findUnique({
      where: { username: normalizedUsername }
    });

    if (existingUsername) {
      return res.status(409).json({
        success: false,
        message: 'This username is already taken.'
      });
    }

    const existingEmail = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email address already exists.'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        username: normalizedUsername,
        email: normalizedEmail,
        password: hashedPassword,
        role,
        department: department ? department.trim() : null,
        phone: phone ? phone.trim() : null,
        avatar: roleNote ? roleNote.trim() : null,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        department: true,
        phone: true,
        avatar: true,
        profilePhoto: true,
        signatureUrl: true,
        isActive: true,
        createdAt: true
      }
    });

    await logAudit({
      userId: req.user.id,
      action: 'ADMIN_CREATE_USER',
      entity: 'User',
      entityId: user.id,
      details: { username: user.username, email: user.email, role: user.role },
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
    const { name, username, role, department, phone, isActive, password, roleNote } = req.body;

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Prevent deactivating or demoting own admin account
    if (id === req.user.id && isActive === false) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own admin account.'
      });
    }

    if (id === req.user.id && role && role !== 'ADMIN') {
      return res.status(400).json({
        success: false,
        message: 'You cannot demote your own admin role.'
      });
    }

    if (role && !VALID_ROLES.has(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user role specified.'
      });
    }

    const dataToUpdate = {};
    if (name) dataToUpdate.name = name.trim();
    if (username !== undefined && String(username).trim() !== '') {
      const normalizedUsername = String(username).trim().toLowerCase();
      if (!USERNAME_REGEX.test(normalizedUsername)) {
        return res.status(400).json({
          success: false,
          message: 'Username must be 3-30 characters and contain only letters, numbers, dots, underscores, or hyphens.'
        });
      }
      if (normalizedUsername !== existing.username) {
        const conflict = await prisma.user.findUnique({ where: { username: normalizedUsername } });
        if (conflict && conflict.id !== id) {
          return res.status(409).json({
            success: false,
            message: 'This username is already taken by another user.'
          });
        }
        dataToUpdate.username = normalizedUsername;
      }
    }
    if (role) dataToUpdate.role = role;
    if (department !== undefined) dataToUpdate.department = department ? department.trim() : null;
    if (phone !== undefined) dataToUpdate.phone = phone ? phone.trim() : null;
    if (isActive !== undefined) dataToUpdate.isActive = Boolean(isActive);
    if (roleNote !== undefined) dataToUpdate.avatar = roleNote ? roleNote.trim() : null;

    if (password && password.trim() !== '') {
      if (password.trim().length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long.'
        });
      }
      dataToUpdate.password = await bcrypt.hash(password.trim(), 10);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        department: true,
        phone: true,
        avatar: true,
        profilePhoto: true,
        signatureUrl: true,
        isActive: true,
        updatedAt: true
      }
    });

    invalidateUserCache(id);

    await logAudit({
      userId: req.user.id,
      action: 'ADMIN_UPDATE_USER',
      entity: 'User',
      entityId: id,
      details: { username: updated.username, email: updated.email, role: updated.role, isActive: updated.isActive },
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
          select: {
            borrowRequests: true,
            approvedRequests: true,
            createdProjects: true,
            checkInsOuts: true,
            maintenances: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const counts = user._count || {};
    const hasLinkedHistory =
      (counts.borrowRequests || 0) +
      (counts.approvedRequests || 0) +
      (counts.createdProjects || 0) +
      (counts.checkInsOuts || 0) +
      (counts.maintenances || 0) > 0;

    if (hasLinkedHistory) {
      return res.status(400).json({
        success: false,
        message: 'User has linked system history and cannot be deleted. Deactivate account instead.'
      });
    }

    await prisma.user.delete({ where: { id } });
    invalidateUserCache(id);

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
