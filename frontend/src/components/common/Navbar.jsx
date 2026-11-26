import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import NotificationDropdown from './NotificationDropdown';
import QRScannerModal from './QRScannerModal';

const ROUTE_META = {
  '/dashboard': { section: 'Overview', title: 'Dashboard', icon: 'bi-grid-1x2-fill' },
  '/equipment': { section: 'Stock & Inventory', title: 'Equipment Vault', icon: 'bi-camera-reels-fill' },
  '/products': { section: 'Stock & Inventory', title: 'Product Management', icon: 'bi-box-seam-fill' },
  '/stock': { section: 'Stock & Inventory', title: 'Stock Management', icon: 'bi-boxes' },
  '/low-stock': { section: 'Stock & Inventory', title: 'Low-Stock Alerts', icon: 'bi-exclamation-triangle-fill' },
  '/stock-movements': { section: 'Stock & Inventory', title: 'Stock Movements Log', icon: 'bi-clock-history' },
  '/projects': { section: 'Stock & Inventory', title: 'Production Projects', icon: 'bi-film' },
  '/requests': { section: 'Stock & Inventory', title: 'Borrow Requests', icon: 'bi-calendar2-check-fill' },
  '/checkin-out': { section: 'Vault Logistics', title: 'Checkout & Check-in', icon: 'bi-arrow-left-right' },
  '/handover-logs': { section: 'Vault Logistics', title: 'Handover & Return Logs', icon: 'bi-card-checklist' },
  '/maintenance': { section: 'Vault Logistics', title: 'Maintenance & Repairs', icon: 'bi-tools' },
  '/reports': { section: 'Operations & Reports', title: 'Loan Activity Report', icon: 'bi-file-earmark-bar-graph-fill' },
  '/history': { section: 'Operations & Reports', title: 'History Records', icon: 'bi-archive-fill' },
  '/activity-log': { section: 'Operations & Reports', title: 'System Activity Log', icon: 'bi-journal-text' },
  '/qr-tags': { section: 'Operations & Reports', title: 'Asset Tag Printing', icon: 'bi-qr-code' },
  '/users': { section: 'Administration', title: 'User & Role Access', icon: 'bi-people-fill' },
  '/settings': { section: 'Administration', title: 'Settings & Invoices', icon: 'bi-gear-fill' },
  '/profile': { section: 'Account', title: 'My Profile & Signature', icon: 'bi-person-circle' }
};

