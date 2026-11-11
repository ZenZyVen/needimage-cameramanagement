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
          {/* Header */}
          <div className="modal-header bg-slate-900 text-white" style={{ backgroundColor: '#0f172a' }}>
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-box-arrow-in-left text-success fs-5"></i>
              <h6 className="modal-title fw-bold text-white mb-0">
                Equipment Return & Quality Inspection
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

          <form onSubmit={handleCheckin}>
            <div className="modal-body p-4" style={{ maxHeight: '74vh', overflowY: 'auto' }}>
              {errorMsg && (
                <div className="alert alert-danger py-2 small mb-3">
                  <i className="bi bi-exclamation-circle me-1"></i> {errorMsg}
                </div>
              )}

              {/* 1. Items to inspect */}
              <div className="form-section-card">
                <div className="form-section-title">
                  <i className="bi bi-shield-check text-success"></i> 1. Inspected Equipment ({items.length} item{items.length > 1 ? 's' : ''})
                </div>

                <div className="d-flex flex-column gap-3">
                  {items.map(item => {
                    const insp = itemInspections[item.id] || {};
                    return (
                      <div key={item.id} className="p-3 border rounded bg-white shadow-sm">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <div className="d-flex align-items-center gap-2">
                            <span className="badge bg-slate-900 text-white fw-bold">{item.assetTag}</span>
                            <strong className="text-dark small">{item.name}</strong>
                            <span className="text-muted small">SN: {item.serialNumber}</span>
                          </div>
                        </div>

                        {/* Condition & Notes row */}
                        <div className="row g-2 mb-2">
                          <div className="col-md-6">
                            <label className="form-label" style={{ fontSize: '0.72rem' }}>
                              Inspected Physical Condition
                            </label>
                            <select
                              className="form-select form-select-sm"
                              value={insp.condition || 'GOOD'}
                              onChange={(e) => updateItemField(item.id, 'condition', e.target.value)}
                            >
                              <option value="EXCELLENT">Excellent (Like New, Pristine)</option>
                              <option value="GOOD">Good (Normal Studio Wear)</option>
                              <option value="FAIR">Fair (Noticeable Scuffs)</option>
                              <option value="POOR">Poor (Requires Service)</option>
                              <option value="DAMAGED">Damaged / Defective</option>
                            </select>
                          </div>

                          <div className="col-md-6">
                            <label className="form-label" style={{ fontSize: '0.72rem' }}>
                              Vault Check-in Notes
                            </label>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="Inspection notes"
                              value={insp.notes || ''}
                              onChange={(e) => updateItemField(item.id, 'notes', e.target.value)}
                            />
                          </div>
                        </div>

                        {/* Missing accessories checkbox */}
                        <div className="p-2 border rounded bg-light mb-2">
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id={`missing-${item.id}`}
                              checked={Boolean(insp.hasMissingAccessories)}
                              onChange={(e) => updateItemField(item.id, 'hasMissingAccessories', e.target.checked)}
                            />
                            <label className="form-check-label small fw-semibold text-warning-emphasis" htmlFor={`missing-${item.id}`}>
                              Flag Missing Accessories or Cables
                            </label>
                          </div>
                          {insp.hasMissingAccessories && (
                            <input
                              type="text"
                              className="form-control form-control-sm mt-2"
                              placeholder="List missing parts separated by comma"
                              value={insp.missingAccessoriesText || ''}
                              onChange={(e) => updateItemField(item.id, 'missingAccessoriesText', e.target.value)}
                            />
                          )}
                        </div>

                        {/* Damage report toggle */}
                        <div className={`p-2 border rounded ${insp.damageReported ? 'bg-danger-subtle border-danger-subtle' : 'bg-light'}`}>
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id={`damage-${item.id}`}
                              checked={Boolean(insp.damageReported)}
                              onChange={(e) => updateItemField(item.id, 'damageReported', e.target.checked)}
                            />
                            <label className="form-check-label small fw-semibold text-danger" htmlFor={`damage-${item.id}`}>
                              Report Physical / Optical Damage (Auto-creates Maintenance Ticket)
                            </label>
                          </div>
                          {insp.damageReported && (
                            <textarea
                              className="form-control form-control-sm mt-2 border-danger"
                              rows="2"
                              placeholder="Damage description and symptoms"
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
              </div>

              {/* 2. Inspector Sign-off */}
              <div className="form-section-card mb-0">
                <div className="form-section-title">
                  <i className="bi bi-person-check-fill text-success"></i> 2. Technical Inspection Sign-Off
                </div>

                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Returning Custodian Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={borrowerName}
                      onChange={(e) => setBorrowerName(e.target.value)}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Vault Inspector Signature / Initials</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Inspector Signature"
                      value={staffSignature}
                      onChange={(e) => setStaffSignature(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
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
