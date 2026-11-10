const { prisma } = require('../config/db');

async function logAudit({ userId, action, entity, entityId, details, req }) {
  try {
    const ipAddress = req ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null) : null;
    await prisma.auditLog.create({
      data: {
        userId: userId || null,
        action,
        entity,
        entityId: entityId ? String(entityId) : null,
        details: details || null,
        ipAddress: ipAddress ? String(ipAddress).substring(0, 45) : null
      }
    });
  } catch (err) {
    console.error('Failed to write audit log:', err.message);
  }
}

module.exports = { logAudit };
