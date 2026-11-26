import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, isAdmin, isStockController } = useAuth();
  const { settings } = useSettings();

  const userInitials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'CV';

  const avatarSrc = user?.profilePhoto || (user?.avatar?.startsWith('http') || user?.avatar?.startsWith('/') || user?.avatar?.startsWith('data:') ? user.avatar : null);

  return (
    <aside className={`sidebar no-print ${isOpen ? 'show' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-header justify-content-between">
        <div className="d-flex align-items-center gap-2.5 min-w-0">
          <div className="sidebar-logo-wrap">
            <img
              src={settings.logoUrl || '/Need-Image_StudioLogo_White.png'}
              alt={settings.companyName || 'Need Image Studio'}
              style={{ width: '26px', height: '26px', objectFit: 'contain' }}
              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/Need-Image_StudioLogo_White.png'; }}
            />
          </div>
          <div className="min-w-0">
            <h1 className="sidebar-brand-name text-truncate" title={settings.companyName || 'Need Image Studio'}>
              {settings.companyName || 'Need Image Studio'}
            </h1>
            <p className="sidebar-brand-sub text-truncate">Stock & Vault System</p>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-sm text-white-50 d-lg-none p-1 border-0"
          onClick={onClose}
          aria-label="Close Navigation"
        >
          <i className="bi bi-x-lg"></i>
        </button>
      </div>

      {/* Scrollable Navigation Links */}
      <nav className="sidebar-nav" aria-label="Main Navigation">
        {/* Main Section */}
        <div className="nav-section">
          <div className="nav-section-title">Overview</div>
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <i className="bi bi-grid-1x2-fill"></i>
            <span>Dashboard</span>
          </NavLink>
        </div>

        {/* Core Inventory Section */}
        <div className="nav-section">
          <div className="nav-section-title">Stock & Inventory</div>
          <NavLink
            to="/equipment"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <i className="bi bi-camera-reels-fill"></i>
            <span>Equipment Vault</span>
          </NavLink>

          {isAdmin && (
            <NavLink
              to="/products"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <i className="bi bi-box-seam-fill"></i>
              <span>Product Management</span>
            </NavLink>
          )}

          {(isAdmin || isStockController) && (
            <>
              <NavLink
                to="/stock"
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <i className="bi bi-boxes"></i>
                <span>Stock Management</span>
              </NavLink>

              <NavLink
                to="/low-stock"
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <i className="bi bi-exclamation-triangle-fill"></i>
                <span>Low-Stock Alerts</span>
              </NavLink>

              <NavLink
                to="/stock-movements"
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <i className="bi bi-clock-history"></i>
                <span>Stock Movements Log</span>
              </NavLink>
            </>
          )}

          <NavLink
            to="/projects"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <i className="bi bi-film"></i>
            <span>Production Projects</span>
          </NavLink>

          <NavLink
            to="/requests"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <i className="bi bi-calendar2-check-fill"></i>
            <span>Borrow Requests</span>
          </NavLink>
        </div>

        {/* Vault Logistics Operations: Stock Controller & Admin */}
        {(isAdmin || isStockController) && (
          <div className="nav-section">
            <div className="nav-section-title">Vault Logistics</div>
            <NavLink
              to="/checkin-out"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <i className="bi bi-arrow-left-right"></i>
              <span>Checkout & Check-in</span>
            </NavLink>

            <NavLink
              to="/handover-logs"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <i className="bi bi-card-checklist"></i>
              <span>Handover & Return Logs</span>
            </NavLink>

            <NavLink
              to="/maintenance"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <i className="bi bi-tools"></i>
              <span>Maintenance & Repairs</span>
            </NavLink>
          </div>
        )}

        {/* Documents & Reports */}
        <div className="nav-section">
          <div className="nav-section-title">Operations & Reports</div>
          <NavLink
            to="/reports"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <i className="bi bi-file-earmark-bar-graph-fill"></i>
            <span>Loan Activity Report</span>
          </NavLink>

          <NavLink
            to="/history"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <i className="bi bi-archive-fill"></i>
            <span>History Records</span>
          </NavLink>

          {isAdmin && (
            <NavLink
              to="/activity-log"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <i className="bi bi-journal-text"></i>
              <span>System Activity Log</span>
            </NavLink>
          )}

          <NavLink
            to="/qr-tags"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <i className="bi bi-qr-code"></i>
            <span>Asset Tag Printing</span>
          </NavLink>
        </div>

        {/* Administration */}
        {isAdmin && (
          <div className="nav-section">
            <div className="nav-section-title">Administration</div>
            <NavLink
              to="/users"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <i className="bi bi-people-fill"></i>
              <span>User & Role Access</span>
            </NavLink>

            <NavLink
              to="/settings"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <i className="bi bi-gear-fill"></i>
              <span>Settings & Invoices</span>
            </NavLink>
          </div>
        )}
      </nav>

      {/* Pinned Footer: Active User + Online Status */}
      <div className="sidebar-footer">
        {user && (
          <NavLink to="/profile" className="sidebar-user-card" onClick={onClose}>
            {avatarSrc ? (
              <img src={avatarSrc} alt={user.name} className="sidebar-user-avatar" />
            ) : (
              <div className="sidebar-user-initials">{userInitials}</div>
            )}
            <div className="min-w-0 flex-grow-1">
              <div className="fw-semibold text-truncate" style={{ fontSize: '0.8rem', lineHeight: 1.2 }}>
                {user.name}
              </div>
              <div className="text-slate-400 text-truncate font-monospace" style={{ fontSize: '0.7rem' }}>
                {user.username ? `@${user.username}` : user.email}
              </div>
            </div>
            <i className="bi bi-chevron-right text-slate-500" style={{ fontSize: '0.7rem' }}></i>
          </NavLink>
        )}

        <div className="d-flex align-items-center justify-content-between px-1">
          <div className="d-flex align-items-center gap-2">
            <span
              className="badge rounded-pill bg-success"
              style={{ width: '7px', height: '7px', padding: 0 }}
            ></span>
            <span className="text-slate-400" style={{ fontSize: '0.7rem', fontWeight: 500 }}>
              Vault System Online
            </span>
          </div>
          <span className="badge bg-slate-800 text-slate-300" style={{ fontSize: '0.62rem' }}>
            v2.0.0
          </span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
