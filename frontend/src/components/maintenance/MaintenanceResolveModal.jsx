import React, { useState } from 'react';

const MaintenanceResolveModal = ({ show, onHide, ticket, onResolve }) => {
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [finalCost, setFinalCost] = useState('');
  const [finalStatus, setFinalStatus] = useState('RESOLVED'); // 'RESOLVED' or 'WRITTEN_OFF'
  const [equipmentCondition, setEquipmentCondition] = useState('GOOD');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!show || !ticket) return null;

  const handleResolve = async (e) => {
    e.preventDefault();
    if (!resolutionNotes.trim()) {
      setErrorMsg('Please enter resolution notes describing the repair completed.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');
      await onResolve(ticket.id, {
        resolutionNotes: resolutionNotes.trim(),
        cost: finalCost ? parseFloat(finalCost) : ticket.cost,
        finalStatus,
        equipmentCondition
      });
      onHide();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error resolving maintenance ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg">
          <div className="modal-header bg-slate-900 text-white" style={{ backgroundColor: '#0f172a' }}>
            <div className="d-flex align-items-center gap-2">
              <div className="p-2 rounded bg-success-subtle text-success d-flex align-items-center justify-content-center" style={{ width: 34, height: 34 }}>
                <i className="bi bi-check2-circle"></i>
              </div>
              <div>
                <h6 className="modal-title fw-bold text-white mb-0">Complete Maintenance Resolution</h6>
                <p className="text-secondary small mb-0" style={{ fontSize: '0.72rem' }}>Ticket #{ticket.ticketNumber} • Verify service and return to inventory</p>
              </div>
            </div>
            <button type="button" className="btn-close btn-close-white" onClick={onHide}></button>
          </div>

          <form onSubmit={handleResolve}>
            <div className="modal-body p-4">
              {errorMsg && (
                <div className="alert alert-danger py-2 px-3 small mb-3 d-flex align-items-center gap-2">
                  <i className="bi bi-exclamation-triangle-fill"></i>
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Equipment Summary Banner */}
              <div className="p-3 border rounded bg-light mb-3">
                <span className="small text-muted text-uppercase fw-semibold d-block" style={{ fontSize: '0.7rem' }}>Equipment Item</span>
                <strong className="text-dark fs-6">{ticket.equipment?.assetTag} - {ticket.equipment?.name}</strong>
                <div className="small text-danger mt-1">
                  <i className="bi bi-tools me-1"></i> Issue: {ticket.issueTitle}
                </div>
              </div>

              {/* Final Disposition & Rating */}
              <div className="row g-3 mb-3">
                <div className="col-6">
                  <label className="form-label">Final Status</label>
                  <select
                    className="form-select"
                    value={finalStatus}
                    onChange={(e) => setFinalStatus(e.target.value)}
                  >
                    <option value="RESOLVED">Resolved (Return to Vault)</option>
                    <option value="WRITTEN_OFF">Written Off (Decommission)</option>
                  </select>
                </div>
                <div className="col-6">
                  <label className="form-label">Equipment Condition</label>
                  <select
                    className="form-select"
                    value={equipmentCondition}
                    onChange={(e) => setEquipmentCondition(e.target.value)}
                    disabled={finalStatus === 'WRITTEN_OFF'}
                  >
                    <option value="EXCELLENT">Excellent (Like New)</option>
                    <option value="GOOD">Good (Certified Working)</option>
                    <option value="FAIR">Fair (Operational)</option>
                  </select>
                </div>
              </div>

              {/* Repair Cost */}
              <div className="mb-3">
                <label className="form-label">Final Invoiced Repair Cost ($ USD)</label>
                <div className="input-group">
                  <span className="input-group-text">$</span>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    placeholder="0.00"
                    defaultValue={ticket.cost || ''}
                    onChange={(e) => setFinalCost(e.target.value)}
                  />
                </div>
              </div>

              {/* Technical Notes */}
              <div className="mb-0">
                <label className="form-label">
                  Resolution & Technical Service Notes <span className="required-star">*</span>
                </label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Resolution and technical service notes"
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  required
                ></textarea>
              </div>
            </div>

            <div className="modal-footer bg-light py-3 d-flex justify-content-end gap-2">
              <button type="button" className="btn btn-outline-secondary" onClick={onHide} disabled={submitting}>
                Cancel
              </button>
              <button type="submit" className="btn btn-success text-white fw-semibold" disabled={submitting}>
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1"></span> Processing...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check2-circle me-1"></i> Confirm & Return to Vault
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceResolveModal;
