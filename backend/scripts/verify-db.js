const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');

async function test(name, url) {
  console.log(`\nTesting ${name}...`);
  const prisma = new PrismaClient({
    datasources: { db: { url } }
  });
  try {
    const users = await prisma.user.count();
    const equipment = await prisma.equipment.count();
    const projects = await prisma.project.count();
    const invoices = await prisma.invoice.count();
    console.log(`✅ ${name} Success!`, { users, equipment, projects, invoices });
  } catch (err) {
    console.error(`❌ ${name} Error:`, err.message);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  await test('Direct URL', process.env.DIRECT_URL);
  await test('Pooler URL', process.env.DATABASE_URL);
}

main();
