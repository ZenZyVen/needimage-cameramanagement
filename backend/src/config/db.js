const { PrismaClient } = require('@prisma/client');
const { mockStore } = require('./mockDb');

let realPrisma;
try {
  realPrisma = new PrismaClient({
    log: ['error']
  });
} catch (e) {
  realPrisma = null;
}

let isPostgresConnected = false;

// Check connection to PostgreSQL / Neon
async function checkDatabaseConnection() {
  if (!realPrisma) {
    isPostgresConnected = false;
    return { connected: false, usingMock: true };
  }

  try {
    // Attempt quick query to test connection
    await Promise.race([
      realPrisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout')), 3500))
    ]);
    isPostgresConnected = true;
    console.log('✅ Connected to live PostgreSQL (Neon) Database.');
    return { connected: true, usingMock: false };
  } catch (error) {
    isPostgresConnected = false;
    console.log('ℹ️ Live PostgreSQL not reached (placeholder or offline). Falling back to built-in Demo Store.');
    console.log('👉 To connect live Neon PostgreSQL: Update DATABASE_URL in backend/.env, then run:');
    console.log('   cd backend && npx prisma db push && node prisma/seed.js');
    return { connected: false, usingMock: true, error: error.message };
  }
}

// Smart Proxy: delegates to real Prisma if connected, otherwise to mockStore
const prisma = new Proxy({}, {
  get(target, prop) {
    if (prop === '$disconnect') {
      return async () => {
        if (isPostgresConnected && realPrisma) await realPrisma.$disconnect();
      };
    }
    if (prop === '$queryRaw') {
      return isPostgresConnected && realPrisma ? realPrisma.$queryRaw.bind(realPrisma) : mockStore.$queryRaw;
    }
    if (prop === '$transaction') {
      return isPostgresConnected && realPrisma ? realPrisma.$transaction.bind(realPrisma) : mockStore.$transaction;
    }

    if (isPostgresConnected && realPrisma && realPrisma[prop]) {
      return realPrisma[prop];
    }

    if (mockStore[prop]) {
      return mockStore[prop];
    }

    return realPrisma ? realPrisma[prop] : mockStore[prop];
  }
});

module.exports = { prisma, checkDatabaseConnection, isPostgresConnected: () => isPostgresConnected };
