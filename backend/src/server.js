const path = require('path');
const dotenv = require('dotenv');
// Load environment variables from backend/.env or root .env
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config();
const app = require('./app');
const { checkDatabaseConnection } = require('./config/db');

const PORT = process.env.PORT || 5000;

async function startServer() {
  console.log('🎬 Starting Camera Equipment Management Backend Server...');

  const HOST = '0.0.0.0';
  app.listen(PORT, HOST, () => {
    console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on http://${HOST}:${PORT}`);
    console.log(`📡 API Health Check: http://${HOST}:${PORT}/api/health`);
  });

  // Test Neon PostgreSQL connection asynchronously so Render's port scanner never waits on DB cold starts
  checkDatabaseConnection(10000).catch(() => {});
}

startServer();
