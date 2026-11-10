require('dotenv').config();
const app = require('./app');
const { checkDatabaseConnection } = require('./config/db');

const PORT = process.env.PORT || 5000;

async function startServer() {
  console.log('🎬 Starting Camera Equipment Management Backend Server...');

  // Test Neon PostgreSQL connection on startup
  await checkDatabaseConnection();

  app.listen(PORT, () => {
    console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log(`📡 API Health Check: http://localhost:${PORT}/api/health`);
  });
}

startServer();
