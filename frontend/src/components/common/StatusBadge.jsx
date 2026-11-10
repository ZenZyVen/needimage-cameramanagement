import React from 'react';
import { getStatusBadgeClass, formatStatusText } from '../../utils/formatters';

const StatusBadge = ({ status, className = '' }) => {
  if (!status) return null;
  const badgeClass = getStatusBadgeClass(status);
  const text = formatStatusText(status);

  // Status dot color
  let dotColor = '#64748b';
  if (['AVAILABLE', 'APPROVED', 'RESOLVED', 'COMPLETED'].includes(status)) {
    dotColor = '#059669';
  } else if (['BORROWED', 'IN_PRODUCTION', 'PARTIALLY_RETURNED'].includes(status)) {
    dotColor = '#d97706';
  } else if (['DAMAGED', 'REJECTED', 'WRITTEN_OFF', 'OVERDUE'].includes(status)) {
    dotColor = '#dc2626';
  } else if (['PENDING', 'PLANNING'].includes(status)) {
    dotColor = '#2563eb';
  }

  return (
    <span
      className={`badge ${badgeClass} ${className} px-2 py-1 fw-semibold d-inline-flex align-items-center`}
      style={{ fontSize: '0.72rem', letterSpacing: '0.02em', borderRadius: '14px' }}
    >
      <span className="status-dot" style={{ backgroundColor: dotColor }}></span>
      {text}
    </span>
  );
};

export default StatusBadge;
