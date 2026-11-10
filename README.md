# CineVault | Professional Camera Equipment Management System

A production-ready, full-stack **Camera Equipment Management System** built for film production studios, rental houses, and cinematography departments.

Powered by **React.js (Vite)**, **Bootstrap 5**, **Node.js**, **Express.js**, **Prisma ORM**, and **PostgreSQL (Neon Serverless Postgres)**.

---

## 📸 Key Capabilities

### 1. Three Dedicated User Roles
* **Admin**: Complete system authority—user management, approval/rejection of requests, inventory edits, equipment retirement, system configuration, audit logs, and valuation reports.
* **Stock Controller**: Vault logistics specialist—equipment handover (check-out), return intake (check-in), accessory inspections, condition logging, damage ticketing, and QR/barcode scanning.
* **Normal User (Cinematographer / Crew Lead)**: Browse equipment catalog, check live gear availability, submit borrowing requests linked to production projects, track request approvals, and view upcoming returns.

---

### 2. Equipment & Inventory Management
* **Full Asset Catalog**: Comprehensive gear records with Asset Tag (e.g. `CAM-001`, `LGT-001`), Brand, Model, Serial Number, Category, Purchase Price, Daily Rate, Storage Shelf/Locker, and Photo.
* **Equipment Statuses**: `AVAILABLE`, `BORROWED`, `UNDER_MAINTENANCE`, `DAMAGED`, `RETIRED`.
* **Condition Ratings**: `EXCELLENT`, `GOOD`, `FAIR`, `POOR`, `DAMAGED`.
* **Component & Accessories Checklist**: Itemized checklist per equipment piece (e.g., *Top XLR Handle, 2x Sony NP-FZ100 Batteries, Dual Charger, HDMI Clamp, Pelican 1510 Storm Case*).
* **Live QR Code Generation**: Instant QR code generated for every asset, encoding serial, model, tag, and direct vault lookup.

---

### 3. Production Project Management
* Create and manage feature films, commercials, music videos, and documentaries.
* Track shoot dates, project code (e.g., `PRJ-2026-001`), client, director, and location.
* Track all equipment bundles allocated and active on loan per project.

---

### 4. Borrowing Requests & Approvals
* **Requisition Wizard**: Crew members select a project, specify shoot dates and destination, and bundle equipment items with live availability checking.
* **Review Queue**: Admins and Stock Controllers inspect requests with one-click **Approve** (with pickup notes) or **Reject** (with mandatory justification).
* Automatic in-app notification alerts sent to requester upon approval/rejection.

---

### 5. Fast Checkout (Handover) & Check-in (Return)
* **Handover / Checkout**:
  * Verify all case accessories against the checklist before release.
  * Record borrower/crew name and signature acknowledgment.
  * Updates equipment status to `BORROWED` in real-time.
  * Generates an official **A4 Handover Loan Agreement / Voucher**.
* **Return / Check-in & Quality Inspection**:
  * Inspect equipment physical condition upon return (`EXCELLENT` through `DAMAGED`).
  * Flag missing accessories with notes.
  * Flag physical or optical damage—**automatically generates a Maintenance Ticket** in the service queue.
  * Supports partial returns when only a portion of gear is returned early.
  * Generates an official **A4 Return & Inspection Receipt**.

---

### 6. PDF & Printable A4 Documents
* **A4 Equipment Handover Voucher**: Includes studio header, borrower details, project metadata, verified serial numbers, accessories checklist, liability custody declaration, and signature lines.
* **A4 Return Inspection Receipt**: Technical quality sign-off document with return condition ratings, damage notes, and vault officer stamp.
* **A4 Asset Tag Sticker Sheets**: High-density 3-column printable sheet of adhesive labels featuring QR codes, company header, asset tags, and serial numbers for physical labeling.
* **A4 Inventory Audit & Valuation Report**: Categorized inventory ledger with total asset valuation ($), condition breakdown, and auditor sign-off.
* Built-in direct **A4 PDF Export** (via `html2pdf.js`) and native clean browser printing (`@media print`).

---

### 7. Additional Features
* **Live QR & Barcode Scanner**: Built-in camera scanner (via `html5-qrcode`) plus manual input supporting handheld laser USB barcode scanners. Instantly pulls up gear status and triggers fast handover or return.
* **Maintenance & Repair Work Orders**: Track repair severity (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), vendors (e.g., Sony Authorized Service, RED Service Center), repair costs, and return-to-service resolutions.
* **Notification System**: Real-time notification menu with unread badges and one-click navigation to relevant requests.
* **Modern Blue-Grey & Slate UI**: Clean, professional corporate dashboard built with Bootstrap 5. Pure white cards, slate blue-grey navigation, and crisp status badges. Strictly free of neon, purple, or distracting gradients.

---

## 🔑 Pre-Configured Demo Accounts

For immediate evaluation, the database seed script provisions 3 realistic accounts with full historical activity:

| Role | Email | Password | Name & Department |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@cameragear.com` | `password123` | Sarah Connor (*Production Operations*) |
| **Stock Controller** | `stock@cameragear.com` | `password123` | Marcus Vance (*Gear Vault Logistics*) |
| **Normal User** | `user@cameragear.com` | `password123` | David Kim (*Cinematography Unit*) |

*(The login screen also provides 1-click login buttons for instant switching between all 3 roles).*

---

## ⚡ Connecting to Neon PostgreSQL

CineVault is fully configured for **Neon Serverless PostgreSQL**.

### Step 1: Obtain your Neon Database URL
1. Go to [neon.tech](https://neon.tech) and create a free project in under 60 seconds (no credit card required).
2. Copy your connection string from the Neon dashboard. It looks like:
   ```text
   postgresql://neondb_owner:YOUR_PASSWORD@ep-cool-dawn-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

