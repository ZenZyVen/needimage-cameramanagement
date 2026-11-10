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
      setErrorMsg('Borrower name is required.');
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
          <div className="modal-header bg-slate-900 text-white" style={{ backgroundColor: '#1e293b' }}>
            <h6 className="modal-title fw-bold text-white mb-0">
              <i className="bi bi-box-arrow-right me-2 text-primary"></i>
              Equipment Handover & Checkout
            </h6>
            <button type="button" className="btn-close btn-close-white" onClick={onHide}></button>
          </div>

          <form onSubmit={handleCheckout}>
            <div className="modal-body p-4" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
              {errorMsg && (
                <div className="alert alert-danger py-2 small mb-3">
                  <i className="bi bi-exclamation-circle me-1"></i> {errorMsg}
                </div>
              )}

              {/* Items List to release */}
              <div className="mb-4">
                <span className="text-muted small text-uppercase fw-semibold d-block mb-2">
                  Equipment To Release ({items.length} item{items.length > 1 ? 's' : ''})
                </span>
                <div className="border rounded p-2 bg-light">
                  {items.map(item => (
                    <div key={item.id} className="p-2 border-bottom bg-white rounded mb-2">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <div>
                          <span className="badge bg-dark me-2">{item.assetTag}</span>
                          <strong className="text-dark small">{item.name}</strong>
                          <span className="text-muted small ms-2">SN: {item.serialNumber}</span>
                        </div>
                        <span className="badge bg-secondary-subtle text-secondary small">
                          {item.location || 'Vault'}
                        </span>
                      </div>

                      {/* Accessories checklist for this item */}
                      {Array.isArray(item.accessories) && item.accessories.length > 0 && (
                        <div className="mt-2 pt-2 border-top">
                          <span className="text-muted small d-block mb-1 fw-medium" style={{ fontSize: '0.72rem' }}>
                            Verify Components & Accessories in Case:
                          </span>
                          <div className="d-flex flex-wrap gap-2">
                            {item.accessories.map((acc, idx) => {
                              const key = `${item.id}-${acc}`;
                              const checked = Boolean(verifiedAccessories[key]);
                              return (
                                <label
                                  key={idx}
                                  className={`small px-2 py-1 border rounded d-flex align-items-center gap-1 ${
                                    checked ? 'bg-success-subtle text-success border-success-subtle' : 'bg-light text-muted'
                                  }`}
                                  style={{ cursor: 'pointer', fontSize: '0.74rem' }}
                                >
                                  <input
                                    type="checkbox"
                                    className="form-check-input mt-0"
                                    checked={checked}
                                    onChange={() => toggleAccessory(key)}
                                  />
                                  {acc}
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Borrower & Handover Details */}
              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label small fw-semibold text-secondary">
                    Receiving Custodian / Borrower <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Full name of crew member picking up gear"
                    value={borrowerName}
                    onChange={(e) => setBorrowerName(e.target.value)}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-semibold text-secondary">
                    Digital Signature / Initial Acknowledgment
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. David Kim (Confirmed Oct 2026)"
                    value={borrowerSignature}
                    onChange={(e) => setBorrowerSignature(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="form-label small fw-semibold text-secondary">Handover Notes</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Pelican case 1510 with padlock, 2 spare batteries fully charged"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer bg-light py-2">
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
