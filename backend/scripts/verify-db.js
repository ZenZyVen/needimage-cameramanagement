const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');

async function testConnection(name, url) {
  console.log(`\n🔌 Testing ${name}...`);
  if (!url) {
    console.error(`❌ ${name} is not defined in .env!`);
    return false;
  }

  const start = Date.now();
  const prisma = new PrismaClient({
    datasources: { db: { url } }
  });

  try {
    const versionRes = await prisma.$queryRaw`SELECT version(), current_database() as db, current_user as usr`;
    const latencyMs = Date.now() - start;

    const [
      users,
      categories,
      equipment,
      projects,
      projectCrews,
      borrowRequests,
      borrowRequestItems,
      checkInOuts,
      maintenances,
      notifications,
      auditLogs,
      stockMovements,
      systemSettings,
      invoices
    ] = await Promise.all([
      prisma.user.count(),
      prisma.category.count(),
      prisma.equipment.count(),
      prisma.project.count(),
      prisma.projectCrew.count(),
      prisma.borrowRequest.count(),
      prisma.borrowRequestItem.count(),
      prisma.checkInOut.count(),
      prisma.maintenance.count(),
      prisma.notification.count(),
      prisma.auditLog.count(),
      prisma.stockMovement.count(),
      prisma.systemSetting.count(),
      prisma.invoice.count()
    ]);

    console.log(`✅ ${name} Connected (${latencyMs}ms)`);
    console.log(`   Database: ${versionRes[0]?.db} | User: ${versionRes[0]?.usr}`);
    console.log(`   Engine:   ${(versionRes[0]?.version || '').split(',')[0]}`);
    console.log(`   Table Row Counts (All 14 Tables):`, {
      users,
      categories,
      equipment,
      projects,
      projectCrews,
      borrowRequests,
      borrowRequestItems,
      checkInOuts,
      maintenances,
      notifications,
      auditLogs,
      stockMovements,
      systemSettings,
      invoices
    });
    return true;
  } catch (err) {
    console.error(`❌ ${name} Error:`, err.message);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  console.log('========================================================');
  console.log('🗄️  NEON SERVERLESS POSTGRESQL DIAGNOSTIC & HEALTH CHECK');
  console.log('========================================================');
  const directOk = await testConnection('Direct Connection (DIRECT_URL)', process.env.DIRECT_URL);
  const poolerOk = await testConnection('Connection Pooler (DATABASE_URL)', process.env.DATABASE_URL);

  if (!directOk || !poolerOk) {
    process.exit(1);
  }
  console.log('\n🎉 Both Direct and Pooler Neon PostgreSQL connections are healthy!\n');
}

main();
