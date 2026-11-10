import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, isAdmin, isStockController } = useAuth();

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
          src="/logo.svg"
          alt="CineVault"
          style={{ width: '34px', height: '34px' }}
        />
        <div>
          <h1 className="sidebar-brand-name">CineVault</h1>
          <p className="sidebar-brand-sub">Gear Management</p>
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

        {/* Inventory Section */}
        <div className="nav-section-title">Inventory & Operations</div>
        <NavLink
          to="/equipment"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          onClick={onClose}
        >
          <i className="bi bi-camera-fill"></i>
          <span>Equipment Catalog</span>
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
          <i className="bi bi-calendar2-check"></i>
          <span>Borrow Requests</span>
        </NavLink>

        {/* Staff Operations: Stock Controller & Admin */}
        {(isAdmin || isStockController) && (
          <>
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
        <div className="nav-section-title">Reports & Tools</div>
        <NavLink
          to="/reports"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          onClick={onClose}
        >
          <i className="bi bi-file-earmark-bar-graph"></i>
          <span>Reports & A4 Forms</span>
        </NavLink>

        <NavLink
          to="/qr-tags"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          onClick={onClose}
        >
          <i className="bi bi-qr-code"></i>
          <span>Asset Tag Printing</span>
        </NavLink>

        {/* Admin Section */}
        {isAdmin && (
          <>
            <div className="nav-section-title">Administration</div>
            <NavLink
              to="/users"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <i className="bi bi-people-fill"></i>
              <span>User Management</span>
            </NavLink>
          </>
        )}
      </div>

      {/* Footer / System Status */}
      <div className="sidebar-footer">
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <span
              className="badge rounded-pill bg-success"
              style={{ width: '8px', height: '8px', padding: 0 }}
            ></span>
            <span className="small text-muted" style={{ fontSize: '0.72rem' }}>
              Neon DB Connected
            </span>
          </div>
          <span className="badge bg-secondary-subtle text-secondary" style={{ fontSize: '0.65rem' }}>
            v1.0.0
          </span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
