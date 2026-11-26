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
      <div className="equipment-image-container">
        <img
          src={equipment.imageUrl || defaultImage}
          alt={equipment.name}
          referrerPolicy="no-referrer"
          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = defaultImage; }}
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

      {/* Card Body - Strictly Uniform Row Heights for Balanced Grid Alignment */}
      <div className="card-body p-3 d-flex flex-column justify-content-between">
        <div>
          {/* Row 1: Brand & Category + Stock Quantity Pill */}
          <div className="d-flex justify-content-between align-items-center mb-1" style={{ height: '22px' }}>
            <span
              className="text-muted text-uppercase fw-semibold text-truncate"
              style={{ fontSize: '0.68rem', letterSpacing: '0.05em', maxWidth: '62%' }}
              title={`${equipment.brand} • ${equipment.category?.name || 'Gear'}`}
            >
              {equipment.brand} • {equipment.category?.name || 'Gear'}
            </span>

            <span
              className={`badge ${
                isOutOfStock
                  ? 'bg-danger-subtle text-danger'
                  : avail <= 2
                  ? 'bg-warning-subtle text-warning-emphasis'
                  : 'bg-success-subtle text-success'
              } border flex-shrink-0`}
              style={{ fontSize: '0.68rem' }}
            >
              <i className="bi bi-stack me-1"></i>
              {avail}/{qty} Stock
            </span>
          </div>

          {/* Row 2: Equipment Name (Single-line locked height) */}
          <h6
            className="fw-bold text-dark text-truncate mb-1"
            title={equipment.name}
            style={{ fontSize: '0.92rem', lineHeight: '1.4', height: '22px', cursor: 'pointer' }}
            onClick={() => onView(equipment)}
          >
            {equipment.name}
          </h6>

          {/* Row 3: Serial Number & Condition */}
          <div className="d-flex justify-content-between align-items-center small text-muted mb-2" style={{ height: '22px' }}>
            <span className="font-monospace text-truncate" style={{ fontSize: '0.73rem', maxWidth: '65%' }} title={equipment.serialNumber}>
              SN: {equipment.serialNumber || '—'}
            </span>
            <span className="badge bg-light text-secondary border flex-shrink-0" style={{ fontSize: '0.65rem' }}>
              {equipment.condition || 'EXCELLENT'}
            </span>
          </div>

          {/* Row 4: Valuation & Daily Rate (Always balanced on both sides) */}
          <div className="d-flex justify-content-between align-items-center small border-top pt-2 mt-1" style={{ height: '28px' }}>
            <div className="text-muted text-truncate" style={{ fontSize: '0.72rem' }}>
              Value: <strong className="text-dark">{formatCurrency(equipment.purchasePrice || 0)}</strong>
            </div>
            <div className="fw-semibold text-primary flex-shrink-0" style={{ fontSize: '0.76rem' }}>
              {equipment.dailyRate ? (
                <>
                  {formatCurrency(equipment.dailyRate)}
                  <span className="text-muted fw-normal" style={{ fontSize: '0.68rem' }}>/day</span>
                </>
              ) : (
                <span className="text-muted fw-normal" style={{ fontSize: '0.7rem' }}>Studio Vault</span>
              )}
            </div>
          </div>
        </div>

        {/* Row 5: Action Buttons Toolbar (Fixed 2-Row Structure on Every Card) */}
        <div className="border-top pt-2 mt-2">
          {/* Sub-row A: Secondary / Utility Controls (32px height) */}
          <div className="d-flex align-items-center gap-1 mb-2" style={{ height: '32px' }}>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm flex-fill"
              style={{ fontSize: '0.75rem', height: '32px', minHeight: '32px', padding: '0 0.5rem' }}
              onClick={() => onView(equipment)}
            >
              <i className="bi bi-eye me-1"></i> Details
            </button>

            <button
              type="button"
              className="btn btn-light border btn-sm flex-shrink-0"
              style={{ width: '32px', height: '32px', minHeight: '32px', padding: 0 }}
              title="Asset QR & Barcode"
              onClick={() => onShowQR(equipment)}
            >
              <i className="bi bi-qr-code text-secondary" style={{ fontSize: '0.82rem' }}></i>
            </button>

            {canManage && !isArchived && (
              <>
                {onAdjustStock && (
                  <button
                    type="button"
                    className="btn btn-light border btn-sm text-primary flex-shrink-0"
                    style={{ width: '32px', height: '32px', minHeight: '32px', padding: 0 }}
                    title="Adjust Stock Quantity"
                    onClick={() => onAdjustStock(equipment)}
                  >
                    <i className="bi bi-plus-slash-minus" style={{ fontSize: '0.82rem' }}></i>
                  </button>
                )}

                <button
                  type="button"
                  className="btn btn-light border btn-sm text-secondary flex-shrink-0"
                  style={{ width: '32px', height: '32px', minHeight: '32px', padding: 0 }}
                  title="Edit Equipment"
                  onClick={() => onEdit(equipment)}
                >
                  <i className="bi bi-pencil" style={{ fontSize: '0.82rem' }}></i>
                </button>

                <button
                  type="button"
                  className="btn btn-light border btn-sm text-danger flex-shrink-0"
                  style={{ width: '32px', height: '32px', minHeight: '32px', padding: 0 }}
                  title="Archive Equipment"
                  onClick={() => onDelete(equipment.id)}
                >
                  <i className="bi bi-archive" style={{ fontSize: '0.82rem' }}></i>
                </button>
              </>
            )}
          </div>

          {/* Sub-row B: Primary Workflow Action Slot (Strictly 32px height on every card) */}
          <div style={{ height: '32px' }}>
            {isArchived ? (
              <button
                type="button"
                className="btn btn-outline-success btn-sm w-100"
                style={{ fontSize: '0.75rem', height: '32px', minHeight: '32px', padding: '0 0.5rem' }}
                onClick={() => onRestore && onRestore(equipment.id)}
              >
                <i className="bi bi-arrow-counterclockwise me-1"></i> Restore to Active Stock
              </button>
            ) : canManage ? (
              avail > 0 && equipment.status === 'BORROWED' && onFastCheckout && onFastCheckin ? (
                <div className="d-flex align-items-center gap-1" style={{ height: '32px' }}>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm flex-fill"
                    style={{ fontSize: '0.73rem', height: '32px', minHeight: '32px', padding: '0 0.4rem' }}
                    onClick={() => onFastCheckout(equipment)}
                  >
                    <i className="bi bi-box-arrow-right me-1"></i> Checkout
                  </button>
                  <button
                    type="button"
                    className="btn btn-success text-white btn-sm flex-fill"
                    style={{ fontSize: '0.73rem', height: '32px', minHeight: '32px', padding: '0 0.4rem' }}
                    onClick={() => onFastCheckin(equipment)}
                  >
                    <i className="bi bi-box-arrow-in-left me-1"></i> Check-in
                  </button>
                </div>
              ) : avail > 0 && onFastCheckout ? (
                <button
                  type="button"
                  className="btn btn-primary btn-sm w-100"
                  style={{ fontSize: '0.75rem', height: '32px', minHeight: '32px', padding: '0 0.5rem' }}
                  onClick={() => onFastCheckout(equipment)}
                >
                  <i className="bi bi-box-arrow-right me-1"></i> Fast Checkout
                </button>
              ) : equipment.status === 'BORROWED' && onFastCheckin ? (
                <button
                  type="button"
                  className="btn btn-success text-white btn-sm w-100"
                  style={{ fontSize: '0.75rem', height: '32px', minHeight: '32px', padding: '0 0.5rem' }}
                  onClick={() => onFastCheckin(equipment)}
                >
                  <i className="bi bi-box-arrow-in-left me-1"></i> Fast Check-in
                </button>
              ) : onAdjustStock ? (
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm w-100"
                  style={{ fontSize: '0.75rem', height: '32px', minHeight: '32px', padding: '0 0.5rem' }}
                  onClick={() => onAdjustStock(equipment)}
                >
                  <i className="bi bi-plus-circle me-1"></i> Restock / Adjust Units
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-light border text-muted btn-sm w-100"
                  style={{ fontSize: '0.74rem', height: '32px', minHeight: '32px', padding: '0 0.5rem' }}
                  disabled
                >
                  <i className="bi bi-slash-circle me-1"></i> Unavailable
                </button>
              )
            ) : avail > 0 && onRequest ? (
              <button
                type="button"
                className="btn btn-primary btn-sm w-100"
                style={{ fontSize: '0.75rem', height: '32px', minHeight: '32px', padding: '0 0.5rem' }}
                onClick={() => onRequest(equipment)}
              >
                <i className="bi bi-plus-circle me-1"></i> Request Equipment
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-light border text-muted btn-sm w-100"
                style={{ fontSize: '0.74rem', height: '32px', minHeight: '32px', padding: '0 0.5rem' }}
                disabled
              >
                <i className="bi bi-clock me-1"></i> Currently Unavailable
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EquipmentCard;
