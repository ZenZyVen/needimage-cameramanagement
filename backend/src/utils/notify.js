const { prisma } = require('../config/db');

/**
 * Send targeted or role-wide notifications showing WHO performed the action and WHAT happened.
 * 
 * @param {Object} options
 * @param {string|string[]} [options.userIds] - Specific user ID or array of user IDs to notify
 * @param {boolean} [options.notifyStaff=false] - Whether to notify all ADMIN and STOCK_CONTROLLER users
 * @param {string} options.title - Short, descriptive title
 * @param {string} options.message - Detailed explanation showing WHO did WHAT
 * @param {string} [options.type='INFO'] - 'INFO', 'SUCCESS', 'WARNING', 'DANGER'
 * @param {string} [options.link='/'] - Target URL in the application
 * @param {string} [options.actorId] - Exclude the actor so they don't get an alert for their own action
 */
async function notifyTeam({
  userIds = [],
  notifyStaff = false,
  title,
  message,
  type = 'INFO',
  link = '/',
  actorId = null
}) {
  try {
    const recipients = new Set();

    // Add specific users
    if (typeof userIds === 'string') {
      recipients.add(userIds);
    } else if (Array.isArray(userIds)) {
      userIds.forEach(id => {
        if (id) recipients.add(id);
      });
    }

    // Add staff users (Admin & Stock Controller)
    if (notifyStaff) {
      if (prisma.user?.findMany) {
        const staffUsers = await prisma.user.findMany({
          where: { role: { in: ['ADMIN', 'STOCK_CONTROLLER'] } },
          select: { id: true }
        });
        staffUsers.forEach(u => recipients.add(u.id));
      }
    }

    // Remove actor so they don't get notified of their own action
    if (actorId) {
      recipients.delete(actorId);
    }

    // Create notification entries for all recipients
    for (const uid of recipients) {
      if (prisma.notification?.create) {
        await prisma.notification.create({
          data: {
            userId: uid,
            title,
            message,
            type,
            link,
            isRead: false
          }
        });
      }
    }
  } catch (err) {
    console.warn('⚠️ [notifyTeam] Failed to dispatch notifications:', err.message);
  }
}

module.exports = { notifyTeam };
