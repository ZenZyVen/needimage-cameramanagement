import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import { formatDateTime } from '../../utils/formatters';

const NotificationDropdown = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, fetchNotifications } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleItemClick = async (notif) => {
    if (!notif.isRead) {
      await markAsRead(notif.id);
    }
    setIsOpen(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const getNotifMeta = (type) => {
    switch (type) {
      case 'SUCCESS':
        return {
          icon: 'bi-check-circle-fill',
          color: 'text-success',
          bg: 'rgba(16, 185, 129, 0.1)',
          badgeClass: 'bg-success text-white'
        };
      case 'WARNING':
        return {
          icon: 'bi-exclamation-triangle-fill',
          color: 'text-warning',
          bg: 'rgba(245, 158, 11, 0.1)',
          badgeClass: 'bg-warning text-dark'
        };
      case 'DANGER':
        return {
          icon: 'bi-x-circle-fill',
          color: 'text-danger',
          bg: 'rgba(239, 68, 68, 0.1)',
          badgeClass: 'bg-danger text-white'
        };
      case 'INFO':
      default:
        return {
          icon: 'bi-bell-fill',
          color: 'text-primary',
          bg: 'rgba(37, 99, 235, 0.1)',
          badgeClass: 'bg-primary text-white'
        };
    }
  };

  return (
    <div className="position-relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        className="btn btn-light position-relative border shadow-xs d-flex align-items-center justify-content-center"
        style={{ width: '38px', height: '38px', padding: 0, borderRadius: '8px' }}
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        title="Real-Time System Notifications"
      >
        <i className={`bi bi-bell${unreadCount > 0 ? '-fill text-primary' : ' text-secondary'} fs-6`}></i>
        {unreadCount > 0 && (
          <span
            className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-white"
            style={{ fontSize: '0.62rem', padding: '0.25em 0.5em' }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          className="card position-absolute end-0 mt-2 shadow-lg border-0"
          style={{ width: '390px', maxWidth: '92vw', zIndex: 1060, borderRadius: '10px', overflow: 'hidden' }}
        >
          {/* Header */}
          <div className="card-header d-flex justify-content-between align-items-center py-2 px-3 bg-white border-bottom">
            <div className="d-flex align-items-center gap-2">
              <span className="fw-bold small text-dark">Real-Time Alerts</span>
              {unreadCount > 0 ? (
                <span className="badge bg-danger rounded-pill" style={{ fontSize: '0.65rem' }}>
                  {unreadCount} unread
                </span>
              ) : (
                <span className="badge bg-light text-muted border rounded-pill" style={{ fontSize: '0.65rem' }}>
                  All caught up
                </span>
              )}
            </div>

            <div className="d-flex align-items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  className="btn btn-link btn-sm text-decoration-none p-0 text-primary fw-medium"
                  style={{ fontSize: '0.74rem' }}
                  onClick={markAllAsRead}
                >
                  Mark all read
                </button>
              )}
              <button
                type="button"
                className="btn btn-link btn-sm text-muted p-0"
                style={{ fontSize: '0.8rem' }}
                onClick={() => setIsOpen(false)}
                title="Close"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div className="text-center py-5 text-muted small">
                <i className="bi bi-bell-slash d-block fs-2 mb-2 text-secondary opacity-50"></i>
                <div className="fw-medium">No alerts right now</div>
                <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                  Important actions like requests, checkouts, and stock updates will appear here.
                </div>
              </div>
            ) : (
              notifications.map((n) => {
                const meta = getNotifMeta(n.type);
                return (
                  <div
                    key={n.id}
                    onClick={() => handleItemClick(n)}
                    className={`p-3 border-bottom d-flex gap-2 align-items-start ${
                      !n.isRead ? 'bg-light bg-opacity-75' : 'bg-white'
                    }`}
                    style={{ cursor: 'pointer', transition: 'background-color 0.15s ease' }}
                  >
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 mt-1"
                      style={{ width: '28px', height: '28px', backgroundColor: meta.bg }}
                    >
                      <i className={`bi ${meta.icon} ${meta.color}`} style={{ fontSize: '0.85rem' }}></i>
                    </div>

                    <div className="flex-grow-1 min-width-0">
                      <div className="d-flex justify-content-between align-items-start gap-1 mb-1">
                        <span className={`small text-truncate ${!n.isRead ? 'fw-bold text-dark' : 'fw-semibold text-secondary'}`}>
                          {n.title}
                        </span>
                        {!n.isRead && (
                          <span
                            className="badge bg-primary flex-shrink-0 rounded-pill"
                            style={{ fontSize: '0.55rem', padding: '0.2em 0.5em' }}
                          >
                            NEW
                          </span>
                        )}
                      </div>

                      <p className="small text-secondary mb-1" style={{ fontSize: '0.78rem', lineHeight: '1.35', margin: 0 }}>
                        {n.message}
                      </p>

                      <div className="d-flex justify-content-between align-items-center mt-2">
                        <span className="text-muted font-monospace" style={{ fontSize: '0.68rem' }}>
                          <i className="bi bi-clock me-1"></i>
                          {formatDateTime(n.createdAt)}
                        </span>
                        {!n.isRead && (
                          <button
                            type="button"
                            className="btn btn-link btn-sm p-0 text-muted"
                            style={{ fontSize: '0.7rem' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(n.id);
                            }}
                            title="Mark as read"
                          >
                            Mark read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer link to History Records */}
          <div className="card-footer bg-light py-2 px-3 d-flex justify-content-between align-items-center border-top">
            <Link
              to="/history"
              className="small text-primary text-decoration-none fw-semibold d-flex align-items-center gap-1"
              onClick={() => setIsOpen(false)}
            >
              <i className="bi bi-clock-history"></i>
              <span>View Full History Records</span>
            </Link>
            <span className="text-muted" style={{ fontSize: '0.7rem' }}>Real-Time Sync</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
