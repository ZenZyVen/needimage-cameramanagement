import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const CONDITIONS = [
  { value: 'EXCELLENT', label: 'Excellent', desc: 'Pristine, like new', badgeClass: 'btn-outline-success', activeClass: 'btn-success text-white', icon: 'bi-check-circle-fill' },
  { value: 'GOOD', label: 'Good', desc: 'Normal studio wear', badgeClass: 'btn-outline-primary', activeClass: 'btn-primary text-white', icon: 'bi-hand-thumbs-up-fill' },
  { value: 'FAIR', label: 'Fair', desc: 'Noticeable scuffs', badgeClass: 'btn-outline-warning', activeClass: 'btn-warning text-dark', icon: 'bi-dash-circle-fill' },
  { value: 'POOR', label: 'Poor', desc: 'Service required', badgeClass: 'btn-outline-secondary', activeClass: 'btn-secondary text-white', icon: 'bi-tools' },
  { value: 'DAMAGED', label: 'Damaged', desc: 'Broken / defective', badgeClass: 'btn-outline-danger', activeClass: 'btn-danger text-white', icon: 'bi-exclamation-octagon-fill' }
];

const COMMON_ACCESSORIES = ['Lens Cap', 'Camera Battery', 'Dual Charger', 'HDMI Cable', 'SD/CF Card', 'Hard Case', 'Power Cord'];

