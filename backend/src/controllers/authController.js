const bcrypt = require('bcryptjs');
const { prisma } = require('../config/db');
const { generateToken } = require('../config/jwt');
const { logAudit } = require('../utils/auditLogger');

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact an administrator.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    await logAudit({
      userId: user.id,
      action: 'LOGIN',
      entity: 'User',
      entityId: user.id,
      details: { email: user.email, role: user.role },
      req
    });

    const userSafe = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      phone: user.phone,
      avatar: user.avatar
    };

    return res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: userSafe
    });
  } catch (error) {
    next(error);
  }
};

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, department, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required fields.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    // If first user in database, promote to ADMIN; otherwise USER
    const userCount = await prisma.user.count();
    const role = userCount === 0 ? 'ADMIN' : 'USER';

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role,
        department: department ? department.trim() : null,
        phone: phone ? phone.trim() : null,
        isActive: true
      }
    });

    const token = generateToken({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role
    });

    await logAudit({
      userId: newUser.id,
      action: 'REGISTER',
      entity: 'User',
      entityId: newUser.id,
      details: { email: newUser.email, role: newUser.role },
      req
    });

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department,
        phone: newUser.phone,
        avatar: newUser.avatar
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    return res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, department, phone, avatar, currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const dataToUpdate = {};
    if (name) dataToUpdate.name = name.trim();
    if (department !== undefined) dataToUpdate.department = department ? department.trim() : null;
    if (phone !== undefined) dataToUpdate.phone = phone ? phone.trim() : null;
    if (avatar !== undefined) dataToUpdate.avatar = avatar;

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is required to set a new password.'
        });
      }
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Current password does not match.'
        });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters.'
        });
      }
      dataToUpdate.password = await bcrypt.hash(newPassword, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        phone: true,
        avatar: true,
        isActive: true
      }
    });

    return res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: updatedUser
    });
  } catch (error) {
    next(error);
  }
};
