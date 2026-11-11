import React, { useState, useEffect } from 'react';

const CheckoutModal = ({ show, onHide, request = null, equipment = null, onSubmit }) => {
  const [borrowerName, setBorrowerName] = useState('');
  const [borrowerSignature, setBorrowerSignature] = useState('');
  const [verifiedAccessories, setVerifiedAccessories] = useState({});
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Collect items
  const items = request
    ? request.items?.map(i => i.equipment) || []
    : equipment
    ? [equipment]
    : [];

  useEffect(() => {
    if (show) {
      setBorrowerName(request ? request.user?.name || '' : '');
      setBorrowerSignature('');
      setNotes('');
      setErrorMsg('');

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
  }, [show, request, equipment]);

  const toggleAccessory = (key) => {
    setVerifiedAccessories(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!borrowerName.trim()) {
      setErrorMsg('Borrower name is required before equipment release.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');

      const itemIds = items.map(i => i.id);
      await onSubmit({
        requestId: request?.id || null,
        itemIds,
        borrowerName: borrowerName.trim(),
        borrowerSignature: borrowerSignature.trim() || null,
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

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)' }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content border-0 shadow">
          {/* Header */}
          <div className="modal-header bg-slate-900 text-white" style={{ backgroundColor: '#0f172a' }}>
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-box-arrow-right text-primary fs-5"></i>
              <h6 className="modal-title fw-bold text-white mb-0">
                Equipment Handover & Checkout
              </h6>
            </div>
            <button
              type="button"
              className="modal-close-btn"
              onClick={onHide}
              aria-label="Close"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          <form onSubmit={handleCheckout}>
            <div className="modal-body p-4" style={{ maxHeight: '74vh', overflowY: 'auto' }}>
              {errorMsg && (
                <div className="alert alert-danger py-2 small mb-3">
                  <i className="bi bi-exclamation-circle me-1"></i> {errorMsg}
                </div>
              )}

              {/* 1. Items & Accessories Inspection */}
              <div className="form-section-card">
                <div className="form-section-title">
                  <i className="bi bi-box-seam-fill text-primary"></i> 1. Items to Release ({items.length} item{items.length > 1 ? 's' : ''})
                </div>

                <div className="d-flex flex-column gap-2">
                  {items.map(item => (
                    <div key={item.id} className="p-3 border rounded bg-white shadow-sm">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <div className="d-flex align-items-center gap-2">
                          <span className="badge bg-slate-900 text-white fw-bold">{item.assetTag}</span>
                          <strong className="text-dark small">{item.name}</strong>
                          <span className="text-muted small">({item.brand})</span>
                        </div>
                        <span className="small text-muted">
                          <i className="bi bi-geo-alt me-1 text-primary"></i>{item.location || 'Vault Main'}
                        </span>
                      </div>

                      {/* Accessories checklist */}
                      {Array.isArray(item.accessories) && item.accessories.length > 0 && (
                        <div className="pt-2 border-top">
                          <span className="form-label" style={{ fontSize: '0.72rem' }}>
                            Verify Case Accessories Checklist:
                          </span>
                          <div className="d-flex flex-wrap gap-2 mt-1">
                            {item.accessories.map((acc, idx) => {
                              const key = `${item.id}-${acc}`;
                              const isChecked = Boolean(verifiedAccessories[key]);
                              return (
                                <div
                                  key={idx}
                                  onClick={() => toggleAccessory(key)}
                                  className={`p-2 border rounded d-flex align-items-center gap-2 accessory-badge-clickable ${
                                    isChecked
                                      ? 'bg-success-subtle text-success border-success-subtle'
                                      : 'bg-light text-muted border-secondary-subtle'
                                  }`}
                                  style={{ fontSize: '0.75rem', cursor: 'pointer' }}
                                >
                                  <i className={`bi ${isChecked ? 'bi-check-circle-fill text-success' : 'bi-circle text-muted'}`}></i>
                                  <span>{acc}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Borrower Details */}
              <div className="form-section-card mb-0">
                <div className="form-section-title">
                  <i className="bi bi-person-badge-fill text-primary"></i> 2. Custodian & Handover Sign-off
                </div>

                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">
                      Receiving Custodian / Borrower <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Borrower Full Name"
                      value={borrowerName}
                      onChange={(e) => setBorrowerName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      Borrower Digital Initial / Signature
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Borrower Signature"
                      value={borrowerSignature}
                      onChange={(e) => setBorrowerSignature(e.target.value)}
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label">Handover Vault Notes</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Handover notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-sm btn-secondary" onClick={onHide} disabled={submitting}>
                Cancel
              </button>
              <button type="submit" className="btn btn-sm btn-primary" disabled={submitting}>
                {submitting ? 'Releasing Gear...' : 'Confirm Handover & Release'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;
