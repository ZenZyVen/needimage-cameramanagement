import React from 'react';

const StatCard = ({ title, value, icon, iconBg = '#f1f5f9', iconColor = '#334155', subtitle, trend, onClick }) => {
  return (
    <div
      className={`card border-0 shadow-sm h-100 ${onClick ? 'cursor-pointer equipment-card' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
    >
      <div className="stat-card">
        <div>
          <p className="stat-label mb-1" title={title}>{title}</p>
          <div className="stat-value">{value}</div>
          {subtitle && (
            <p className="small text-muted mb-0 mt-1 text-truncate" style={{ fontSize: '0.75rem' }} title={subtitle}>
              {subtitle}
            </p>
          )}
          {trend && (
            <div className="mt-2 text-truncate">
              <span className={`badge ${trend.positive ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'} me-1`}>
                {trend.value}
              </span>
              <span className="text-muted small" style={{ fontSize: '0.72rem' }}>{trend.text}</span>
            </div>
          )}
        </div>
        <div
          className="stat-icon-wrapper"
          style={{ backgroundColor: iconBg, color: iconColor }}
        >
          <i className={`bi ${icon}`}></i>
        </div>
      </div>
    </div>
  );
};

export default StatCard;
