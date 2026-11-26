const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const { mockStore } = require('./mockDb');

let realPrisma = null;
try {
  realPrisma = new PrismaClient({
    log: []
  });
} catch (e) {
  console.warn('Could not instantiate PrismaClient:', e.message);
  realPrisma = null;
}

let isPostgresConnected = false;
let connectionPromise = null;

// Check connection to PostgreSQL / Neon
async function checkDatabaseConnection(timeoutMs = 10000) {
  if (!realPrisma) {
    isPostgresConnected = false;
    return { connected: false, usingMock: true };
  }

  try {
    // Attempt quick query to test connection (configurable timeout for cold starts / health checks)
    await Promise.race([
      realPrisma.$queryRaw`SELECT 1 as live_check`,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout')), timeoutMs))
    ]);
    isPostgresConnected = true;
    console.log('✅ Connected to live PostgreSQL (Neon) Database.');
    return { connected: true, usingMock: false };
  } catch (error) {
    isPostgresConnected = false;
    console.warn(`ℹ️ Live PostgreSQL not reached: ${error.message}. Falling back to built-in Demo Store.`);
    return { connected: false, usingMock: true, error: error.message };
  }
}

// Eager initial connection check on require
connectionPromise = checkDatabaseConnection().catch(() => {});

// Smart Proxy: delegates to real Prisma if connected, otherwise to mockStore
const prisma = new Proxy({}, {
  get(target, prop) {
    if (prop === '$disconnect') {
      return async () => {
        if (isPostgresConnected && realPrisma) await realPrisma.$disconnect();
      };
    }
    if (prop === '$connect') {
      return async () => {
        if (realPrisma) await realPrisma.$connect();
        isPostgresConnected = true;
      };
    }
    if (prop === '$queryRaw') {
      return isPostgresConnected && realPrisma ? realPrisma.$queryRaw.bind(realPrisma) : mockStore.$queryRaw;
    }
    if (prop === '$executeRawUnsafe') {
      return isPostgresConnected && realPrisma ? realPrisma.$executeRawUnsafe.bind(realPrisma) : mockStore.$queryRaw;
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

module.exports = {
  prisma,
  checkDatabaseConnection,
  isPostgresConnected: () => isPostgresConnected,
  waitForDb: () => connectionPromise
};
