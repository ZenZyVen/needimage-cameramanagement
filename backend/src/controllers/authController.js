const bcrypt = require('bcryptjs');
const { prisma } = require('../config/db');
const { generateToken } = require('../config/jwt');
const { logAudit } = require('../utils/auditLogger');
const { invalidateUserCache, setCachedUser } = require('../middlewares/authMiddleware');

const USERNAME_REGEX = /^[a-z0-9._-]{3,30}$/;

function normalizeUsername(raw) {
  return String(raw || '').trim().toLowerCase();
}

exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const normalizedUsername = normalizeUsername(username);

    if (!normalizedUsername || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required.'
      });
    }

    const user = await prisma.user.findUnique({
      where: { username: normalizedUsername }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password.'
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
        message: 'Invalid username or password.'
      });
    }

    const token = generateToken({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    });

    await logAudit({
      userId: user.id,
      action: 'LOGIN',
      entity: 'User',
      entityId: user.id,
      details: { username: user.username, email: user.email, role: user.role },
      req
    });

    const userSafe = {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      department: user.department,
      phone: user.phone,
      avatar: user.avatar,
      profilePhoto: user.profilePhoto || user.avatar,
      signatureUrl: user.signatureUrl || null,
      isActive: user.isActive
    };

    setCachedUser(userSafe);

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
    const { name, username, email, password, department, phone, profilePhoto } = req.body;
    const normalizedUsername = normalizeUsername(username);
    const normalizedEmail = String(email || '').toLowerCase().trim();

    if (!name || !normalizedUsername || !normalizedEmail || !password) {
      return res.status(400).json({
        success: false,
        message: 'Full name, username, email, and password are required fields.'
      });
    }

    if (!USERNAME_REGEX.test(normalizedUsername)) {
      return res.status(400).json({
        success: false,
        message: 'Username must be 3-30 characters and contain only letters, numbers, dots, underscores, or hyphens.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    const existingUsername = await prisma.user.findUnique({
      where: { username: normalizedUsername }
    });

    if (existingUsername) {
      return res.status(409).json({
        success: false,
        message: 'This username is already taken. Please choose another one.'
      });
    }

    const existingEmail = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existingEmail) {
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
        username: normalizedUsername,
        email: normalizedEmail,
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
      username: newUser.username,
      email: newUser.email,
      role: newUser.role
    });

    await logAudit({
      userId: newUser.id,
      action: 'REGISTER',
      entity: 'User',
      entityId: newUser.id,
      details: { username: newUser.username, email: newUser.email, role: newUser.role },
      req
    });

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        username: newUser.username,
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
        username: true,
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

    setCachedUser(updatedUser);

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
    invalidateUserCache(req.user.id);

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
    invalidateUserCache(req.user.id);

    return res.json({
      success: true,
      message: 'Profile photo uploaded successfully.',
      profilePhoto
    });
  } catch (error) {
    next(error);
  }
};
