const { PrismaClient } = require('@prisma/client');

let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: ['warn', 'error'],
    });
  }
  prisma = global.prisma;
}

// Helper to check connection
async function checkDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Connected to PostgreSQL Database (Neon) successfully.');
    return { connected: true };
  } catch (error) {
    console.warn('⚠️ Warning: PostgreSQL database connection failed.');
    console.warn('👉 Please update DATABASE_URL in backend/.env with your Neon PostgreSQL connection string:');
    console.warn('   postgresql://[user]:[password]@[endpoint].neon.tech/[database]?sslmode=require');
    console.warn('   Then run: npx prisma db push && node prisma/seed.js');
    return { connected: false, error: error.message };
  }
}

module.exports = { prisma, checkDatabaseConnection };
