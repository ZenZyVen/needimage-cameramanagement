const { verifyToken } = require('../config/jwt');
const { prisma } = require('../config/db');

// Lightweight in-memory user cache (60s TTL) to eliminate redundant remote DB roundtrips on every request
const userCache = new Map();
const USER_CACHE_TTL_MS = 60 * 1000;

function getCachedUser(userId) {
  const entry = userCache.get(userId);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > USER_CACHE_TTL_MS) {
    userCache.delete(userId);
    return null;
  }
  return entry.user;
}

function setCachedUser(user) {
  if (user && user.id) {
    userCache.set(user.id, { user, timestamp: Date.now() });
  }
}

function invalidateUserCache(userId) {
  if (userId) {
    userCache.delete(userId);
  } else {
    userCache.clear();
  }
}

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token missing or invalid.'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded || !decoded.id) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired authentication session.'
      });
    }

    let user = getCachedUser(decoded.id);

    if (!user) {
      user = await prisma.user.findUnique({
        where: { id: decoded.id },
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

      if (user) {
        setCachedUser(user);
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User associated with this token no longer exists.'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'This user account has been deactivated. Please contact an Administrator.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.'
    });
  }
}

module.exports = { authenticate, invalidateUserCache, setCachedUser };
