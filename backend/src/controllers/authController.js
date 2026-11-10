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
        message: 'Email and password are required.'
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
        message: 'This account has been deactivated. Please contact your system administrator.'
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
      avatar: user.avatar,
      profilePhoto: user.profilePhoto || user.avatar,
      signatureUrl: user.signatureUrl || null
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
    const { name, email, password, department, phone, profilePhoto } = req.body;

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
        avatar: profilePhoto || null,
        profilePhoto: profilePhoto || null,
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
        avatar: newUser.avatar,
        profilePhoto: newUser.profilePhoto,
        signatureUrl: null
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
    const { name, department, phone, avatar, profilePhoto, signatureUrl, currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const dataToUpdate = {};
    if (name) dataToUpdate.name = name.trim();
    if (department !== undefined) dataToUpdate.department = department ? department.trim() : null;
    if (phone !== undefined) dataToUpdate.phone = phone ? phone.trim() : null;
    if (avatar !== undefined) dataToUpdate.avatar = avatar;
    if (profilePhoto !== undefined) {
      dataToUpdate.profilePhoto = profilePhoto;
      dataToUpdate.avatar = profilePhoto;
    }
    if (signatureUrl !== undefined) dataToUpdate.signatureUrl = signatureUrl;

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
        profilePhoto: true,
        signatureUrl: true,
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

// Upload signature image
exports.uploadSignature = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }
    const signatureUrl = `/uploads/${req.file.filename}`;

    await prisma.user.update({
      where: { id: req.user.id },
      data: { signatureUrl }
    });

    return res.json({
      success: true,
      message: 'Inspector signature uploaded successfully.',
      signatureUrl
    });
  } catch (error) {
    next(error);
  }
};

// Upload avatar / profile photo
exports.uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }
    const profilePhoto = `/uploads/${req.file.filename}`;

    await prisma.user.update({
      where: { id: req.user.id },
      data: { profilePhoto, avatar: profilePhoto }
    });

    return res.json({
      success: true,
      message: 'Profile photo uploaded successfully.',
      profilePhoto
    });
  } catch (error) {
    next(error);
  }
};
