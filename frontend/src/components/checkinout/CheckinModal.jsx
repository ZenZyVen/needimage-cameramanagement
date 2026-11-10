import React, { useState, useEffect } from 'react';

const CheckinModal = ({ show, onHide, request = null, equipment = null, onSubmit }) => {
  const [borrowerName, setBorrowerName] = useState('');
  const [staffSignature, setStaffSignature] = useState('');
  const [itemInspections, setItemInspections] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Collect items
  const items = request
    ? request.items?.filter(i => i.status === 'CHECKED_OUT').map(i => i.equipment) || []
    : equipment
    ? [equipment]
    : [];

  useEffect(() => {
    if (show) {
      setBorrowerName(request ? request.user?.name || '' : '');
      setStaffSignature('');
      setErrorMsg('');

      // Initialize default inspection per item
      const initialInspections = {};
      items.forEach(item => {
        initialInspections[item.id] = {
          condition: item.condition || 'GOOD',
          damageReported: false,
          damageNotes: '',
          hasMissingAccessories: false,
          missingAccessoriesText: '',
          notes: ''
        };
      });
      setItemInspections(initialInspections);
    }
  }, [show, request, equipment]);

  const updateItemField = (itemId, field, val) => {
    setItemInspections(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: val
      }
    }));
  };

  const handleCheckin = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      setErrorMsg('');

      const formattedItems = items.map(item => {
        const insp = itemInspections[item.id] || {};
        const missingList = insp.hasMissingAccessories && insp.missingAccessoriesText
          ? insp.missingAccessoriesText.split(',').map(s => s.trim()).filter(Boolean)
          : [];

        return {
          equipmentId: item.id,
          condition: insp.condition || 'GOOD',
          damageReported: Boolean(insp.damageReported),
          damageNotes: insp.damageNotes || null,
          missingAccessories: missingList,
          notes: insp.notes || null
        };
      });

      await onSubmit({
        requestId: request?.id || null,
        items: formattedItems,
        borrowerName: borrowerName.trim() || 'Returning Crew',
        staffSignature: staffSignature.trim() || null
      });

      onHide();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error processing check-in return.');
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
              <i className="bi bi-box-arrow-in-left me-2 text-success"></i>
              Equipment Return & Quality Inspection
            </h6>
            <button type="button" className="btn-close btn-close-white" onClick={onHide}></button>
          </div>

          <form onSubmit={handleCheckin}>
            <div className="modal-body p-4" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
              {errorMsg && (
                <div className="alert alert-danger py-2 small mb-3">
                  <i className="bi bi-exclamation-circle me-1"></i> {errorMsg}
                </div>
              )}

              {/* Items List for inspection */}
              <div className="mb-4">
                <span className="text-muted small text-uppercase fw-semibold d-block mb-2">
                  Items to Inspect & Return ({items.length} item{items.length > 1 ? 's' : ''})
                </span>

                {items.map(item => {
                  const insp = itemInspections[item.id] || {};
                  return (
                    <div key={item.id} className="p-3 border rounded bg-light mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <div>
                          <span className="badge bg-dark me-2">{item.assetTag}</span>
                          <strong className="text-dark">{item.name}</strong>
                          <span className="text-muted small ms-2">SN: {item.serialNumber}</span>
                        </div>
                      </div>

                      {/* Condition selection */}
                      <div className="row g-2 mb-2">
                        <div className="col-md-6">
                          <label className="form-label small text-secondary fw-semibold mb-1">
                            Returned Condition:
                          </label>
                          <select
                            className="form-select form-select-sm"
                            value={insp.condition || 'GOOD'}
                            onChange={(e) => updateItemField(item.id, 'condition', e.target.value)}
                          >
                            <option value="EXCELLENT">Excellent (Like New)</option>
                            <option value="GOOD">Good (Normal Wear)</option>
                            <option value="FAIR">Fair (Noticeable Scuffs)</option>
                            <option value="POOR">Poor (Requires Service)</option>
                            <option value="DAMAGED">Damaged / Broken</option>
                          </select>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label small text-secondary fw-semibold mb-1">
                            Check-in Notes:
                          </label>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="Cleaned, battery charged, etc."
                            value={insp.notes || ''}
                            onChange={(e) => updateItemField(item.id, 'notes', e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Missing Accessories Checkbox */}
                      <div className="mb-2">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`missing-${item.id}`}
                            checked={Boolean(insp.hasMissingAccessories)}
                            onChange={(e) => updateItemField(item.id, 'hasMissingAccessories', e.target.checked)}
                          />
                          <label className="form-check-label small fw-medium text-warning-emphasis" htmlFor={`missing-${item.id}`}>
                            Flag missing accessories or cables
                          </label>
                        </div>
                        {insp.hasMissingAccessories && (
                          <input
                            type="text"
                            className="form-control form-control-sm mt-1"
                            placeholder="Specify missing items (e.g. Lens cap, USB-C cable)"
                            value={insp.missingAccessoriesText || ''}
                            onChange={(e) => updateItemField(item.id, 'missingAccessoriesText', e.target.value)}
                          />
                        )}
                      </div>

                      {/* Damage Reported Checkbox */}
                      <div>
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`damage-${item.id}`}
                            checked={Boolean(insp.damageReported)}
                            onChange={(e) => updateItemField(item.id, 'damageReported', e.target.checked)}
                          />
                          <label className="form-check-label small fw-medium text-danger" htmlFor={`damage-${item.id}`}>
                            Report physical/optical damage (Auto-creates Maintenance Ticket)
                          </label>
                        </div>
                        {insp.damageReported && (
                          <textarea
                            className="form-control form-control-sm mt-1 border-danger"
                            rows="2"
                            placeholder="Describe damage details (e.g. Cracked front element, loose HDMI port)..."
                            value={insp.damageNotes || ''}
                            onChange={(e) => updateItemField(item.id, 'damageNotes', e.target.value)}
                            required
                          ></textarea>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Custodian & Inspector sign-off */}
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label small fw-semibold text-secondary">
                    Returning Custodian
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={borrowerName}
                    onChange={(e) => setBorrowerName(e.target.value)}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-semibold text-secondary">
                    Inspector Signature Acknowledgment
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Vault Controller Initials"
                    value={staffSignature}
                    onChange={(e) => setStaffSignature(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer bg-light py-2">
              <button type="button" className="btn btn-sm btn-secondary" onClick={onHide} disabled={submitting}>
                Cancel
              </button>
              <button type="submit" className="btn btn-sm btn-success text-white" disabled={submitting}>
                {submitting ? 'Inspecting & Returning...' : 'Complete Check-in Return'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CheckinModal;