const CheckinModal = ({ show, onHide, request = null, equipment = null, onSubmit }) => {
  const { user } = useAuth();
  const [borrowerName, setBorrowerName] = useState('');
  const [staffSignature, setStaffSignature] = useState('');
  const [selectedItemIds, setSelectedItemIds] = useState(new Set());
  const [itemInspections, setItemInspections] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Collect active items needing return
  const rawItems = request
    ? request.items?.filter(i => ['CHECKED_OUT', 'REQUESTED', 'PREPARED'].includes(i.status)).map(i => i.equipment).filter(Boolean) || []
    : equipment
    ? [equipment]
    : [];

  useEffect(() => {
    if (show) {
      setBorrowerName(request?.user?.name || request?.borrowerName || 'Returning Custodian');
      setStaffSignature(user?.name ? `${user.name} (Verified Vault Officer)` : 'Vault Inspector');
      setErrorMsg('');

      // Select all items by default
      const allIds = new Set(rawItems.map(i => i.id));
      setSelectedItemIds(allIds);

      // Initialize default inspection data per item
      const initialInspections = {};
      rawItems.forEach(item => {
        initialInspections[item.id] = {
          condition: item.condition || 'GOOD',
          damageReported: item.condition === 'DAMAGED',
          damageSeverity: 'MEDIUM',
          damageNotes: '',
          hasMissingAccessories: false,
          missingAccessoriesList: [],
          missingAccessoriesText: '',
          notes: ''
        };
      });
      setItemInspections(initialInspections);
    }
  }, [show, request, equipment, user]);

  const toggleItemSelection = (id) => {
    setSelectedItemIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size === 1) {
          setErrorMsg('At least one equipment item must be selected for return intake.');
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

  const selectAllItems = () => {
    setSelectedItemIds(new Set(rawItems.map(i => i.id)));
    setErrorMsg('');
  };

  const updateItemField = (itemId, field, val) => {
    setItemInspections(prev => {
      const itemCurrent = prev[itemId] || {};
      const updated = { ...itemCurrent, [field]: val };

      // If condition set to DAMAGED, automatically toggle damageReported
      if (field === 'condition') {
        if (val === 'DAMAGED') {
          updated.damageReported = true;
          if (!updated.damageNotes) updated.damageNotes = 'Defect discovered during technical return inspection.';
        } else if (val === 'POOR') {
          updated.damageReported = true;
          if (!updated.damageNotes) updated.damageNotes = 'Requires servicing and component inspection.';
        }
      }

      return {
        ...prev,
        [itemId]: updated
      };
    });
  };

  const addCommonAccessory = (itemId, accName) => {
    setItemInspections(prev => {
      const current = prev[itemId] || {};
      const currentText = current.missingAccessoriesText || '';
      const existing = currentText.split(',').map(s => s.trim()).filter(Boolean);
      if (!existing.includes(accName)) {
        const newText = existing.length > 0 ? `${currentText}, ${accName}` : accName;
        return {
          ...prev,
          [itemId]: {
            ...current,
            hasMissingAccessories: true,
            missingAccessoriesText: newText
          }
        };
      }
      return prev;
    });
  };

  const handleCheckin = async (e) => {
    e.preventDefault();

    if (selectedItemIds.size === 0) {
      setErrorMsg('Please select at least one item to return.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');

      const itemsToSubmit = rawItems
        .filter(item => selectedItemIds.has(item.id))
        .map(item => {
          const insp = itemInspections[item.id] || {};
          const missingList = insp.hasMissingAccessories && insp.missingAccessoriesText
            ? insp.missingAccessoriesText.split(',').map(s => s.trim()).filter(Boolean)
            : [];

          return {
            equipmentId: item.id,
            condition: insp.condition || 'GOOD',
            damageReported: Boolean(insp.damageReported),
            damageNotes: insp.damageNotes?.trim() || null,
            missingAccessories: missingList,
            notes: insp.notes?.trim() || null
          };
        });

      await onSubmit({
        requestId: request?.id || null,
        items: itemsToSubmit,
        borrowerName: borrowerName.trim() || 'Returning Crew',
        staffSignature: staffSignature.trim() || `${user?.name || 'Vault Officer'} (Certified)`
      });

      onHide();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error processing check-in return.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!show || rawItems.length === 0) return null;

  // KPI calculations for inspection summary
  const selectedCount = selectedItemIds.size;
  const isPartialReturn = selectedCount < rawItems.length;
  let damagedCount = 0;
  let missingPartsCount = 0;

  selectedItemIds.forEach(id => {
    const insp = itemInspections[id];
    if (insp?.damageReported || insp?.condition === 'DAMAGED' || insp?.condition === 'POOR') {
      damagedCount++;
    }
    if (insp?.hasMissingAccessories && insp?.missingAccessoriesText) {
      missingPartsCount++;
    }
  });

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)' }}>
      <div className="modal-dialog modal-dialog-centered modal-xl modal-dialog-scrollable">
        <div className="modal-content border-0 shadow-lg">
          {/* Header */}
          <div className="modal-header bg-slate-900 text-white" style={{ backgroundColor: '#0f172a' }}>
            <div className="d-flex align-items-center gap-2">
              <div
                className="p-2 rounded bg-success text-white d-flex align-items-center justify-content-center shadow-xs"
                style={{ width: 34, height: 34 }}
              >
                <i className="bi bi-box-arrow-in-left fs-5"></i>
              </div>
              <div>
                <h6 className="modal-title fw-bold text-white mb-0">
                  Equipment Return & Quality Inspection Suite
                </h6>
                <div className="text-slate-400 small" style={{ fontSize: '0.72rem' }}>
                  {request ? (
                    <>
                      Request <span className="font-monospace text-white fw-bold">{request.requestNumber}</span> • Project: <strong className="text-white">{request.project?.title || 'Standalone Shoot'}</strong> • Custodian: <strong className="text-white">{borrowerName}</strong>
                    </>
                  ) : (
                    'Direct single-item vault check-in intake'
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

          <form onSubmit={handleCheckin}>
            <div className="modal-body p-3 p-md-4" style={{ maxHeight: '74vh', overflowY: 'auto' }}>
              {errorMsg && (
                <div className="alert alert-danger py-2 px-3 small mb-3 d-flex align-items-center gap-2">
                  <i className="bi bi-exclamation-octagon-fill"></i>
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* LIVE INSPECTION METRICS BAR */}
              <div className="row g-2 mb-3">
                <div className="col-6 col-md-3">
                  <div className="card border-0 bg-light shadow-xs p-2.5 text-center">
                    <span className="text-muted small fw-semibold text-uppercase" style={{ fontSize: '0.65rem' }}>Items to Return</span>
                    <div className="fs-5 fw-bold text-dark mt-0.5">
                      {selectedCount} <span className="text-muted fs-6 fw-normal">/ {rawItems.length}</span>
                    </div>
                    {isPartialReturn ? (
                      <span className="badge bg-warning-subtle text-warning border border-warning-subtle" style={{ fontSize: '0.65rem' }}>
                        Partial Return
                      </span>
                    ) : (
                      <span className="badge bg-success-subtle text-success border border-success-subtle" style={{ fontSize: '0.65rem' }}>
                        Full Requisition
                      </span>
                    )}
                  </div>
                </div>

                <div className="col-6 col-md-3">
                  <div className="card border-0 bg-light shadow-xs p-2.5 text-center">
                    <span className="text-muted small fw-semibold text-uppercase" style={{ fontSize: '0.65rem' }}>Serviceable / Restock</span>
                    <div className="fs-5 fw-bold text-success mt-0.5">
                      {selectedCount - damagedCount}
                    </div>
                    <small className="text-secondary" style={{ fontSize: '0.68rem' }}>Ready for next shoot</small>
                  </div>
                </div>

                <div className="col-6 col-md-3">
                  <div className="card border-0 bg-light shadow-xs p-2.5 text-center">
                    <span className="text-muted small fw-semibold text-uppercase" style={{ fontSize: '0.65rem' }}>Damages Flagged</span>
                    <div className={`fs-5 fw-bold mt-0.5 ${damagedCount > 0 ? 'text-danger' : 'text-muted'}`}>
                      {damagedCount}
                    </div>
                    <small className={damagedCount > 0 ? 'text-danger' : 'text-secondary'} style={{ fontSize: '0.68rem' }}>
                      {damagedCount > 0 ? 'Auto-creates work orders' : 'None reported'}
                    </small>
                  </div>
                </div>

                <div className="col-6 col-md-3">
                  <div className="card border-0 bg-light shadow-xs p-2.5 text-center">
                    <span className="text-muted small fw-semibold text-uppercase" style={{ fontSize: '0.65rem' }}>Missing Parts</span>
                    <div className={`fs-5 fw-bold mt-0.5 ${missingPartsCount > 0 ? 'text-warning' : 'text-muted'}`}>
                      {missingPartsCount}
                    </div>
                    <small className={missingPartsCount > 0 ? 'text-warning' : 'text-secondary'} style={{ fontSize: '0.68rem' }}>
                      {missingPartsCount > 0 ? 'Logged to receipt' : '100% complete kit'}
                    </small>
                  </div>
                </div>
              </div>

              {/* SELECTION CONTROLS */}
              {rawItems.length > 1 && (
                <div className="d-flex justify-content-between align-items-center mb-3 p-2 bg-light rounded border">
                  <span className="small text-muted">
                    Select equipment items returning in this intake session:
                  </span>
                  <div className="btn-group btn-group-sm">
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm"
                      onClick={selectAllItems}
                      disabled={selectedItemIds.size === rawItems.length}
                    >
                      <i className="bi bi-check-all me-1"></i> Select All ({rawItems.length})
                    </button>
                  </div>
                </div>
              )}

              {/* SECTION 1: EQUIPMENT INSPECTION WORKBENCH */}
              <div className="d-flex flex-column gap-3 mb-4">
                {rawItems.map((item, idx) => {
                  const isSelected = selectedItemIds.has(item.id);
                  const insp = itemInspections[item.id] || {};

                  return (
                    <div
                      key={item.id}
                      className={`card border transition-all shadow-xs ${
                        !isSelected
                          ? 'opacity-50 bg-light border-dashed'
                          : insp.damageReported
                          ? 'border-danger-subtle bg-danger-subtle bg-opacity-10'
                          : 'border-light-subtle bg-white'
                      }`}
                    >
                      <div className="card-body p-3">
                        {/* Equipment Top Bar */}
                        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2 mb-3 pb-2 border-bottom">
                          <div className="d-flex align-items-center gap-2.5">
                            {/* Checkbox for inclusion */}
                            <div className="form-check m-0">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id={`select-item-${item.id}`}
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
                            {isSelected ? (
                              <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1" style={{ fontSize: '0.7rem' }}>
                                <i className="bi bi-box-arrow-in-left me-1"></i> Returning Now
                              </span>
                            ) : (
                              <span className="badge bg-secondary-subtle text-secondary border px-2 py-1" style={{ fontSize: '0.7rem' }}>
                                <i className="bi bi-clock me-1"></i> Remaining in Field
                              </span>
                            )}
                          </div>
                        </div>

                        {isSelected && (
                          <div className="d-flex flex-column gap-3">
                            {/* A. Physical Condition Assessment Segmented Bar */}
                            <div>
                              <label className="form-label small fw-semibold text-secondary mb-1.5 d-flex align-items-center justify-content-between">
                                <span>
                                  <i className="bi bi-shield-check text-primary me-1"></i> Inspected Physical Condition:
                                </span>
                                <span className="text-muted" style={{ fontSize: '0.7rem' }}>
                                  Current selection: <strong>{insp.condition || 'GOOD'}</strong>
                                </span>
                              </label>

                              <div className="btn-group btn-group-sm w-100 flex-wrap" role="group">
                                {CONDITIONS.map(cond => {
                                  const isCurrent = (insp.condition || 'GOOD') === cond.value;
                                  return (
                                    <button
                                      key={cond.value}
                                      type="button"
                                      className={`btn py-1.5 px-2 text-nowrap flex-fill ${
                                        isCurrent ? cond.activeClass : cond.badgeClass
                                      }`}
                                      style={{ fontSize: '0.74rem' }}
                                      onClick={() => updateItemField(item.id, 'condition', cond.value)}
                                    >
                                      <i className={`bi ${cond.icon} me-1`}></i>
                                      <span className="fw-semibold">{cond.label}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* B. Accessories & Damage Inspection Controls */}
                            <div className="row g-2">
                              {/* Missing Accessories Toggle & Quick Chips */}
                              <div className="col-md-6">
                                <div className="p-2.5 border rounded bg-light h-100">
                                  <div className="form-check form-switch mb-2">
                                    <input
                                      className="form-check-input"
                                      type="checkbox"
                                      role="switch"
                                      id={`missing-toggle-${item.id}`}
                                      checked={Boolean(insp.hasMissingAccessories)}
                                      onChange={(e) => updateItemField(item.id, 'hasMissingAccessories', e.target.checked)}
                                    />
                                    <label
                                      className="form-check-label small fw-semibold text-dark"
                                      htmlFor={`missing-toggle-${item.id}`}
                                    >
                                      <i className="bi bi-puzzle me-1 text-warning"></i> Flag Missing Accessories / Parts
                                    </label>
                                  </div>

                                  {insp.hasMissingAccessories && (
                                    <div className="mt-2">
                                      <div className="d-flex flex-wrap gap-1 mb-1.5">
                                        {COMMON_ACCESSORIES.map(acc => (
                                          <button
                                            key={acc}
                                            type="button"
                                            className="btn btn-outline-secondary btn-xs py-0 px-1.5 rounded-pill"
                                            style={{ fontSize: '0.65rem' }}
                                            onClick={() => addCommonAccessory(item.id, acc)}
                                          >
                                            + {acc}
                                          </button>
                                        ))}
                                      </div>
                                      <input
                                        type="text"
                                        className="form-control form-control-sm"
                                        placeholder="Type missing items separated by comma..."
                                        value={insp.missingAccessoriesText || ''}
                                        onChange={(e) => updateItemField(item.id, 'missingAccessoriesText', e.target.value)}
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Damage Inspection Toggle */}
                              <div className="col-md-6">
                                <div
                                  className={`p-2.5 border rounded h-100 ${
                                    insp.damageReported
                                      ? 'bg-danger-subtle border-danger'
                                      : 'bg-light'
                                  }`}
                                >
                                  <div className="form-check form-switch mb-1">
                                    <input
                                      className="form-check-input"
                                      type="checkbox"
                                      role="switch"
                                      id={`damage-toggle-${item.id}`}
                                      checked={Boolean(insp.damageReported)}
                                      onChange={(e) => updateItemField(item.id, 'damageReported', e.target.checked)}
                                    />
                                    <label
                                      className={`form-check-label small fw-semibold ${
                                        insp.damageReported ? 'text-danger' : 'text-dark'
                                      }`}
                                      htmlFor={`damage-toggle-${item.id}`}
                                    >
                                      <i className="bi bi-wrench me-1 text-danger"></i> Report Damage / Maintenance Work Order
                                    </label>
                                  </div>

                                  {insp.damageReported ? (
                                    <div className="mt-2">
                                      <div className="text-danger small mb-1" style={{ fontSize: '0.7rem' }}>
                                        <i className="bi bi-info-circle-fill me-1"></i>
                                        Automatically generates service work order & flags gear as UNDER_MAINTENANCE.
                                      </div>
                                      <textarea
                                        className="form-control form-control-sm border-danger"
                                        rows="2"
                                        placeholder="Describe mechanical / optical defect, cracked glass, erratic motor..."
                                        value={insp.damageNotes || ''}
                                        onChange={(e) => updateItemField(item.id, 'damageNotes', e.target.value)}
                                        required={insp.damageReported}
                                      ></textarea>
                                    </div>
                                  ) : (
                                    <div className="text-muted small mt-1" style={{ fontSize: '0.7rem' }}>
                                      No mechanical or optical defects reported.
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* C. Vault Shelf / General Notes */}
                            <div>
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                placeholder="Vault notes: clean-down status, shelf assignment, or technical comments (optional)..."
                                value={insp.notes || ''}
                                onChange={(e) => updateItemField(item.id, 'notes', e.target.value)}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* SECTION 2: TECHNICAL SIGN-OFF & CUSTODY */}
              <div className="card border-0 bg-light shadow-xs p-3">
                <div className="form-section-title mb-2 fw-bold text-dark small text-uppercase">
                  <i className="bi bi-person-check-fill text-success me-1"></i> Technical Return Sign-Off & Verification
                </div>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold text-secondary">Returning Custodian / Crew Name</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={borrowerName}
                      onChange={(e) => setBorrowerName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold text-secondary">
                      Vault Inspector Verification Stamp
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={staffSignature}
                      onChange={(e) => setStaffSignature(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer bg-light py-2 px-4 d-flex justify-content-between align-items-center">
              <div className="text-muted small" style={{ fontSize: '0.72rem' }}>
                <i className="bi bi-shield-check text-success me-1"></i>
                Inspecting <strong className="text-dark">{selectedCount}</strong> item(s).
                {damagedCount > 0 && (
                  <span className="text-danger fw-semibold ms-1">
                    ({damagedCount} will be sent to repair queue)
                  </span>
                )}
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
                  className="btn btn-sm btn-success text-white px-3 fw-semibold shadow-xs"
                  disabled={submitting || selectedCount === 0}
                >
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1"></span> Processing Return...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check2-circle me-1"></i> Complete Return & Inspect
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

export default CheckinModal;
