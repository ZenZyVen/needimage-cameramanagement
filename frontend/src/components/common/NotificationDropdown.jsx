import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import { formatDateTime } from '../../utils/formatters';

const NotificationDropdown = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
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

  const getNotifIcon = (type) => {
    switch (type) {
      case 'SUCCESS':
        return 'bi-check-circle-fill text-success';
      case 'WARNING':
        return 'bi-exclamation-triangle-fill text-warning';
      case 'DANGER':
        return 'bi-x-circle-fill text-danger';
      case 'INFO':
      default:
        return 'bi-info-circle-fill text-primary';
    }
  };

  return (
    <div className="position-relative" ref={dropdownRef}>
      <button
        type="button"
        className="btn btn-light position-relative border"
        style={{ width: '40px', height: '40px', padding: 0, borderRadius: '8px' }}
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications"
      >
        <i className="bi bi-bell text-secondary fs-6"></i>
        {unreadCount > 0 && (
          <span
            className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
            style={{ fontSize: '0.65rem' }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="card position-absolute end-0 mt-2 shadow-lg"
          style={{ width: '360px', zIndex: 1050, border: '1px solid #e2e8f0' }}
        >
          <div className="card-header d-flex justify-content-between align-items-center py-2 px-3 bg-white">
            <span className="fw-semibold small text-secondary">
              Notifications ({unreadCount} new)
            </span>
            {unreadCount > 0 && (
              <button
                type="button"
                className="btn btn-link btn-sm text-decoration-none p-0 text-primary"
                style={{ fontSize: '0.75rem' }}
                onClick={markAllAsRead}
              >
                Mark all read
              </button>
            )}
          </div>

          <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div className="text-center py-4 text-muted small">
                <i className="bi bi-bell-slash d-block fs-3 mb-2 text-secondary"></i>
                No notifications yet.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleItemClick(n)}
                  className={`p-3 border-bottom d-flex gap-2 align-items-start ${
                    !n.isRead ? 'bg-light' : 'bg-white'
                  }`}
                  style={{ cursor: 'pointer', transition: 'background-color 0.15s ease' }}
                >
                  <i className={`bi ${getNotifIcon(n.type)} mt-1 fs-6`}></i>
                  <div className="flex-grow-1 min-width-0">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className={`small ${!n.isRead ? 'fw-bold text-dark' : 'fw-medium text-secondary'}`}>
                        {n.title}
                      </span>
                      {!n.isRead && (
                        <span className="badge bg-primary" style={{ fontSize: '0.55rem' }}>NEW</span>
                      )}
                    </div>
                    <p className="small text-muted mb-1 text-truncate" style={{ fontSize: '0.8rem', whiteSpace: 'normal' }}>
                      {n.message}
                    </p>
                    <span className="text-muted" style={{ fontSize: '0.7rem' }}>
                      {formatDateTime(n.createdAt)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
