import React from 'react';
import StatusBadge from '../common/StatusBadge';
import { formatCurrency } from '../../utils/formatters';

const EquipmentCard = ({
  equipment,
  onView,
  onShowQR,
  onEdit,
  onDelete,
  canManage = false,
  onRequest = null,
  onFastCheckout = null,
  onFastCheckin = null
}) => {
  const defaultImage = 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&auto=format&fit=crop&q=80';
  const accessoriesCount = Array.isArray(equipment.accessories) ? equipment.accessories.length : 0;
  const activeLoan = equipment.borrowItems?.[0]?.request;

  return (
    <div className="card h-100 equipment-card">
      {/* Image & Header Overlay */}
      <div className="equipment-image-container">
        <img
          src={equipment.imageUrl || defaultImage}
          alt={equipment.name}
          onError={(e) => { e.target.src = defaultImage; }}
        />
        <div className="position-absolute top-0 start-0 m-2">
          <span className="badge bg-slate-900 text-white shadow-sm" style={{ fontSize: '0.72rem', letterSpacing: '0.04em' }}>
            {equipment.assetTag}
          </span>
        </div>
        <div className="position-absolute top-0 end-0 m-2">
          <StatusBadge status={equipment.status} />
        </div>
      </div>

      {/* Card Body */}
      <div className="card-body p-3 d-flex flex-column justify-content-between">
        <div>
          {/* Brand & Category */}
          <div className="d-flex justify-content-between align-items-center mb-1">
            <span className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.68rem', letterSpacing: '0.05em' }}>
              {equipment.brand} • {equipment.category?.name || 'Vault Gear'}
            </span>
            {accessoriesCount > 0 && (
              <span className="badge bg-light text-secondary border" style={{ fontSize: '0.65rem' }}>
                <i className="bi bi-box me-1"></i>{accessoriesCount} accs
              </span>
            )}
          </div>

          {/* Equipment Name */}
          <h6
            className="fw-bold text-dark text-truncate mb-1"
            title={equipment.name}
            style={{ fontSize: '0.92rem', cursor: 'pointer' }}
            onClick={() => onView(equipment)}
          >
            {equipment.name}
          </h6>

          {/* Serial Number */}
          <p className="small text-muted mb-2 text-truncate" style={{ fontSize: '0.78rem' }}>
            SN: <span className="text-secondary fw-medium">{equipment.serialNumber}</span>
          </p>

          {/* Location & Daily Rate */}
          <div className="d-flex justify-content-between align-items-center small text-muted border-top pt-2 mt-2">
            <div>
              <i className="bi bi-geo-alt me-1 text-primary"></i>
              <span className="text-secondary fw-medium" style={{ fontSize: '0.75rem' }}>
                {equipment.location || 'Vault Main'}
              </span>
            </div>
            {equipment.dailyRate && (
              <div className="fw-semibold text-dark" style={{ fontSize: '0.8rem' }}>
                {formatCurrency(equipment.dailyRate)} <span className="text-muted fw-normal" style={{ fontSize: '0.7rem' }}>/day</span>
              </div>
            )}
          </div>

          {/* Active Borrower Info if Borrowed */}
          {equipment.status === 'BORROWED' && activeLoan && (
            <div className="p-2 border rounded bg-warning-subtle mt-2 small" style={{ fontSize: '0.75rem' }}>
              <i className="bi bi-person-fill me-1 text-warning-emphasis"></i>
              With: <strong className="text-dark">{activeLoan.user?.name}</strong>
            </div>
          )}
        </div>

        {/* Action Buttons Toolbar */}
        <div className="border-top pt-2 mt-3">
          <div className="d-flex align-items-center gap-1 mb-1">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm flex-fill"
              style={{ fontSize: '0.75rem', height: '32px' }}
              onClick={() => onView(equipment)}
            >
              <i className="bi bi-eye me-1"></i> Details
            </button>

            <button
              type="button"
              className="btn btn-light border btn-sm"
              style={{ width: '32px', height: '32px', padding: 0 }}
              title="Print / View QR Tag"
              onClick={() => onShowQR(equipment)}
            >
              <i className="bi bi-qr-code text-secondary" style={{ fontSize: '0.85rem' }}></i>
            </button>

            {canManage && (
              <>
                <button
                  type="button"
                  className="btn btn-light border btn-sm"
                  style={{ width: '32px', height: '32px', padding: 0 }}
                  title="Edit Equipment"
                  onClick={() => onEdit(equipment)}
                >
                  <i className="bi bi-pencil text-secondary" style={{ fontSize: '0.85rem' }}></i>
                </button>
                <button
                  type="button"
                  className="btn btn-light border btn-sm text-danger"
                  style={{ width: '32px', height: '32px', padding: 0 }}
                  title="Delete Equipment"
                  onClick={() => onDelete(equipment.id)}
                >
                  <i className="bi bi-trash" style={{ fontSize: '0.85rem' }}></i>
                </button>
              </>
            )}
          </div>

          {/* Fast Handover or Fast Return button */}
          {canManage && equipment.status === 'AVAILABLE' && onFastCheckout && (
            <button
              type="button"
              className="btn btn-primary btn-sm w-100"
              style={{ fontSize: '0.75rem', height: '30px' }}
              onClick={() => onFastCheckout(equipment)}
            >
              <i className="bi bi-box-arrow-right me-1"></i> Quick Handover
            </button>
          )}

          {canManage && equipment.status === 'BORROWED' && onFastCheckin && (
            <button
              type="button"
              className="btn btn-success text-white btn-sm w-100"
              style={{ fontSize: '0.75rem', height: '30px' }}
              onClick={() => onFastCheckin(equipment)}
            >
              <i className="bi bi-box-arrow-in-left me-1"></i> Quick Check-in
            </button>
          )}

          {onRequest && equipment.status === 'AVAILABLE' && (
            <button
              type="button"
              className="btn btn-primary btn-sm w-100"
              style={{ fontSize: '0.75rem', height: '30px' }}
              onClick={() => onRequest(equipment)}
            >
              <i className="bi bi-plus-circle me-1"></i> Request for Project
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EquipmentCard;
