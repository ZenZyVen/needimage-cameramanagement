const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const http = require('http');
const app = require('../src/app');
const { prisma, checkDatabaseConnection } = require('../src/config/db');

async function runTests() {
  console.log('🚀 ========================================================');
  console.log('🧪 RUNNING COMPREHENSIVE SYSTEM VERIFICATION TESTS');
  console.log('   Target: Live Neon Serverless PostgreSQL Database');
  console.log('🚀 ========================================================\n');

  // Verify DB connection
  const dbStatus = await checkDatabaseConnection();
  console.log('1. Database Connection Status:', dbStatus);
  if (!dbStatus.connected) {
    throw new Error('Database is not connected! Aborting tests.');
  }

  // Start ephemeral server
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`📡 Ephemeral Test Server running at: ${baseUrl}`);

  const api = async (endpoint, options = {}) => {
    const url = `${baseUrl}${endpoint}`;
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    const res = await fetch(url, {
      ...options,
      headers,
      body: options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : undefined
    });
    const text = await res.text();
    let body;
    try { body = JSON.parse(text); } catch (e) { body = text; }
    return { status: res.status, headers: res.headers, body };
  };

  try {
    // 1. Health Check
    const healthRes = await api('/api/health');
    console.log('\n2. Health Check Endpoint:');
    console.log('   Status:', healthRes.status, '| Database Connected:', healthRes.body?.database?.connected);
    if (healthRes.status !== 200 || !healthRes.body?.database?.connected) {
      throw new Error('Health check failed!');
    }

    // 2. Authentication for All Three Roles
    console.log('\n3. Testing Authentication for All 3 Roles:');

    // Admin Login
    const adminLogin = await api('/api/auth/login', {
      method: 'POST',
      body: { username: 'admin', password: 'password123' }
    });
    console.log('   Admin Login:', adminLogin.status, '| User:', adminLogin.body?.user?.name, '| Username:', adminLogin.body?.user?.username, '| Role:', adminLogin.body?.user?.role);
    if (adminLogin.status !== 200 || adminLogin.body?.user?.role !== 'ADMIN') {
      throw new Error('Admin login failed: ' + JSON.stringify(adminLogin.body));
    }
    const adminToken = adminLogin.body.token;

    // Stock Management Login
    const stockLogin = await api('/api/auth/login', {
      method: 'POST',
      body: { username: 'stock', password: 'password123' }
    });
    console.log('   Stock Management Login:', stockLogin.status, '| User:', stockLogin.body?.user?.name, '| Username:', stockLogin.body?.user?.username, '| Role:', stockLogin.body?.user?.role);
    if (stockLogin.status !== 200 || !['STOCK_MANAGEMENT', 'STOCK_CONTROLLER'].includes(stockLogin.body?.user?.role)) {
      throw new Error('Stock Management login failed: ' + JSON.stringify(stockLogin.body));
    }
    const stockToken = stockLogin.body.token;

    // Normal User Login
    const userLogin = await api('/api/auth/login', {
      method: 'POST',
      body: { username: 'user', password: 'password123' }
    });
    console.log('   Normal User Login:', userLogin.status, '| User:', userLogin.body?.user?.name, '| Username:', userLogin.body?.user?.username, '| Role:', userLogin.body?.user?.role);
    if (userLogin.status !== 200 || userLogin.body?.user?.role !== 'USER') {
      throw new Error('Normal User login failed: ' + JSON.stringify(userLogin.body));
    }
    const userToken = userLogin.body.token;

    // 3. Test RBAC: Normal User Restrictions
    console.log('\n4. Testing Role-Based Access Control (RBAC) Server-Side Protections:');

    // Normal user attempts to create project -> MUST FAIL (403)
    const forbiddenProject = await api('/api/projects', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: { title: 'Unauthorized Project', startDate: new Date(), endDate: new Date() }
    });
    console.log('   Normal User Create Project Attempt -> Status:', forbiddenProject.status, '(Expected: 403 Forbidden)');
    if (forbiddenProject.status !== 403) {
      throw new Error('Security Breach: Normal user was allowed to create a project!');
    }

    // Normal user attempts to adjust stock -> MUST FAIL (403)
    const forbiddenStock = await api('/api/equipment/some-id/adjust-stock', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: { adjustment: 5 }
    });
    console.log('   Normal User Adjust Stock Attempt -> Status:', forbiddenStock.status, '(Expected: 403 Forbidden)');
    if (forbiddenStock.status !== 403) {
      throw new Error('Security Breach: Normal user was allowed to adjust stock!');
    }

    // Normal user attempts to approve borrow request -> MUST FAIL (403)
    const forbiddenApprove = await api('/api/requests/some-id/approve', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${userToken}` },
      body: { notes: 'Self-approval' }
    });
    console.log('   Normal User Approve Request Attempt -> Status:', forbiddenApprove.status, '(Expected: 403 Forbidden)');
    if (forbiddenApprove.status !== 403) {
      throw new Error('Security Breach: Normal user was allowed to approve a request!');
    }

    // 4b. Dashboard Stats & Stock Dashboard Verification
    console.log('\n4b. Testing Dashboard Stats & Stock Dashboard Endpoints:');
    const dashAdminRes = await api('/api/dashboard/stats?timeframe=monthly', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('   Admin Dashboard Stats -> Status:', dashAdminRes.status, '| Total Equipment:', dashAdminRes.body?.stats?.totalEquipment, '| Stock Units:', dashAdminRes.body?.stats?.totalStockUnits);
    if (dashAdminRes.status !== 200 || !dashAdminRes.body?.stats || !dashAdminRes.body?.charts) {
      throw new Error('Admin dashboard stats failed!');
    }

    const dashUserRes = await api('/api/dashboard/stats?timeframe=all', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    console.log('   User Dashboard Stats -> Status:', dashUserRes.status, '| My Active Loans:', dashUserRes.body?.userStats?.myActiveLoans);
    if (dashUserRes.status !== 200 || !dashUserRes.body?.userStats) {
      throw new Error('User dashboard stats failed!');
    }

    const stockDashRes = await api('/api/equipment/stock-dashboard?timeframe=monthly', {
      headers: { Authorization: `Bearer ${stockToken}` }
    });
    console.log('   Stock Dashboard -> Status:', stockDashRes.status, '| Low Stock Alerts:', stockDashRes.body?.lowStockAlerts?.length);
    if (stockDashRes.status !== 200 || !stockDashRes.body?.summary) {
      throw new Error('Stock dashboard failed!');
    }

    // 4. Equipment Management & Product Price Updates
    console.log('\n5. Testing Equipment Catalog & Pricing Updates:');
    const eqListRes = await api('/api/equipment', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    console.log('   Equipment Listed for User:', eqListRes.body?.total, 'items retrieved.');
    const fx3 = eqListRes.body.data.find(e => e.assetTag === 'CAM-001');
    if (!fx3) throw new Error('CAM-001 not found in equipment catalog!');

    // Admin updates product price
    const updatedPriceRes = await api(`/api/equipment/${fx3.id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { purchasePrice: 3999.00, dailyRate: 165.00 }
    });
    console.log('   Admin Update Product Price -> Status:', updatedPriceRes.status, '| New Daily Rate: $' + updatedPriceRes.body?.data?.dailyRate);
    if (updatedPriceRes.status !== 200 || updatedPriceRes.body?.data?.dailyRate !== 165.00) {
      throw new Error('Product price update failed!');
    }

    // 5. Automatic Project Sequence Numbering & Project Creation
    console.log('\n6. Testing Automatic Project Numbering & Codes starting from 01:');
    const nextCodeRes = await api('/api/projects/next-code', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('   Next Available Project Code:', nextCodeRes.body?.data);
    const nextSeq = nextCodeRes.body?.data;
    if (!nextSeq || !nextSeq.projectCode || !nextSeq.projectNumber) {
      throw new Error('Failed to generate automatic project sequence!');
    }

    // Admin creates new project with auto code
    const newProjectRes = await api('/api/projects', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        title: 'Neon Nights Cyberpunk Feature Film',
        client: 'Paramount Global',
        director: 'Christopher Nolan',
        location: 'Tokyo Studio Lot & Shinjuku',
        startDate: new Date('2026-12-01'),
        endDate: new Date('2026-12-20'),
        status: 'PLANNING'
      }
    });
    console.log('   Created New Project -> Code:', newProjectRes.body?.data?.projectCode, '| Title:', newProjectRes.body?.data?.title);
    if (newProjectRes.status !== 201 || !newProjectRes.body?.data?.projectCode) {
      throw new Error('Project creation failed: ' + JSON.stringify(newProjectRes.body));
    }
    const createdProject = newProjectRes.body.data;

    // Add Crew Member to Project
    const crewRes = await api(`/api/projects/${createdProject.id}/crew`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        name: 'Roger Deakins',
        role: 'Cinematographer (ASC, BSC)',
        phone: '+1 555-019-9988',
        callTime: '05:30 AM'
      }
    });
    console.log('   Added Crew Member -> Status:', crewRes.status, '| Crew Member:', crewRes.body?.data?.name);
    if (crewRes.status !== 201) throw new Error('Adding crew member failed!');

    // 6. Stock Management Operations: Restock & Deduct
    console.log('\n7. Testing Stock Management (Restocking, Deduction, Movements):');
    const preAvail = fx3.availableQuantity;

    // Stock Manager restocks 2 units
    const restockRes = await api(`/api/equipment/${fx3.id}/adjust-stock`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${stockToken}` },
      body: {
        adjustment: 2,
        reason: 'New Sony shipment arrived from B&H Photo',
        notes: 'Added to Vault Locker A-01'
      }
    });
    console.log('   Restock +2 Units -> Status:', restockRes.status, '| New Available:', restockRes.body?.data?.availableQuantity);
    if (restockRes.status !== 200 || restockRes.body?.data?.availableQuantity !== preAvail + 2) {
      throw new Error('Stock restock failed!');
    }

    // Check stock movement log
    const movementsRes = await api('/api/equipment/stock-movements', {
      headers: { Authorization: `Bearer ${stockToken}` }
    });
    console.log('   Stock Movement Records Count:', movementsRes.body?.total || movementsRes.body?.data?.length);

    // Stock deduction limit check (cannot deduct more than physically available)
    const excessiveDeduct = await api(`/api/equipment/${fx3.id}/adjust-stock`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${stockToken}` },
      body: { adjustment: -999, reason: 'Illegal over-deduction' }
    });
    console.log('   Over-deduction safety check -> Status:', excessiveDeduct.status, '(Expected 400 Bad Request)');
    if (excessiveDeduct.status !== 400) {
      throw new Error('Security Breach: Allowed removing more stock than physically available!');
    }

    // 7. Normal User Submits Borrow Request with Multiple Items
    console.log('\n8. Testing Multi-Item Borrow Request Submission:');
    const c70 = eqListRes.body.data.find(e => e.assetTag === 'CAM-003');
    const titon = eqListRes.body.data.find(e => e.assetTag === 'BAT-001');

    const createReqRes = await api('/api/requests', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: {
        projectId: createdProject.id,
        startDate: new Date('2026-12-05'),
        endDate: new Date('2026-12-12'),
        purpose: 'Night exterior vehicle rig and aerial tracking',
        destination: 'Tokyo Studio Lot',
        equipmentIds: [c70.id, titon.id],
        notes: 'Please pack in heavy-duty Pelican Storm flight cases.'
      }
    });
    console.log('   Submitted Borrow Request -> Status:', createReqRes.status, '| Request #:', createReqRes.body?.data?.requestNumber);
    if (createReqRes.status !== 201 || !createReqRes.body?.data?.items?.length) {
      throw new Error('Multi-item borrow request submission failed: ' + JSON.stringify(createReqRes.body));
    }
    const submittedReq = createReqRes.body.data;

    // 8. Borrow Approval Workflow
    console.log('\n9. Testing Request Approval & Stock Checkout Handover:');
    const approveRes = await api(`/api/requests/${submittedReq.id}/approve`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { notes: 'Approved for production assignment.' }
    });
    console.log('   Admin Approved Request -> Status:', approveRes.status, '| Request Status:', approveRes.body?.data?.status);
    if (approveRes.status !== 200 || approveRes.body?.data?.status !== 'APPROVED') {
      throw new Error('Request approval failed: ' + JSON.stringify(approveRes.body));
    }

    // 9. Stock Management Handover / Checkout
    const checkoutRes = await api('/api/checkinout/checkout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${stockToken}` },
      body: {
        requestId: submittedReq.id,
        itemIds: [c70.id, titon.id],
        borrowerName: 'David Kim',
        borrowerSignature: 'data:image/svg+xml;utf8,<svg>David Kim Sig</svg>',
        notes: 'All items handed over in excellent condition with batteries charged.'
      }
    });
    console.log('   Stock Management Handover Checkout -> Status:', checkoutRes.status, '| Checked Out Items:', checkoutRes.body?.data?.length);
    if (checkoutRes.status !== 200) {
      throw new Error('Equipment checkout handover failed: ' + JSON.stringify(checkoutRes.body));
    }

    // 10. Stock Management Return & Quality Inspection
    console.log('\n10. Testing Equipment Return & Quality Inspection:');
    const checkinRes = await api('/api/checkinout/checkin', {
      method: 'POST',
      headers: { Authorization: `Bearer ${stockToken}` },
      body: {
        requestId: submittedReq.id,
        items: [
          {
            equipmentId: c70.id,
            condition: 'EXCELLENT',
            missingAccessories: [],
            damageReported: false,
            notes: 'Camera returned clean with all lens caps and accessories present.'
          },
          {
            equipmentId: titon.id,
            condition: 'GOOD',
            missingAccessories: [],
            damageReported: false,
            notes: 'V-Mount batteries returned fully charged.'
          }
        ],
        borrowerName: 'David Kim',
        staffSignature: 'data:image/svg+xml;utf8,<svg>Marcus Vance Staff Sig</svg>'
      }
    });
    console.log('   Check-in & Inspection -> Status:', checkinRes.status, '| Inspected Items:', checkinRes.body?.data?.length);
    if (checkinRes.status !== 200) {
      throw new Error('Equipment check-in and return inspection failed: ' + JSON.stringify(checkinRes.body));
    }

    // 11. Invoices API Testing
    console.log('\n11. Testing Custody Invoices API:');
    const invoicesRes = await api('/api/invoices', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    console.log('   Normal User Invoices Count:', invoicesRes.body?.data?.length, '(Only user-scoped invoices)');
    if (invoicesRes.status !== 200) throw new Error('Invoices retrieval failed!');

    const adminInvoicesRes = await api('/api/invoices', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('   Admin Invoices Count:', adminInvoicesRes.body?.data?.length, '(Full studio invoices list)');
    if (adminInvoicesRes.status !== 200 || adminInvoicesRes.body?.data?.length < 2) {
      throw new Error('Admin invoices retrieval failed!');
    }

    // 12. Notifications & System Activity Logs
    console.log('\n12. Testing Notifications & Audit Activity Logs:');
    const notifRes = await api('/api/notifications', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    console.log('   User Notifications Count:', notifRes.body?.data?.length);

    const logsRes = await api('/api/settings/audit-logs', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('   System Audit Logs Recorded in Neon DB:', logsRes.body?.total || logsRes.body?.data?.length);
    if (logsRes.status !== 200 || (logsRes.body?.total || 0) < 5) {
      throw new Error('Audit logs verification failed!');
    }

    // 13. Security Hardening & Data Protection Verification
    console.log('\n13. Testing Security Hardening & Data Protection:');

    // 13a. Verify no password hash leakage in approveRequest or invoices or backup
    if (approveRes.body?.data?.user?.password) {
      throw new Error('Security Breach: Password hash leaked in approveRequest response!');
    }
    console.log('   Password Hash Redaction (Approve Request): PASS (no password field in user payload)');

    // 13b. Verify forged / tampered JWT is rejected with 401
    const forgedTokenRes = await api('/api/equipment', {
      headers: { Authorization: 'Bearer eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJpZCI6InVzZXItYWRtaW4tMSIsInJvbGUiOiJBRE1JTiJ9.' }
    });
    console.log('   Forged JWT (alg:none) Rejection -> Status:', forgedTokenRes.status, '(Expected: 401 Unauthorized)');
    if (forgedTokenRes.status !== 401) {
      throw new Error('Security Breach: Forged JWT token was accepted!');
    }

    // 13c. Verify Admin cannot demote or deactivate own account
    const adminSelfId = adminLogin.body.user.id;
    const selfDemoteRes = await api(`/api/users/${adminSelfId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { role: 'USER' }
    });
    console.log('   Admin Self-Demotion Protection -> Status:', selfDemoteRes.status, '(Expected: 400 Bad Request)');
    if (selfDemoteRes.status !== 400) {
      throw new Error('Security Breach: Admin was allowed to demote their own role!');
    }

    // 13d. Verify Live Neon Database Backup Export & Password Redaction
    const backupRes = await api('/api/settings/backup', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const backupUsers = backupRes.body?.data?.users || [];
    const leakedBackupPassword = backupUsers.some(u => u.password && u.password !== '[REDACTED]');
    console.log('   Live Neon Backup Export -> Status:', backupRes.status, '| Source:', backupRes.body?.data?.source, '| Password Redacted:', !leakedBackupPassword);
    if (backupRes.status !== 200 || leakedBackupPassword || backupRes.body?.data?.source !== 'Neon PostgreSQL') {
      throw new Error('Backup export verification failed!');
    }

    // 13e. Verify Security Headers (Helmet)
    const xContentType = healthRes.headers.get('x-content-type-options');
    const referrerPolicy = healthRes.headers.get('referrer-policy');
    console.log('   HTTP Security Headers -> X-Content-Type-Options:', xContentType, '| Referrer-Policy:', referrerPolicy);
    if (xContentType !== 'nosniff') {
      throw new Error('Security header X-Content-Type-Options: nosniff is missing!');
    }

    // Clean up temporary test artifacts so Neon DB stays clean
    console.log('\n🧹 Cleaning up temporary test records from Neon DB...');
    await prisma.checkInOut.deleteMany({ where: { requestId: submittedReq.id } });
    await prisma.borrowRequestItem.deleteMany({ where: { requestId: submittedReq.id } });
    await prisma.borrowRequest.delete({ where: { id: submittedReq.id } });
    await prisma.projectCrew.deleteMany({ where: { projectId: createdProject.id } });
    await prisma.project.delete({ where: { id: createdProject.id } });
    await prisma.equipment.update({
      where: { id: fx3.id },
      data: { availableQuantity: preAvail, quantity: fx3.quantity, purchasePrice: fx3.purchasePrice, dailyRate: fx3.dailyRate }
    });
    console.log('   Cleanup complete.');

    console.log('\n========================================================');
    console.log('🎉 ALL 13 SYSTEM & SECURITY VERIFICATION SUITES PASSED! 🎉');
    console.log('   Neon PostgreSQL is 100% connected, secure, and ready.');
    console.log('========================================================\n');
  } finally {
    server.close();
  }
}

runTests()
  .catch((e) => {
    console.error('\n❌ TEST SUITE RUNNER FAILED:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
