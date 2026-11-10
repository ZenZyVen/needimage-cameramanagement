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
  onRequest = null
}) => {
  const defaultImage = 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&auto=format&fit=crop&q=80';

  return (
    <div className="card h-100 equipment-card">
      {/* Image & Status Badge Header */}
      <div className="position-relative overflow-hidden" style={{ height: '170px', backgroundColor: '#f1f5f9' }}>
        <img
          src={equipment.imageUrl || defaultImage}
          alt={equipment.name}
          className="w-100 h-100 object-fit-cover"
          onError={(e) => {
            e.target.src = defaultImage;
          }}
        />
        <div className="position-absolute top-0 start-0 m-2">
          <span className="badge bg-dark bg-opacity-75 text-white" style={{ fontSize: '0.72rem' }}>
            {equipment.assetTag}
          </span>
        </div>
        <div className="position-absolute top-0 end-0 m-2">
          <StatusBadge status={equipment.status} />
        </div>
      </div>

      {/* Card Content */}
      <div className="card-body p-3 d-flex flex-direction-column justify-content-between">
        <div>
          <span className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.68rem', letterSpacing: '0.04em' }}>
            {equipment.brand} • {equipment.category?.name || 'Equipment'}
          </span>
          <h6
            className="fw-bold text-dark text-truncate mt-1 mb-1"
            title={equipment.name}
            style={{ fontSize: '0.92rem', cursor: 'pointer' }}
            onClick={() => onView(equipment)}
          >
            {equipment.name}
          </h6>
          <p className="small text-muted mb-2 text-truncate" style={{ fontSize: '0.78rem' }}>
            SN: <span className="text-secondary fw-medium">{equipment.serialNumber}</span>
          </p>

          {/* Quick info row */}
          <div className="d-flex justify-content-between align-items-center small text-muted border-top pt-2 mt-2">
            <div>
              <i className="bi bi-geo-alt me-1"></i>
              <span style={{ fontSize: '0.75rem' }}>{equipment.location || 'Vault'}</span>
            </div>
            {equipment.dailyRate && (
              <div className="fw-semibold text-dark" style={{ fontSize: '0.8rem' }}>
                {formatCurrency(equipment.dailyRate)} <span className="text-muted fw-normal" style={{ fontSize: '0.7rem' }}>/day</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="d-flex align-items-center gap-1 border-top pt-2 mt-3">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm flex-fill"
            style={{ fontSize: '0.75rem' }}
            onClick={() => onView(equipment)}
          >
            Details
          </button>

          <button
            type="button"
            className="btn btn-light border btn-sm"
            style={{ width: '32px', height: '32px', padding: 0 }}
            title="View QR Tag"
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

          {onRequest && equipment.status === 'AVAILABLE' && (
            <button
              type="button"
              className="btn btn-primary btn-sm flex-fill"
              style={{ fontSize: '0.75rem' }}
              onClick={() => onRequest(equipment)}
            >
              Request
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EquipmentCard;
