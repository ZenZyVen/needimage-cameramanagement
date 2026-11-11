import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { SettingsProvider } from './context/SettingsContext';

// Common Layout
import Navbar from './components/common/Navbar';
import Sidebar from './components/common/Sidebar';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import EquipmentList from './pages/EquipmentList';
import StockManagement from './pages/StockManagement';
import Projects from './pages/Projects';
import BorrowRequests from './pages/BorrowRequests';
import CheckInOut from './pages/CheckInOut';
import Maintenance from './pages/Maintenance';
import Reports from './pages/Reports';
import ActivityLog from './pages/ActivityLog';
import QRScannerPage from './pages/QRScannerPage';
import Users from './pages/Users';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import LowStockAlerts from './pages/LowStockAlerts';
import StockMovements from './pages/StockMovements';

// Protected App Layout Wrapper
const AppLayout = () => {
  const { isAuthenticated, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="small text-muted mt-2">Loading CineVault Session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="page-body">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

// Role Guard Component
const RoleRoute = ({ allowedRoles = [] }) => {
  const { user } = useAuth();
  if (!user || (allowedRoles.length > 0 && !allowedRoles.includes(user.role))) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
};

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <SettingsProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Workspace Routes */}
              <Route element={<AppLayout />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/equipment" element={<EquipmentList />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/requests" element={<BorrowRequests />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/qr-tags" element={<QRScannerPage />} />
                <Route path="/profile" element={<Profile />} />

                {/* Staff Only Routes (Admin & Stock Controller) */}
                <Route element={<RoleRoute allowedRoles={['ADMIN', 'STOCK_CONTROLLER']} />}>
                  <Route path="/stock" element={<StockManagement />} />
                  <Route path="/low-stock" element={<LowStockAlerts />} />
                  <Route path="/stock-movements" element={<StockMovements />} />
                  <Route path="/checkin-out" element={<CheckInOut />} />
                  <Route path="/maintenance" element={<Maintenance />} />
                </Route>

                {/* Admin Only Routes */}
                <Route element={<RoleRoute allowedRoles={['ADMIN']} />}>
                  <Route path="/activity-log" element={<ActivityLog />} />
                  <Route path="/users" element={<Users />} />
                  <Route path="/settings" element={<Settings />} />
                </Route>
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
        </SettingsProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
