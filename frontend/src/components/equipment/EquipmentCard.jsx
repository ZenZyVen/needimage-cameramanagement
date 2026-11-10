import React from 'react';
import StatusBadge from '../common/StatusBadge';
import { formatCurrency } from '../../utils/formatters';

const EquipmentCard = ({
  equipment,
  onView,
  onShowQR,
  onEdit,
  onDelete,
  onRestore,
  onAdjustStock,
  canManage = false,
  onRequest = null,
  onFastCheckout = null,
  onFastCheckin = null
}) => {
  const defaultImage = 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&auto=format&fit=crop&q=80';
  const qty = equipment.quantity || 1;
  const avail = equipment.availableQuantity !== undefined ? equipment.availableQuantity : (equipment.status === 'AVAILABLE' ? qty : 0);
  const isOutOfStock = avail <= 0;
  const isArchived = Boolean(equipment.isDeleted);

  return (
    <div className={`card h-100 equipment-card border-0 shadow-sm ${isArchived ? 'opacity-75' : ''}`}>
      {/* Image & Header Overlay */}
      <div className="equipment-image-container position-relative overflow-hidden" style={{ height: '170px' }}>
        <img
          src={equipment.imageUrl || defaultImage}
          alt={equipment.name}
          className="w-100 h-100 object-fit-cover"
          onError={(e) => { e.target.src = defaultImage; }}
        />
        <div className="position-absolute top-0 start-0 m-2">
          <span className="badge bg-slate-900 text-white shadow-sm" style={{ fontSize: '0.72rem', letterSpacing: '0.04em' }}>
            {equipment.assetTag}
          </span>
        </div>
        <div className="position-absolute top-0 end-0 m-2">
          {isArchived ? (
            <span className="badge bg-danger shadow-sm">ARCHIVED</span>
          ) : (
            <StatusBadge status={equipment.status} />
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="card-body p-3 d-flex flex-column justify-content-between">
        <div>
          {/* Brand & Category */}
          <div className="d-flex justify-content-between align-items-center mb-1">
            <span className="text-muted text-uppercase fw-semibold text-truncate" style={{ fontSize: '0.68rem', letterSpacing: '0.05em', maxWidth: '65%' }}>
              {equipment.brand} • {equipment.category?.name || 'Gear'}
            </span>

            {/* Stock Quantity Badge */}
            <span className={`badge ${isOutOfStock ? 'bg-danger-subtle text-danger' : avail <= 2 ? 'bg-warning-subtle text-warning-emphasis' : 'bg-success-subtle text-success'} border`} style={{ fontSize: '0.7rem' }}>
              <i className="bi bi-stack me-1"></i>
              {avail}/{qty} Stock
            </span>
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

          {/* Serial Number & Condition */}
          <div className="d-flex justify-content-between align-items-center small text-muted mb-2">
            <span className="font-monospace text-truncate" style={{ fontSize: '0.74rem', maxWidth: '140px' }}>
              SN: {equipment.serialNumber}
            </span>
            <span className="badge bg-light text-secondary border" style={{ fontSize: '0.65rem' }}>
              {equipment.condition}
            </span>
          </div>

          {/* Pricing */}
          <div className="d-flex justify-content-between align-items-center small border-top pt-2 mt-1">
            <div className="text-muted" style={{ fontSize: '0.72rem' }}>
              Valuation: <strong className="text-dark">{formatCurrency(equipment.purchasePrice)}</strong>
            </div>
            {equipment.dailyRate && (
              <div className="fw-semibold text-primary" style={{ fontSize: '0.78rem' }}>
                {formatCurrency(equipment.dailyRate)}<span className="text-muted fw-normal" style={{ fontSize: '0.68rem' }}>/day</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="border-top pt-2 mt-2">
          {isArchived ? (
            <button
              type="button"
              className="btn btn-outline-success btn-sm w-100"
              style={{ fontSize: '0.75rem', height: '30px' }}
              onClick={() => onRestore && onRestore(equipment.id)}
            >
              <i className="bi bi-arrow-counterclockwise me-1"></i> Restore to Active Stock
            </button>
          ) : (
            <>
              <div className="d-flex align-items-center gap-1 mb-1">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm flex-fill"
                  style={{ fontSize: '0.75rem', height: '30px' }}
                  onClick={() => onView(equipment)}
                >
                  <i className="bi bi-eye me-1"></i> Details
                </button>

                <button
                  type="button"
                  className="btn btn-light border btn-sm"
                  style={{ width: '30px', height: '30px', padding: 0 }}
                  title="Asset QR & Barcode"
                  onClick={() => onShowQR(equipment)}
                >
                  <i className="bi bi-qr-code text-secondary" style={{ fontSize: '0.82rem' }}></i>
                </button>

                {canManage && (
                  <>
                    {onAdjustStock && (
                      <button
                        type="button"
                        className="btn btn-light border btn-sm text-primary"
                        style={{ width: '30px', height: '30px', padding: 0 }}
                        title="Adjust Stock Quantity"
                        onClick={() => onAdjustStock(equipment)}
                      >
                        <i className="bi bi-plus-slash-minus" style={{ fontSize: '0.82rem' }}></i>
                      </button>
                    )}

                    <button
                      type="button"
                      className="btn btn-light border btn-sm text-secondary"
                      style={{ width: '30px', height: '30px', padding: 0 }}
                      title="Edit Equipment"
                      onClick={() => onEdit(equipment)}
                    >
                      <i className="bi bi-pencil" style={{ fontSize: '0.82rem' }}></i>
                    </button>

                    <button
                      type="button"
                      className="btn btn-light border btn-sm text-danger"
                      style={{ width: '30px', height: '30px', padding: 0 }}
                      title="Archive Equipment"
                      onClick={() => onDelete(equipment.id)}
                    >
                      <i className="bi bi-archive" style={{ fontSize: '0.82rem' }}></i>
                    </button>
                  </>
                )}
              </div>

              {/* Fast Handover / Check-in / Request actions */}
              {canManage && avail > 0 && onFastCheckout && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm w-100"
                  style={{ fontSize: '0.74rem', height: '28px' }}
                  onClick={() => onFastCheckout(equipment)}
                >
                  <i className="bi bi-box-arrow-right me-1"></i> Fast Checkout
                </button>
              )}

              {canManage && equipment.status === 'BORROWED' && onFastCheckin && (
                <button
                  type="button"
                  className="btn btn-success text-white btn-sm w-100"
                  style={{ fontSize: '0.74rem', height: '28px' }}
                  onClick={() => onFastCheckin(equipment)}
                >
                  <i className="bi bi-box-arrow-in-left me-1"></i> Fast Check-in
                </button>
              )}

              {onRequest && avail > 0 && !canManage && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm w-100"
                  style={{ fontSize: '0.74rem', height: '28px' }}
                  onClick={() => onRequest(equipment)}
                >
                  <i className="bi bi-plus-circle me-1"></i> Request Equipment
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EquipmentCard;