const Navbar = ({ onToggleSidebar }) => {
  const { user, isAdmin, logout } = useAuth();
  const { settings } = useSettings();
  const [showScanner, setShowScanner] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const pageMeta = ROUTE_META[location.pathname] || {
    section: 'Workspace',
    title: settings.companyName || 'Need Image Studio',
    icon: 'bi-boxes'
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN':
        return <span className="badge bg-slate-900 text-white" style={{ fontSize: '0.65rem' }}>ADMIN</span>;
      case 'STOCK_MANAGEMENT':
      case 'STOCK_CONTROLLER':
        return <span className="badge bg-secondary" style={{ fontSize: '0.65rem' }}>STOCK MANAGER</span>;
      case 'USER':
      default:
        return <span className="badge bg-primary" style={{ fontSize: '0.65rem' }}>CREW / USER</span>;
    }
  };

  const userPhoto = user?.profilePhoto || user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80';

  return (
    <>
      <header className="top-navbar no-print">
        <div className="d-flex align-items-center gap-2 gap-sm-3 min-w-0">
          {/* Mobile hamburger */}
          <button
            type="button"
            className="btn btn-sm btn-light border d-lg-none flex-shrink-0"
            onClick={onToggleSidebar}
            aria-label="Toggle Navigation"
          >
            <i className="bi bi-list fs-5"></i>
          </button>

          {/* Dynamic Page Title / Breadcrumb */}
          <div className="d-flex align-items-center gap-2 min-w-0">
            <div
              className="bg-primary-subtle text-primary border border-primary-subtle rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
              style={{ width: '32px', height: '32px' }}
            >
              <i className={`bi ${pageMeta.icon}`} style={{ fontSize: '0.92rem' }}></i>
            </div>
            <div className="min-w-0">
              <div className="text-muted text-uppercase fw-semibold text-truncate d-none d-sm-block" style={{ fontSize: '0.64rem', letterSpacing: '0.06em', lineHeight: 1.1 }}>
                {pageMeta.section}
              </div>
              <span className="fw-bold text-dark d-block text-truncate" style={{ fontSize: '0.94rem', letterSpacing: '-0.015em', lineHeight: 1.25 }}>
                {pageMeta.title}
              </span>
            </div>
          </div>

          {/* Quick Scanner Shortcut */}
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm d-none d-md-inline-flex align-items-center gap-2 ms-2"
            onClick={() => setShowScanner(true)}
            title="Scan Equipment Barcode / QR Code"
            style={{ height: '32px', minHeight: '32px', fontSize: '0.78rem', padding: '0 0.7rem' }}
          >
            <i className="bi bi-qr-code-scan text-primary"></i>
            <span className="fw-medium d-none d-lg-inline">Scan QR / Barcode</span>
          </button>
        </div>

        {/* Right Nav Utilities */}
        <div className="d-flex align-items-center gap-3">
          {/* Welcome Greeting */}
          <div className="d-none d-md-flex align-items-center gap-1 text-secondary" style={{ fontSize: '0.84rem', whiteSpace: 'nowrap' }}>
            <span>Welcome back,</span>
            <strong className="text-dark">{user?.name || 'Studio Member'}</strong>
          </div>

          {/* Notifications */}
          <NotificationDropdown />

          {/* User Profile Menu */}
          <div className="position-relative" ref={userMenuRef}>
            <button
              type="button"
              className="btn btn-light border d-flex align-items-center gap-2 px-2 py-1"
              style={{ borderRadius: '8px' }}
              onClick={() => setUserMenuOpen(!userMenuOpen)}
            >
              <img
                src={userPhoto}
                alt={user?.name || 'User'}
                referrerPolicy="no-referrer"
                className="rounded-circle border"
                style={{ width: '28px', height: '28px', objectFit: 'cover' }}
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'; }}
              />
              <div className="text-start d-none d-sm-block">
                <div className="fw-semibold text-dark small" style={{ fontSize: '0.82rem', lineHeight: '1.2' }}>
                  {user?.name || 'User'}
                </div>
                <div>{getRoleBadge(user?.role)}</div>
              </div>
              <i className="bi bi-chevron-down text-muted small ms-1" style={{ fontSize: '0.7rem' }}></i>
            </button>

            {userMenuOpen && (
              <div
                className="card position-absolute end-0 mt-2 shadow-lg py-1"
                style={{ width: '240px', zIndex: 1060, border: '1px solid #e2e8f0', borderRadius: '10px' }}
              >
                <div className="px-3 py-2 border-bottom">
                  <div className="fw-bold small text-dark">{user?.name}</div>
                  <div className="text-muted text-truncate" style={{ fontSize: '0.72rem' }}>{user?.email}</div>
                  <div className="text-muted text-truncate mt-1" style={{ fontSize: '0.72rem' }}>
                    <i className="bi bi-building me-1"></i>{user?.department || 'Production Department'}
                  </div>
                </div>
                <Link
                  to="/profile"
                  className="dropdown-item px-3 py-2 small d-flex align-items-center gap-2 text-secondary"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <i className="bi bi-person"></i> My Profile & Signature
                </Link>

                {isAdmin && (
                  <Link
                    to="/settings"
                    className="dropdown-item px-3 py-2 small d-flex align-items-center gap-2 text-secondary"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <i className="bi bi-gear"></i> System Settings
                  </Link>
                )}

                <div className="dropdown-divider my-1"></div>
                <button
                  type="button"
                  className="dropdown-item px-3 py-2 small d-flex align-items-center gap-2 text-danger"
                  onClick={handleLogout}
                >
                  <i className="bi bi-box-arrow-right"></i> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Quick QR Scanner Modal */}
      <QRScannerModal
        show={showScanner}
        onHide={() => setShowScanner(false)}
      />
    </>
  );
};

export default Navbar;
