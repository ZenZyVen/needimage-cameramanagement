const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
const { errorHandler } = require('./middlewares/errorHandler');
const { checkDatabaseConnection } = require('./config/db');

// Route imports
const authRoutes = require('./routes/authRoutes');
const equipmentRoutes = require('./routes/equipmentRoutes');
const projectRoutes = require('./routes/projectRoutes');
const borrowRequestRoutes = require('./routes/borrowRequestRoutes');
const checkInOutRoutes = require('./routes/checkInOutRoutes');
const maintenanceRoutes = require('./routes/maintenanceRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const reportRoutes = require('./routes/reportRoutes');
const userRoutes = require('./routes/userRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');

const app = express();
app.set('trust proxy', 1);

// Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:", "https:", "http:"],
      connectSrc: ["'self'", "https:", "http:"],
      mediaSrc: ["'self'", "blob:", "mediastream:"],
      workerSrc: ["'self'", "blob:"]
    }
  }
}));

// CORS Configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  ...(process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',') : []),
  process.env.RENDER_EXTERNAL_URL,
  process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : null,
  process.env.KOYEB_PUBLIC_DOMAIN ? `https://${process.env.KOYEB_PUBLIC_DOMAIN}` : null
]
  .filter(Boolean)
  .map(origin => origin.trim().replace(/^["']|["']$/g, '').replace(/\/+$/, ''));

const hasCustomClientUrl = Boolean(
  process.env.CLIENT_URL &&
  process.env.CLIENT_URL.split(',').some(u => {
    const cleaned = u.trim().replace(/^["']|["']$/g, '');
    return cleaned && !cleaned.includes('localhost') && !cleaned.includes('127.0.0.1');
  })
);
const HOSTING_PLATFORM_ORIGIN_REGEX = /^https:\/\/[a-z0-9-]+\.(onrender\.com|vercel\.app|netlify\.app)$/i;

app.use(cors({
  origin: function (origin, callback) {
    const normalizedOrigin = origin ? origin.trim().replace(/\/+$/, '') : '';
    // Allow requests with no origin (mobile apps, curl, server-to-server, or same-origin)
    if (
      !origin ||
      allowedOrigins.includes(normalizedOrigin) ||
      process.env.NODE_ENV !== 'production' ||
      (!hasCustomClientUrl && HOSTING_PLATFORM_ORIGIN_REGEX.test(normalizedOrigin))
    ) {
      return callback(null, true);
    }
    console.warn(`Blocked CORS request from origin: ${origin}`);
    return callback(new Error('Origin not allowed by CORS policy'), false);
  },
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Static folder for uploaded equipment images (sandboxed against script execution)
app.use('/uploads', (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; sandbox");
  next();
}, express.static(path.join(__dirname, '../uploads')));

// Strict Rate Limiter for Authentication Endpoints (Brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 25, // Limit each IP to 25 failed auth attempts per 15 minutes
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many failed authentication attempts from this IP, please try again after 15 minutes.'
  }
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// General API Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  }
});
app.use('/api/', apiLimiter);

// Health & Database Status Check
app.get('/api/health', async (req, res) => {
  const dbStatus = await checkDatabaseConnection(3500);
  return res.json({
    status: 'ONLINE',
    service: 'Camera Equipment Management API',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      connected: dbStatus.connected,
      type: 'PostgreSQL / Neon',
      note: dbStatus.connected ? 'Connected to live database' : 'Database connection pending. Set DATABASE_URL in .env.'
    }
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/requests', borrowRequestRoutes);
app.use('/api/checkinout', checkInOutRoutes);
app.use('/api/checkin-out', checkInOutRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/invoices', invoiceRoutes);

// Serve frontend build in production or when dist exists
const possibleDistPaths = [
  path.join(__dirname, '../../frontend/dist'),
  path.join(process.cwd(), 'frontend/dist'),
  path.join(process.cwd(), '../frontend/dist')
];
const frontendDist = possibleDistPaths.find(p => fs.existsSync(p));
if (frontendDist) {
  console.log(`📦 Serving frontend static production build from: ${frontendDist}`);
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// 404 Handler for API
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`
  });
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
