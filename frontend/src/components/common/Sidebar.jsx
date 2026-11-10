import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, isAdmin, isStockController } = useAuth();
  const { settings } = useSettings();

  return (
    <aside
      className={`sidebar no-print ${isOpen ? 'show' : ''}`}
      style={{
        position: 'relative',
        minHeight: '100vh'
      }}
    >
      {/* Brand Header */}
      <div className="sidebar-header">
        <img
          src={settings.logoUrl || '/logo.svg'}
          alt={settings.companyName || 'CineVault'}
          style={{ width: '36px', height: '36px', objectFit: 'contain' }}
          onError={(e) => { e.target.src = '/logo.svg'; }}
        />
        <div style={{ overflow: 'hidden' }}>
          <h1 className="sidebar-brand-name text-truncate" title={settings.companyName || 'CineVault'}>
            {settings.companyName ? settings.companyName.split(' ')[0] : 'CineVault'}
          </h1>
          <p className="sidebar-brand-sub text-truncate">Stock & Vault System</p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="sidebar-nav">
        {/* Main Section */}
        <div className="nav-section-title">Overview</div>
        <NavLink
          to="/dashboard"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          onClick={onClose}
        >
          <i className="bi bi-grid-1x2-fill"></i>
          <span>Dashboard</span>
        </NavLink>

        {/* Core Inventory Section */}
        <div className="nav-section-title">Stock & Inventory</div>
        <NavLink
          to="/equipment"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          onClick={onClose}
        >
          <i className="bi bi-box-seam-fill"></i>
          <span>Stock & Vault</span>
        </NavLink>

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

        {/* Vault Logistics Operations: Stock Controller & Admin */}
        {(isAdmin || isStockController) && (
          <>
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
              to="/maintenance"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <i className="bi bi-tools"></i>
              <span>Maintenance & Repairs</span>
            </NavLink>
          </>
        )}

        {/* Documents & Reports */}
        <div className="nav-section-title">Reports & Documents</div>
        <NavLink
          to="/reports"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          onClick={onClose}
        >
          <i className="bi bi-file-earmark-bar-graph-fill"></i>
          <span>A4 Reports & Audits</span>
        </NavLink>

        <NavLink
          to="/qr-tags"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          onClick={onClose}
        >
          <i className="bi bi-qr-code"></i>
          <span>Asset Tag Printing</span>
        </NavLink>

        {/* Administration */}
        {isAdmin && (
          <>
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
              <span>System Settings</span>
            </NavLink>
          </>
        )}
      </div>

      {/* Footer / Status */}
      <div className="sidebar-footer">
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <span
              className="badge rounded-pill bg-success"
              style={{ width: '8px', height: '8px', padding: 0 }}
            ></span>
            <span className="small text-white-50" style={{ fontSize: '0.72rem' }}>
              Vault System Online
            </span>
          </div>
          <span className="badge bg-slate-800 text-slate-300" style={{ fontSize: '0.65rem' }}>
            v2.0.0
          </span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
