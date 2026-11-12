import React, { useState, useEffect } from 'react';

const CheckoutModal = ({ show, onHide, request = null, equipment = null, initialItem = null, onSubmit }) => {
  const [borrowerName, setBorrowerName] = useState('');
  const [borrowerSignature, setBorrowerSignature] = useState('');
  const [verifiedAccessories, setVerifiedAccessories] = useState({});
  const [selectedItemIds, setSelectedItemIds] = useState(new Set());
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const targetEquipment = equipment || initialItem;

  // Collect items
  const items = request
    ? request.items?.filter(i => ['REQUESTED', 'PREPARED', 'APPROVED'].includes(i.status) || !i.status).map(i => i.equipment).filter(Boolean) || []
    : targetEquipment
    ? [targetEquipment]
    : [];

  useEffect(() => {
    if (show) {
      setBorrowerName(request?.user?.name || request?.borrowerName || '');
      setBorrowerSignature('');
      setNotes('');
      setErrorMsg('');

      // Default select all items
      const allIds = new Set(items.map(i => i.id));
      setSelectedItemIds(allIds);

      // Pre-check all accessories
      const initAcc = {};
      items.forEach(item => {
        if (Array.isArray(item.accessories)) {
          item.accessories.forEach(acc => {
            initAcc[`${item.id}-${acc}`] = true;
          });
        }
      });
      setVerifiedAccessories(initAcc);
    }
  }, [show, request, equipment, initialItem]);

  const toggleItemSelection = (id) => {
    setSelectedItemIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size === 1) {
          setErrorMsg('At least one equipment item must be checked out.');
          return prev;
        }
        next.delete(id);
      } else {
        next.add(id);
      }
      setErrorMsg('');
      return next;
    });
  };

  const toggleAccessory = (key) => {
    setVerifiedAccessories(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const verifyAllAccessories = () => {
    const allChecked = {};
    items.forEach(item => {
      if (Array.isArray(item.accessories)) {
        item.accessories.forEach(acc => {
          allChecked[`${item.id}-${acc}`] = true;
        });
      }
    });
    setVerifiedAccessories(allChecked);
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!borrowerName.trim()) {
      setErrorMsg('Custodian / Borrower name is required before equipment release.');
      return;
    }

    if (selectedItemIds.size === 0) {
      setErrorMsg('Please select at least one item to release.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');

      const itemIds = Array.from(selectedItemIds);
      const verifiedList = Object.entries(verifiedAccessories)
        .filter(([key, checked]) => checked && itemIds.some(id => key.startsWith(`${id}-`)))
        .map(([key]) => key.split('-').slice(1).join('-'));

      await onSubmit({
        requestId: request?.id || null,
        itemIds,
        borrowerName: borrowerName.trim(),
        borrowerSignature: borrowerSignature.trim() || null,
        accessoriesChecked: verifiedList.length > 0 ? verifiedList : undefined,
        notes: notes.trim() || null
      });

      onHide();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error processing checkout handover.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!show || items.length === 0) return null;

  const selectedCount = selectedItemIds.size;

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)' }}>
      <div className="modal-dialog modal-dialog-centered modal-xl modal-dialog-scrollable">
        <div className="modal-content border-0 shadow-lg">
          {/* Header */}
          <div className="modal-header bg-slate-900 text-white" style={{ backgroundColor: '#0f172a' }}>
            <div className="d-flex align-items-center gap-2">
              <div
                className="p-2 rounded bg-warning text-dark d-flex align-items-center justify-content-center shadow-xs"
                style={{ width: 34, height: 34 }}
              >
                <i className="bi bi-box-arrow-up-right fs-5"></i>
              </div>
              <div>
                <h6 className="modal-title fw-bold text-white mb-0">
                  Equipment Handover & Custody Release
                </h6>
                <div className="text-slate-400 small" style={{ fontSize: '0.72rem' }}>
                  {request ? (
                    <>
                      Request <span className="font-monospace text-white fw-bold">{request.requestNumber}</span> • Project: <strong className="text-white">{request.project?.title || 'Standalone Shoot'}</strong> • Receiving Crew: <strong className="text-white">{borrowerName || 'Custodian'}</strong>
                    </>
                  ) : (
                    'Direct single-item vault handover dispatch'
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              className="modal-close-btn"
              onClick={onHide}
              aria-label="Close"
              title="Close modal"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          <form onSubmit={handleCheckout}>
            <div className="modal-body p-3 p-md-4" style={{ maxHeight: '74vh', overflowY: 'auto' }}>
              {errorMsg && (
                <div className="alert alert-danger py-2 px-3 small mb-3 d-flex align-items-center gap-2">
                  <i className="bi bi-exclamation-octagon-fill"></i>
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* HANDOVER SUMMARY BAR */}
              <div className="row g-2 mb-3">
                <div className="col-6 col-md-4">
                  <div className="card border-0 bg-light shadow-xs p-2.5 text-center">
                    <span className="text-muted small fw-semibold text-uppercase" style={{ fontSize: '0.65rem' }}>Items to Release</span>
                    <div className="fs-5 fw-bold text-dark mt-0.5">
                      {selectedCount} <span className="text-muted fs-6 fw-normal">/ {items.length}</span>
                    </div>
                    <small className="text-secondary" style={{ fontSize: '0.68rem' }}>Equipment pieces checked</small>
                  </div>
                </div>

                <div className="col-6 col-md-4">
                  <div className="card border-0 bg-light shadow-xs p-2.5 text-center">
                    <span className="text-muted small fw-semibold text-uppercase" style={{ fontSize: '0.65rem' }}>Receiving Custodian</span>
                    <div className="fs-6 fw-bold text-primary mt-1 text-truncate">
                      {borrowerName || 'Unassigned'}
                    </div>
                    <small className="text-secondary" style={{ fontSize: '0.68rem' }}>Production Crew Lead</small>
                  </div>
                </div>

                <div className="col-12 col-md-4">
                  <div className="card border-0 bg-light shadow-xs p-2.5 text-center">
                    <span className="text-muted small fw-semibold text-uppercase" style={{ fontSize: '0.65rem' }}>Accessory Verification</span>
                    <div className="fs-6 fw-bold text-success mt-1">
                      <i className="bi bi-shield-check me-1"></i> Pre-Release Checklist
                    </div>
                    <button
                      type="button"
                      className="btn btn-link btn-xs p-0 text-primary text-decoration-none"
                      onClick={verifyAllAccessories}
                    >
                      Check All Accessories
                    </button>
                  </div>
                </div>
              </div>

              {/* 1. ITEMS TO RELEASE */}
              <div className="d-flex flex-column gap-3 mb-4">
                {items.map((item) => {
                  const isSelected = selectedItemIds.has(item.id);
                  const accessories = Array.isArray(item.accessories) ? item.accessories : [];

                  return (
                    <div
                      key={item.id}
                      className={`card border transition-all shadow-xs ${
                        isSelected ? 'border-light-subtle bg-white' : 'opacity-50 bg-light border-dashed'
                      }`}
                    >
                      <div className="card-body p-3">
                        {/* Equipment Top Bar */}
                        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2 mb-2 pb-2 border-bottom">
                          <div className="d-flex align-items-center gap-2.5">
                            {/* Selection Checkbox */}
                            <div className="form-check m-0">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id={`co-item-${item.id}`}
                                checked={isSelected}
                                onChange={() => toggleItemSelection(item.id)}
                                style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer' }}
                              />
                            </div>

                            {/* Image Thumbnail */}
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="rounded border flex-shrink-0"
                                style={{ width: 44, height: 44, objectFit: 'cover' }}
                              />
                            ) : (
                              <div
                                className="rounded bg-light border d-flex align-items-center justify-content-center text-muted flex-shrink-0"
                                style={{ width: 44, height: 44 }}
                              >
                                <i className="bi bi-camera fs-5"></i>
                              </div>
                            )}

                            <div>
                              <div className="d-flex align-items-center gap-1.5 mb-0.5">
                                <span className="badge bg-slate-900 text-white font-monospace" style={{ fontSize: '0.72rem' }}>
                                  {item.assetTag}
                                </span>
                                {item.brand && (
                                  <span className="badge bg-light text-secondary border" style={{ fontSize: '0.68rem' }}>
                                    {item.brand}
                                  </span>
                                )}
                                <span className="badge bg-primary-subtle text-primary border border-primary-subtle" style={{ fontSize: '0.68rem' }}>
                                  {item.category?.name || 'Equipment'}
                                </span>
                              </div>
                              <h6 className="fw-bold text-dark mb-0 small">{item.name}</h6>
                              <div className="text-muted font-monospace" style={{ fontSize: '0.7rem' }}>
                                Model: {item.model || 'Standard'} • S/N: {item.serialNumber || 'N/A'}
                              </div>
                            </div>
                          </div>

                          <div className="d-flex align-items-center gap-2">
                            <span className="badge bg-light text-secondary border" style={{ fontSize: '0.7rem' }}>
                              <i className="bi bi-geo-alt me-1 text-primary"></i>{item.location || 'Vault Staging Shelf'}
                            </span>
                          </div>
                        </div>

                        {/* Accessories Checklist */}
                        {isSelected && accessories.length > 0 && (
                          <div className="pt-1">
                            <label className="form-label small fw-semibold text-secondary mb-1.5" style={{ fontSize: '0.72rem' }}>
                              <i className="bi bi-check2-all text-primary me-1"></i> Verify Case Accessories Checklist:
                            </label>
                            <div className="d-flex flex-wrap gap-1.5">
                              {accessories.map((acc, idx) => {
                                const key = `${item.id}-${acc}`;
                                const isChecked = Boolean(verifiedAccessories[key]);
                                return (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => toggleAccessory(key)}
                                    className={`btn btn-xs d-flex align-items-center gap-1.5 transition-all ${
                                      isChecked
                                        ? 'btn-success-subtle text-success border border-success-subtle fw-semibold'
                                        : 'btn-outline-secondary text-muted'
                                    }`}
                                    style={{ fontSize: '0.74rem' }}
                                  >
                                    <i className={`bi ${isChecked ? 'bi-check-circle-fill text-success' : 'bi-circle text-muted'}`}></i>
                                    <span>{acc}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 2. CUSTODIAN & HANDOVER DETAILS */}
              <div className="card border-0 bg-light shadow-xs p-3">
                <div className="form-section-title mb-2 fw-bold text-dark small text-uppercase">
                  <i className="bi bi-person-badge-fill text-primary me-1"></i> Handover Custody & Borrower Details
                </div>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold text-secondary">
                      Receiving Custodian / Borrower <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Borrower full name"
                      value={borrowerName}
                      onChange={(e) => setBorrowerName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-semibold text-secondary">
                      Borrower Digital Initial / Signature Acknowledgment
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Digital initial or signature"
                      value={borrowerSignature}
                      onChange={(e) => setBorrowerSignature(e.target.value)}
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label small fw-semibold text-secondary">
                      Handover Dispatch Notes
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Dispatch notes (optional)"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer bg-light py-2 px-4 d-flex justify-content-between align-items-center">
              <div className="text-muted small" style={{ fontSize: '0.72rem' }}>
                <i className="bi bi-box-arrow-up-right text-primary me-1"></i>
                Releasing <strong className="text-dark">{selectedCount}</strong> item(s) to <strong className="text-dark">{borrowerName || 'Custodian'}</strong>.
              </div>

              <div className="d-flex align-items-center gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary px-3"
                  onClick={onHide}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-sm btn-primary px-3 fw-semibold shadow-xs"
                  disabled={submitting || selectedCount === 0}
                >
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1"></span> Releasing Gear...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-box-arrow-up-right me-1"></i> Confirm Handover & Release
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;
