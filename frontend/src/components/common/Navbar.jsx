import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import NotificationDropdown from './NotificationDropdown';
import QRScannerModal from './QRScannerModal';

const Navbar = ({ onToggleSidebar }) => {
  const { user, isAdmin, logout } = useAuth();
  const { settings } = useSettings();
  const [showScanner, setShowScanner] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const navigate = useNavigate();

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
      case 'STOCK_CONTROLLER':
        return <span className="badge bg-secondary" style={{ fontSize: '0.65rem' }}>STOCK CONTROLLER</span>;
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

          {/* System Branding / Name */}
          <div className="d-flex align-items-center gap-2 min-w-0">
            <div
              className="bg-primary text-white rounded d-flex align-items-center justify-content-center flex-shrink-0 shadow-xs"
              style={{ width: '30px', height: '30px' }}
            >
              <i className="bi bi-boxes" style={{ fontSize: '0.9rem' }}></i>
            </div>
            <span className="fw-bold text-dark fs-6 text-truncate" style={{ letterSpacing: '-0.02em' }}>
              Stock & Inventory Management System
            </span>
          </div>

          {/* Quick Scanner Shortcut */}
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm d-none d-xl-flex align-items-center gap-2 ms-2"
            onClick={() => setShowScanner(true)}
            title="Scan Equipment Barcode / QR Code"
            style={{ height: '32px', fontSize: '0.78rem' }}
          >
            <i className="bi bi-qr-code-scan text-primary"></i>
            <span className="fw-medium">Scan Barcode / QR</span>
          </button>
        </div>

        {/* Right Nav Utilities */}
        <div className="d-flex align-items-center gap-3">
          {/* Welcome Greeting */}
          <div className="d-none d-md-flex align-items-center gap-1 text-secondary" style={{ fontSize: '0.84rem', whiteSpace: 'nowrap' }}>
            <span>Welcome back,</span>
            <strong className="text-dark">{user?.name || 'Sarah Connor'}</strong>
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