### Step 2: Configure Environment Variable
In `backend/.env`, set `DATABASE_URL`:
```env
DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@ep-cool-dawn-123456.us-east-2.aws.neon.tech/neondb?sslmode=require"
```

### Step 3: Push Schema & Seed Data
Run the automated schema push and seed commands from the project root:
```bash
# Push database tables to Neon
cd backend
npx prisma db push

# Populate with realistic camera gear, projects, and users
node prisma/seed.js
```

---

## 🚀 Local Development Setup

### Prerequisites
* **Node.js** (v18.0.0 or higher)
* **npm** (v9.0.0 or higher)

### 1. Install Dependencies
```bash
npm run install:all
```
*(Or run `npm install` inside both `backend` and `frontend` folders)*

### 2. Start the Backend API Server
```bash
cd backend
npm run dev
```
Backend runs on: `http://localhost:5000`  
Health check endpoint: `http://localhost:5000/api/health`

### 3. Start the Frontend Client
```bash
cd frontend
npm run dev
```
Frontend runs on: `http://localhost:5173`

---

## 🌐 Deployment to GitHub & Render

The repository includes a ready-to-deploy **`render.yaml`** configuration blueprint for 1-click deployment on Render.

### Step 1: Push Code to GitHub
```bash
git add .
git commit -m "feat: complete CineVault camera equipment management system"
git remote add origin https://github.com/YOUR_USERNAME/camera-equipment-management.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy on Render
1. Log in to [Render.com](https://render.com).
2. Click **New +** -> **Blueprint**.
3. Connect your GitHub repository.
4. Render will automatically detect `render.yaml` and configure:
   - **Backend Web Service** (`cinevault-backend-api`):
     - Build: `cd backend && npm install && npx prisma generate`
     - Start: `cd backend && npm start`
     - Env Vars: Add your live `DATABASE_URL` (from Neon) in the Render dashboard.
   - **Frontend Static Site** (`cinevault-frontend`):
     - Build: `cd frontend && npm install && npm run build`
     - Publish: `frontend/dist`
     - Env Vars: Set `VITE_API_URL` to your backend URL (e.g. `https://cinevault-backend-api.onrender.com/api`).
5. Click **Apply**. Your system is live on the internet!

---

## 📁 Project Architecture

```
/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Prisma PostgreSQL models (Users, Equipment, Projects, Requests, CheckInOut, Maintenance, AuditLog)
│   │   └── seed.js             # Seed database with realistic cinema cameras, lenses, lighting & audio gear
│   ├── src/
│   │   ├── config/             # DB & JWT configurations
│   │   ├── controllers/        # REST API controllers (Auth, Equipment, Projects, Requests, Checkin/out, etc.)
│   │   ├── middlewares/        # Auth, Role-check, Rate limiting, Uploads, Error handling
│   │   ├── routes/             # Express API routes
│   │   ├── utils/              # QR generator, Audit logger
│   │   ├── app.js              # Express app with security headers & routes
│   │   └── server.js           # Server bootstrap & DB connection test
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/         # Navbar, Sidebar, StatCards, StatusBadges, QR Scanner modal, QR viewer
│   │   │   ├── equipment/      # Equipment cards, Add/Edit modal, Detail modal
│   │   │   ├── projects/       # Project cards, Project form modal
│   │   │   ├── requests/       # Request wizard modal, Admin review modal
│   │   │   ├── checkinout/     # Handover checkout modal, Return inspection modal
│   │   │   ├── maintenance/    # Maintenance ticket form modal, Resolution modal
│   │   │   └── print/          # Professional A4 printable forms (Handover, Return, QR tags, Audit)
│   │   ├── context/            # AuthContext, NotificationContext
│   │   ├── pages/              # Dashboard, EquipmentList, Projects, Requests, CheckInOut, Maintenance, Reports, Users, Profile
│   │   ├── services/           # Axios API services
│   │   ├── styles/             # custom.css (Blue-grey palette), print.css (A4 layout)
│   │   ├── utils/              # formatters, html2pdf print helper
│   │   ├── App.jsx             # Role-based protected router
│   │   └── main.jsx
│   ├── vite.config.js
│   └── package.json
├── render.yaml                 # Render infrastructure-as-code deployment blueprint
├── .gitignore
├── README.md
└── package.json                # Root convenience scripts
```

---

## 🔒 Security Best Practices Implemented
* **Role-Based Access Control (RBAC)**: Validated on both backend middleware and frontend route guards.
* **Password Hashing**: Strong bcrypt hashing with salt rounds.
* **Token Authentication**: Signed JWT Bearer tokens with configurable expiry.
* **HTTP Security**: Helmet headers configured to prevent clickjacking, MIME sniffing, and cross-site leaks.
* **Rate Limiting**: Protects authentication and API endpoints against brute force attacks.
* **Sanitization & Input Validation**: Validates database queries, duplicate asset tags, and date range logic.

---

## 📄 License
This project is released under the **MIT License**.
