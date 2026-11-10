export const formatCurrency = (val) => {
  if (val === null || val === undefined) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(val);
};

export const formatDate = (dateString) => {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatDateTime = (dateString) => {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'AVAILABLE':
    case 'APPROVED':
    case 'RESOLVED':
    case 'COMPLETED':
      return 'badge-status-available';
    case 'BORROWED':
    case 'IN_PRODUCTION':
    case 'PARTIALLY_RETURNED':
    case 'IN_REPAIR':
      return 'badge-status-borrowed';
    case 'UNDER_MAINTENANCE':
    case 'SENT_TO_VENDOR':
    case 'IN_INSPECTION':
      return 'badge-status-maintenance';
    case 'DAMAGED':
    case 'REJECTED':
    case 'WRITTEN_OFF':
    case 'OVERDUE':
      return 'badge-status-damaged';
    case 'PENDING':
    case 'PLANNING':
      return 'badge-status-pending';
    case 'RETIRED':
    case 'CANCELLED':
    default:
      return 'badge-status-retired';
  }
};

export const formatStatusText = (status) => {
  if (!status) return '';
  return status
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
};
