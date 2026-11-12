const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const statements = [
  `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`,
  `CREATE EXTENSION IF NOT EXISTS "pgcrypto"`,

  `DO $$ BEGIN
    CREATE TYPE "Role" AS ENUM ('ADMIN', 'STOCK_MANAGEMENT', 'STOCK_CONTROLLER', 'USER');
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$`,

  `DO $$ BEGIN
    CREATE TYPE "EquipmentStatus" AS ENUM ('AVAILABLE', 'BORROWED', 'IN_USE', 'UNDER_MAINTENANCE', 'DAMAGED', 'OUT_OF_STOCK', 'RETIRED', 'RESERVED');
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$`,

  `DO $$ BEGIN
    CREATE TYPE "ConditionStatus" AS ENUM ('EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'DAMAGED');
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$`,

  `DO $$ BEGIN
    CREATE TYPE "ProjectStatus" AS ENUM ('PLANNING', 'IN_PRODUCTION', 'COMPLETED', 'CANCELLED');
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$`,

  `DO $$ BEGIN
    CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'CHECKED_OUT', 'PARTIALLY_RETURNED', 'RETURNED', 'OVERDUE');
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$`,

  `DO $$ BEGIN
    CREATE TYPE "ItemLoanStatus" AS ENUM ('REQUESTED', 'PREPARED', 'CHECKED_OUT', 'RETURNED', 'DAMAGED_RETURN', 'MISSING_RETURN');
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$`,

  `DO $$ BEGIN
    CREATE TYPE "CheckType" AS ENUM ('CHECK_OUT', 'CHECK_IN');
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$`,

  `DO $$ BEGIN
    CREATE TYPE "SeverityLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$`,

  `DO $$ BEGIN
    CREATE TYPE "MaintenanceStatus" AS ENUM ('REPORTED', 'IN_INSPECTION', 'SENT_TO_VENDOR', 'IN_REPAIR', 'AWAITING_PARTS', 'RESOLVED', 'WRITTEN_OFF', 'DECOMMISSIONED');
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$`,

  `DO $$ BEGIN
    CREATE TYPE "NotificationType" AS ENUM ('INFO', 'SUCCESS', 'WARNING', 'DANGER');
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$`,

  `CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL UNIQUE,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "roleNote" TEXT,
    "department" TEXT,
    "phone" TEXT,
    "avatar" TEXT,
    "signatureUrl" TEXT,
    "profilePhoto" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS "categories" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL UNIQUE,
    "description" TEXT,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS "equipment" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "assetTag" TEXT NOT NULL UNIQUE,
    "name" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL UNIQUE,
    "categoryId" TEXT NOT NULL REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "availableQuantity" INTEGER NOT NULL DEFAULT 1,
    "status" "EquipmentStatus" NOT NULL DEFAULT 'AVAILABLE',
    "condition" "ConditionStatus" NOT NULL DEFAULT 'EXCELLENT',
    "purchaseDate" TIMESTAMP(3),
    "purchasePrice" DOUBLE PRECISION,
    "dailyRate" DOUBLE PRECISION,
    "location" TEXT,
    "imageUrl" TEXT,
    "accessories" JSONB,
    "specifications" JSONB,
    "notes" TEXT,
    "qrCode" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS "projects" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "projectNumber" TEXT,
    "projectCode" TEXT NOT NULL UNIQUE,
    "title" TEXT NOT NULL,
    "client" TEXT,
    "director" TEXT,
    "location" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'PLANNING',
    "createdById" TEXT NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS "project_crews" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "projectId" TEXT NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "phone" TEXT,
    "shootDate" TEXT,
    "callTime" TEXT,
    "projectType" TEXT,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "notes" TEXT,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS "borrow_requests" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "requestNumber" TEXT NOT NULL UNIQUE,
    "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "projectId" TEXT REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "actualReturnDate" TIMESTAMP(3),
    "purpose" TEXT NOT NULL,
    "destination" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "approvedById" TEXT REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    "approvedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS "borrow_request_items" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "requestId" TEXT NOT NULL REFERENCES "borrow_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "equipmentId" TEXT NOT NULL REFERENCES "equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "status" "ItemLoanStatus" NOT NULL DEFAULT 'REQUESTED',
    "returnedCondition" "ConditionStatus",
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS "check_in_outs" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "requestId" TEXT REFERENCES "borrow_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    "equipmentId" TEXT NOT NULL REFERENCES "equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "type" "CheckType" NOT NULL,
    "handledById" TEXT NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "borrowerName" TEXT,
    "borrowerSignature" TEXT,
    "staffSignature" TEXT,
    "conditionAtAction" "ConditionStatus" NOT NULL DEFAULT 'GOOD',
    "accessoriesChecked" JSONB,
    "missingAccessories" JSONB,
    "damageReported" BOOLEAN NOT NULL DEFAULT false,
    "damageNotes" TEXT,
    "actionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS "maintenances" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "ticketNumber" TEXT NOT NULL UNIQUE,
    "equipmentId" TEXT NOT NULL REFERENCES "equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "reportedById" TEXT NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "issueTitle" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "SeverityLevel" NOT NULL DEFAULT 'MEDIUM',
    "status" "MaintenanceStatus" NOT NULL DEFAULT 'REPORTED',
    "vendor" TEXT,
    "technician" TEXT,
    "damageCategory" TEXT,
    "damageImageUrl" TEXT,
    "cost" DOUBLE PRECISION,
    "scheduledDate" TIMESTAMP(3),
    "completedDate" TIMESTAMP(3),
    "resolutionNotes" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS "notifications" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'INFO',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" TEXT REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS "stock_movements" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "equipmentId" TEXT NOT NULL,
    "assetTag" TEXT NOT NULL,
    "equipmentName" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantityChanged" INTEGER NOT NULL,
    "previousAvailable" INTEGER NOT NULL,
    "newAvailable" INTEGER NOT NULL,
    "previousTotal" INTEGER NOT NULL,
    "newTotal" INTEGER NOT NULL,
    "reference" TEXT,
    "notes" TEXT,
    "performedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS "system_settings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "key" TEXT NOT NULL UNIQUE,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS "invoices" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "invoiceNumber" TEXT NOT NULL UNIQUE,
    "requestId" TEXT REFERENCES "borrow_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    "userId" TEXT REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    "projectId" TEXT REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    "issuedById" TEXT REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    "borrowerName" TEXT,
    "borrowerDepartment" TEXT,
    "borrowerPhone" TEXT,
    "borrowerEmail" TEXT,
    "projectName" TEXT,
    "projectCode" TEXT,
    "projectLocation" TEXT,
    "borrowingDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedReturnDate" TIMESTAMP(3) NOT NULL,
    "actualReturnDate" TIMESTAMP(3),
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "grandTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ISSUED',
    "terms" TEXT,
    "declaration" TEXT,
    "authorizedSigner" TEXT,
    "items" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,

  // Indexes
  `CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users"("email")`,
  `CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users"("role")`,
  `CREATE INDEX IF NOT EXISTS "users_isActive_idx" ON "users"("isActive")`,

  `CREATE INDEX IF NOT EXISTS "categories_name_idx" ON "categories"("name")`,

  `CREATE INDEX IF NOT EXISTS "equipment_assetTag_idx" ON "equipment"("assetTag")`,
  `CREATE INDEX IF NOT EXISTS "equipment_serialNumber_idx" ON "equipment"("serialNumber")`,
  `CREATE INDEX IF NOT EXISTS "equipment_categoryId_idx" ON "equipment"("categoryId")`,
  `CREATE INDEX IF NOT EXISTS "equipment_status_idx" ON "equipment"("status")`,
  `CREATE INDEX IF NOT EXISTS "equipment_condition_idx" ON "equipment"("condition")`,
  `CREATE INDEX IF NOT EXISTS "equipment_isDeleted_idx" ON "equipment"("isDeleted")`,

  `CREATE INDEX IF NOT EXISTS "projects_projectCode_idx" ON "projects"("projectCode")`,
  `CREATE INDEX IF NOT EXISTS "projects_projectNumber_idx" ON "projects"("projectNumber")`,
  `CREATE INDEX IF NOT EXISTS "projects_status_idx" ON "projects"("status")`,
  `CREATE INDEX IF NOT EXISTS "projects_createdById_idx" ON "projects"("createdById")`,

  `CREATE INDEX IF NOT EXISTS "project_crews_projectId_idx" ON "project_crews"("projectId")`,

  `CREATE INDEX IF NOT EXISTS "borrow_requests_requestNumber_idx" ON "borrow_requests"("requestNumber")`,
  `CREATE INDEX IF NOT EXISTS "borrow_requests_userId_idx" ON "borrow_requests"("userId")`,
  `CREATE INDEX IF NOT EXISTS "borrow_requests_projectId_idx" ON "borrow_requests"("projectId")`,
  `CREATE INDEX IF NOT EXISTS "borrow_requests_status_idx" ON "borrow_requests"("status")`,
  `CREATE INDEX IF NOT EXISTS "borrow_requests_createdAt_idx" ON "borrow_requests"("createdAt")`,

  `CREATE INDEX IF NOT EXISTS "borrow_request_items_requestId_idx" ON "borrow_request_items"("requestId")`,
  `CREATE INDEX IF NOT EXISTS "borrow_request_items_equipmentId_idx" ON "borrow_request_items"("equipmentId")`,

  `CREATE INDEX IF NOT EXISTS "check_in_outs_equipmentId_idx" ON "check_in_outs"("equipmentId")`,
  `CREATE INDEX IF NOT EXISTS "check_in_outs_requestId_idx" ON "check_in_outs"("requestId")`,
  `CREATE INDEX IF NOT EXISTS "check_in_outs_handledById_idx" ON "check_in_outs"("handledById")`,
  `CREATE INDEX IF NOT EXISTS "check_in_outs_type_idx" ON "check_in_outs"("type")`,
  `CREATE INDEX IF NOT EXISTS "check_in_outs_actionDate_idx" ON "check_in_outs"("actionDate")`,

  `CREATE INDEX IF NOT EXISTS "maintenances_ticketNumber_idx" ON "maintenances"("ticketNumber")`,
  `CREATE INDEX IF NOT EXISTS "maintenances_equipmentId_idx" ON "maintenances"("equipmentId")`,
  `CREATE INDEX IF NOT EXISTS "maintenances_reportedById_idx" ON "maintenances"("reportedById")`,
  `CREATE INDEX IF NOT EXISTS "maintenances_status_idx" ON "maintenances"("status")`,

  `CREATE INDEX IF NOT EXISTS "stock_movements_equipmentId_idx" ON "stock_movements"("equipmentId")`,
  `CREATE INDEX IF NOT EXISTS "stock_movements_type_idx" ON "stock_movements"("type")`,
  `CREATE INDEX IF NOT EXISTS "stock_movements_createdAt_idx" ON "stock_movements"("createdAt")`,

  `CREATE INDEX IF NOT EXISTS "notifications_userId_idx" ON "notifications"("userId")`,
  `CREATE INDEX IF NOT EXISTS "notifications_isRead_idx" ON "notifications"("isRead")`,
  `CREATE INDEX IF NOT EXISTS "notifications_createdAt_idx" ON "notifications"("createdAt")`,

  `CREATE INDEX IF NOT EXISTS "audit_logs_userId_idx" ON "audit_logs"("userId")`,
  `CREATE INDEX IF NOT EXISTS "audit_logs_action_idx" ON "audit_logs"("action")`,
  `CREATE INDEX IF NOT EXISTS "audit_logs_entity_idx" ON "audit_logs"("entity")`,
  `CREATE INDEX IF NOT EXISTS "audit_logs_createdAt_idx" ON "audit_logs"("createdAt")`,

  `CREATE INDEX IF NOT EXISTS "invoices_invoiceNumber_idx" ON "invoices"("invoiceNumber")`,
  `CREATE INDEX IF NOT EXISTS "invoices_requestId_idx" ON "invoices"("requestId")`,
  `CREATE INDEX IF NOT EXISTS "invoices_userId_idx" ON "invoices"("userId")`,
  `CREATE INDEX IF NOT EXISTS "invoices_projectId_idx" ON "invoices"("projectId")`,
  `CREATE INDEX IF NOT EXISTS "invoices_status_idx" ON "invoices"("status")`,
  `CREATE INDEX IF NOT EXISTS "invoices_createdAt_idx" ON "invoices"("createdAt")`
];

async function main() {
  console.log('🎬 Connecting to Neon PostgreSQL...');
  await prisma.$connect();
  console.log('✅ Connected!');

  console.log(`Executing ${statements.length} schema creation commands...`);
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    try {
      await prisma.$executeRawUnsafe(stmt);
      process.stdout.write(`.` );
    } catch (e) {
      console.error(`\n❌ Error executing statement #${i + 1}:\n${stmt}\n`, e.message);
      throw e;
    }
  }
  console.log('\n✅ All SQL schema statements executed successfully!');

  const tables = await prisma.$queryRaw`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `;
  console.log('✅ Created Tables in Neon database:', tables.map(t => t.table_name));
}

main()
  .catch(e => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
