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
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow">
          <div className="modal-header bg-slate-900 text-white" style={{ backgroundColor: '#1e293b' }}>
            <h6 className="modal-title fw-bold text-white mb-0">
              <i className="bi bi-check-circle me-2 text-success"></i>
              Resolve Maintenance: {ticket.ticketNumber}
            </h6>
            <button type="button" className="btn-close btn-close-white" onClick={onHide}></button>
          </div>

          <form onSubmit={handleResolve}>
            <div className="modal-body p-4">
              {errorMsg && (
                <div className="alert alert-danger py-2 small mb-3">
                  <i className="bi bi-exclamation-circle me-1"></i> {errorMsg}
                </div>
              )}

              <div className="p-3 border rounded bg-light mb-3">
                <span className="small text-muted d-block">Equipment:</span>
                <strong className="text-dark">{ticket.equipment?.assetTag} - {ticket.equipment?.name}</strong>
                <div className="small text-muted mt-1">Issue: {ticket.issueTitle}</div>
              </div>

              <div className="row g-3 mb-3">
                <div className="col-6">
                  <label className="form-label small fw-semibold text-secondary">Final Status</label>
                  <select
                    className="form-select form-select-sm"
                    value={finalStatus}
                    onChange={(e) => setFinalStatus(e.target.value)}
                  >
                    <option value="RESOLVED">Resolved (Return to Available)</option>
                    <option value="WRITTEN_OFF">Written Off (Decommission/Retire)</option>
                  </select>
                </div>
                <div className="col-6">
                  <label className="form-label small fw-semibold text-secondary">Equipment Condition</label>
                  <select
                    className="form-select form-select-sm"
                    value={equipmentCondition}
                    onChange={(e) => setEquipmentCondition(e.target.value)}
                    disabled={finalStatus === 'WRITTEN_OFF'}
                  >
                    <option value="EXCELLENT">Excellent</option>
                    <option value="GOOD">Good</option>
                    <option value="FAIR">Fair</option>
                  </select>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label small fw-semibold text-secondary">Actual Repair Cost ($)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control form-control-sm"
                  placeholder="0.00"
                  defaultValue={ticket.cost || ''}
                  onChange={(e) => setFinalCost(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <label className="form-label small fw-semibold text-secondary">
                  Resolution & Technical Notes <span className="text-danger">*</span>
                </label>
                <textarea
                  className="form-control form-control-sm"
                  rows="3"
                  placeholder="e.g. Replaced SDI BNC port, recalibrated sensor, optical element polished and verified..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  required
                ></textarea>
              </div>
            </div>

            <div className="modal-footer bg-light py-2">
              <button type="button" className="btn btn-sm btn-secondary" onClick={onHide} disabled={submitting}>
                Cancel
              </button>
              <button type="submit" className="btn btn-sm btn-success text-white" disabled={submitting}>
                {submitting ? 'Resolving...' : 'Confirm Resolution'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceResolveModal;
