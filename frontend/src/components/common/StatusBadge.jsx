import React from 'react';
import { getStatusBadgeClass, formatStatusText } from '../../utils/formatters';

const StatusBadge = ({ status, className = '' }) => {
  if (!status) return null;
  const badgeClass = getStatusBadgeClass(status);
  const text = formatStatusText(status);

  return (
    <span className={`badge ${badgeClass} ${className} px-2 py-1 fw-medium`} style={{ fontSize: '0.75rem', letterSpacing: '0.02em' }}>
      {text}
    </span>
  );
};

export default StatusBadge;
