import React, { useState } from 'react';
import { formatDate } from '../../utils/formatters';

const RequestReviewModal = ({ show, onHide, request, onApprove, onReject }) => {
  const [reviewAction, setReviewAction] = useState('APPROVE'); // 'APPROVE' or 'REJECT'
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!show || !request) return null;

  const handleAction = async () => {
    try {
      setSubmitting(true);
      setErrorMsg('');
      if (reviewAction === 'APPROVE') {
        await onApprove(request.id, { notes: approvalNotes });
      } else {
        if (!rejectionReason.trim()) {
          setErrorMsg('Rejection reason is required.');
          setSubmitting(false);
          return;
        }
        await onReject(request.id, { rejectionReason });
      }
      onHide();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error processing request review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)' }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content border-0 shadow-lg">
          <div className="modal-header bg-slate-900 text-white" style={{ backgroundColor: '#0f172a' }}>
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-primary px-2.5 py-1.5 fs-6 fw-bold">{request.requestNumber}</span>
              <h6 className="modal-title fw-bold text-white mb-0">Requisition Approval & Review</h6>
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

          <div className="modal-body p-4" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
            {errorMsg && (
              <div className="alert alert-danger py-2 px-3 small mb-3 d-flex align-items-center gap-2">
                <i className="bi bi-exclamation-triangle-fill"></i>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Requester & Project Info Cards */}
            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <div className="form-section-card mb-0 h-100">
                  <div className="form-section-title">
                    <i className="bi bi-person-badge text-primary"></i> Requester Information
                  </div>
                  <div className="fw-bold text-dark fs-6">{request.user?.name}</div>
                  <div className="small text-muted">{request.user?.department || 'Production Team'} • {request.user?.email}</div>
                  <div className="small text-secondary mt-1">
                    <i className="bi bi-telephone me-1"></i> {request.user?.phone || 'No phone recorded'}
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-section-card mb-0 h-100">
                  <div className="form-section-title">
                    <i className="bi bi-film text-primary"></i> Project & Timeline
                  </div>
                  <div className="fw-bold text-dark fs-6">{request.project?.title || 'Standalone Shoot'}</div>
                  <div className="small text-muted">
                    Shoot Dates: <strong className="text-dark">{formatDate(request.startDate)}</strong> → <strong className="text-dark">{formatDate(request.endDate)}</strong>
                  </div>
                  <div className="small text-secondary mt-1">
                    <i className="bi bi-geo-alt me-1"></i> {request.destination || 'Studio / Location Unspecified'}
                  </div>
                </div>
              </div>
            </div>

            {/* Purpose */}
            <div className="form-section-card mb-3">
              <div className="form-section-title">
                <i className="bi bi-info-circle text-primary"></i> Purpose of Loan
              </div>
              <div className="p-2.5 bg-white border rounded text-dark small">
                {request.purpose}
              </div>
            </div>

            {/* Requested Gear Table */}
            <div className="form-section-card mb-3">
              <div className="form-section-title">
                <i className="bi bi-camera text-primary"></i> Requested Equipment Manifest ({request.items?.length || 0} Units)
              </div>
              <div className="table-responsive border rounded bg-white">
                <table className="table table-sm table-custom mb-0">
                  <thead>
                    <tr>
                      <th>Asset Tag</th>
                      <th>Equipment Description</th>
                      <th>Serial Number</th>
                      <th>Vault Status</th>
                      <th>Storage Bin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {request.items?.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <span className="badge bg-dark px-2 py-1" style={{ fontSize: '0.72rem' }}>
                            {item.equipment?.assetTag}
                          </span>
                        </td>
                        <td className="fw-semibold text-dark">{item.equipment?.name}</td>
                        <td className="text-secondary small font-monospace">{item.equipment?.serialNumber}</td>
                        <td>
                          <span className={`badge ${item.equipment?.status === 'AVAILABLE' ? 'badge-status-available' : 'badge-status-borrowed'}`}>
                            {item.equipment?.status}
                          </span>
                        </td>
                        <td className="small text-muted">{item.equipment?.location || 'Vault Main'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Decision Toggle */}
            <div className="form-section-card mb-0">
              <div className="form-section-title">
                <i className="bi bi-shield-check text-primary"></i> Vault Review Decision
              </div>
              <div className="d-flex gap-4 mb-3">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    id="decisionApprove"
                    name="decision"
                    checked={reviewAction === 'APPROVE'}
                    onChange={() => setReviewAction('APPROVE')}
                  />
                  <label className="form-check-label fw-bold text-success" htmlFor="decisionApprove" style={{ cursor: 'pointer' }}>
                    <i className="bi bi-check-circle-fill me-1"></i> Approve Requisition (Ready for Handover)
                  </label>
                </div>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    id="decisionReject"
                    name="decision"
                    checked={reviewAction === 'REJECT'}
                    onChange={() => setReviewAction('REJECT')}
                  />
                  <label className="form-check-label fw-bold text-danger" htmlFor="decisionReject" style={{ cursor: 'pointer' }}>
                    <i className="bi bi-x-circle-fill me-1"></i> Reject Requisition
                  </label>
                </div>
              </div>

              {reviewAction === 'APPROVE' ? (
                <div>
                  <label className="form-label">
                    Pickup Instructions & Vault Handover Notes (Optional)
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Pickup instructions"
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                  />
                </div>
              ) : (
                <div>
                  <label className="form-label text-danger">
                    Reason for Rejection
                  </label>
                  <input
                    type="text"
                    className="form-control border-danger"
                    placeholder="Reason for rejection"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    required
                  />
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer bg-light py-3 d-flex justify-content-end gap-2">
            <button type="button" className="btn btn-outline-secondary" onClick={onHide} disabled={submitting}>
              Cancel
            </button>
            <button
              type="button"
              className={`btn ${reviewAction === 'APPROVE' ? 'btn-success text-white' : 'btn-danger'}`}
              onClick={handleAction}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-1"></span> Processing...
                </>
              ) : reviewAction === 'APPROVE' ? (
                <>
                  <i className="bi bi-check2-circle me-1"></i> Confirm Approval
                </>
              ) : (
                <>
                  <i className="bi bi-x-circle me-1"></i> Confirm Rejection
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestReviewModal;
