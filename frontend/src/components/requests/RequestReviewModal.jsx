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
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)' }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content border-0 shadow">
          <div className="modal-header bg-slate-900 text-white" style={{ backgroundColor: '#1e293b' }}>
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-primary fs-6">{request.requestNumber}</span>
              <h6 className="modal-title fw-bold text-white mb-0">Review Equipment Request</h6>
            </div>
            <button type="button" className="btn-close btn-close-white" onClick={onHide}></button>
          </div>

          <div className="modal-body p-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            {errorMsg && (
              <div className="alert alert-danger py-2 small mb-3">
                <i className="bi bi-exclamation-circle me-1"></i> {errorMsg}
              </div>
            )}

            {/* Requester & Project Info */}
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <div className="p-3 border rounded bg-light">
                  <span className="text-muted small text-uppercase fw-semibold d-block">Requester</span>
                  <div className="fw-bold text-dark">{request.user?.name}</div>
                  <div className="small text-muted">{request.user?.department || 'Production'} • {request.user?.email}</div>
                  <div className="small text-muted">Phone: {request.user?.phone || '—'}</div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="p-3 border rounded bg-light">
                  <span className="text-muted small text-uppercase fw-semibold d-block">Project & Schedule</span>
                  <div className="fw-bold text-dark">{request.project?.title || 'Standalone Production'}</div>
                  <div className="small text-muted">
                    Dates: <strong>{formatDate(request.startDate)}</strong> to <strong>{formatDate(request.endDate)}</strong>
                  </div>
                  <div className="small text-muted">Destination: {request.destination || 'Studio'}</div>
                </div>
              </div>
            </div>

            {/* Purpose */}
            <div className="mb-4">
              <span className="text-muted small text-uppercase fw-semibold d-block mb-1">Purpose of Loan</span>
              <p className="p-2 border rounded bg-white text-dark small mb-0">{request.purpose}</p>
            </div>

            {/* Requested Gear Table */}
            <div className="mb-4">
              <span className="text-muted small text-uppercase fw-semibold d-block mb-2">
                Requested Equipment List ({request.items?.length || 0})
              </span>
              <div className="table-responsive border rounded">
                <table className="table table-sm table-hover mb-0" style={{ fontSize: '8.5pt' }}>
                  <thead className="table-light">
                    <tr>
                      <th>Asset Tag</th>
                      <th>Equipment Description</th>
                      <th>Serial #</th>
                      <th>Current Status</th>
                      <th>Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    {request.items?.map((item) => (
                      <tr key={item.id}>
                        <td className="fw-bold">{item.equipment?.assetTag}</td>
                        <td>{item.equipment?.name}</td>
                        <td>{item.equipment?.serialNumber}</td>
                        <td>
                          <span className={`badge ${item.equipment?.status === 'AVAILABLE' ? 'bg-success' : 'bg-warning text-dark'}`}>
                            {item.equipment?.status}
                          </span>
                        </td>
                        <td>{item.equipment?.location || 'Vault'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Decision Toggle */}
            <div className="p-3 border rounded bg-light">
              <span className="text-muted small text-uppercase fw-semibold d-block mb-2">Review Decision</span>
              <div className="d-flex gap-3 mb-3">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    id="decisionApprove"
                    name="decision"
                    checked={reviewAction === 'APPROVE'}
                    onChange={() => setReviewAction('APPROVE')}
                  />
                  <label className="form-check-label fw-bold text-success" htmlFor="decisionApprove">
                    <i className="bi bi-check-circle me-1"></i> Approve Request
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
                  <label className="form-check-label fw-bold text-danger" htmlFor="decisionReject">
                    <i className="bi bi-x-circle me-1"></i> Reject Request
                  </label>
                </div>
              </div>

              {reviewAction === 'APPROVE' ? (
                <div>
                  <label className="form-label small text-secondary">
                    Approval Notes & Pickup Instructions (Optional)
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="e.g. Please collect from Vault Locker A-01 by 9:00 AM."
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                  />
                </div>
              ) : (
                <div>
                  <label className="form-label small text-danger fw-semibold">
                    Reason for Rejection <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-sm border-danger"
                    placeholder="e.g. Primary camera reserved for priority studio broadcast shoot."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    required
                  />
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer bg-light py-2">
            <button type="button" className="btn btn-sm btn-secondary" onClick={onHide} disabled={submitting}>
              Cancel
            </button>
            <button
              type="button"
              className={`btn btn-sm ${reviewAction === 'APPROVE' ? 'btn-success text-white' : 'btn-danger'}`}
              onClick={handleAction}
              disabled={submitting}
            >
              {submitting ? (
                'Processing...'
              ) : reviewAction === 'APPROVE' ? (
                'Confirm Approval'
              ) : (
                'Confirm Rejection'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestReviewModal;
