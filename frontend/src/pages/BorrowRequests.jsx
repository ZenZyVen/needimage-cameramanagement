import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getRequests,
  createRequest,
  approveRequest,
  rejectRequest,
  cancelRequest
} from '../services/requestService';
import RequestFormModal from '../components/requests/RequestFormModal';
import RequestReviewModal from '../components/requests/RequestReviewModal';
import HandoverPrintDocument from '../components/print/HandoverPrintDocument';
import ReturnPrintDocument from '../components/print/ReturnPrintDocument';
import StatusBadge from '../components/common/StatusBadge';
import { formatDate } from '../utils/formatters';

const BorrowRequests = () => {
  const { user, isStaff, isUser } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [reviewRequest, setReviewRequest] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Print Documents
  const [printHandoverReq, setPrintHandoverReq] = useState(null);
  const [printReturnReq, setPrintReturnReq] = useState(null);

  const [alertMsg, setAlertMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    loadRequests();
  }, [statusFilter, searchTerm]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const params = {
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        search: searchTerm.trim() || undefined
      };
      const res = await getRequests(params);
      if (res.data?.success) {
        setRequests(res.data.data || []);
      }
    } catch (err) {
      setAlertMsg({ type: 'danger', text: err.response?.data?.message || 'Error loading requests.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (payload) => {
    await createRequest(payload);
    setAlertMsg({ type: 'success', text: 'Borrow request submitted successfully.' });
    loadRequests();
  };

  const handleApprove = async (id, data) => {
    await approveRequest(id, data);
    setAlertMsg({ type: 'success', text: 'Request approved successfully.' });
    loadRequests();
  };

  const handleReject = async (id, data) => {
    await rejectRequest(id, data);
    setAlertMsg({ type: 'warning', text: 'Request rejected.' });
    loadRequests();
  };

  const handleCancel = async (id) => {
    if (window.confirm('Are you sure you want to cancel this pending request?')) {
      try {
        await cancelRequest(id);
        setAlertMsg({ type: 'info', text: 'Request cancelled.' });
        loadRequests();
      } catch (err) {
        setAlertMsg({ type: 'danger', text: err.response?.data?.message || 'Failed to cancel.' });
      }
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-2">
        <div>
          <h4 className="fw-bold text-dark mb-1">Equipment Borrowing Requests</h4>
          <p className="text-muted small mb-0">
            {isStaff
              ? 'Review, approve, and track camera & lighting equipment requisitions.'
              : 'Submit equipment requests for upcoming production shoots.'}
          </p>
        </div>

        <button
          type="button"
          className="btn btn-sm btn-primary d-flex align-items-center gap-1"
          onClick={() => setShowCreateModal(true)}
        >
          <i className="bi bi-calendar2-plus"></i>
          <span>New Borrow Request</span>
        </button>
      </div>

      {alertMsg.text && (
        <div className={`alert alert-${alertMsg.type} alert-dismissible fade show py-2 small mb-3`} role="alert">
          {alertMsg.text}
          <button type="button" className="btn-close py-2" onClick={() => setAlertMsg({ type: '', text: '' })}></button>
        </div>
      )}

      {/* Filter toolbar */}
      <div className="card mb-4">
        <div className="card-body p-3">
          <div className="row g-2 align-items-center">
            <div className="col-md-6">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-white border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Search request #, requester, purpose..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="col-md-4">
              <select
                className="form-select form-select-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Request Statuses</option>
                <option value="PENDING">Pending Review</option>
                <option value="APPROVED">Approved (Ready for Pickup)</option>
                <option value="CHECKED_OUT">Checked Out (Active Loan)</option>
                <option value="PARTIALLY_RETURNED">Partially Returned</option>
                <option value="RETURNED">Returned & Inspected</option>
                <option value="REJECTED">Rejected</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Requests Table */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="text-muted small mt-2">Loading requests...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="card text-center py-5">
          <div className="card-body">
            <i className="bi bi-calendar-x fs-1 text-muted d-block mb-2"></i>
            <h6 className="fw-bold text-dark">No requests found</h6>
            <p className="text-muted small mb-3">
              {isUser
                ? 'You have not submitted any equipment requests yet.'
                : 'No equipment requests match the current status filter.'}
            </p>
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              Submit New Request
            </button>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="table-responsive">
            <table className="table table-custom">
              <thead>
                <tr>
                  <th>Request #</th>
                  {isStaff && <th>Borrower</th>}
                  <th>Production Project</th>
                  <th>Dates (Start - Return)</th>
                  <th>Requested Gear Items</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(req => (
                  <tr key={req.id}>
                    <td>
                      <span className="fw-bold text-dark">{req.requestNumber}</span>
                      <div className="text-muted small" style={{ fontSize: '0.72rem' }}>
                        {formatDate(req.createdAt)}
                      </div>
                    </td>

                    {isStaff && (
                      <td>
                        <div className="fw-semibold text-dark">{req.user?.name}</div>
                        <div className="small text-muted">{req.user?.department || 'Production'}</div>
                      </td>
                    )}

                    <td>
                      <div className="fw-semibold text-dark text-truncate" style={{ maxWidth: '170px' }}>
                        {req.project?.title || 'Standalone Shoot'}
                      </div>
                      <div className="small text-muted text-truncate" style={{ maxWidth: '170px' }}>
                        {req.purpose}
                      </div>
                    </td>

                    <td className="small text-nowrap">
                      <div><i className="bi bi-calendar-event me-1 text-primary"></i>{formatDate(req.startDate)}</div>
                      <div className="text-muted"><i className="bi bi-calendar-check me-1 text-danger"></i>{formatDate(req.endDate)}</div>
                    </td>

                    <td>
                      <div className="d-flex flex-wrap gap-1" style={{ maxWidth: '280px' }}>
                        {req.items?.map(item => (
                          <span
                            key={item.id}
                            className="accessory-badge"
                            title={item.equipment?.name}
                          >
                            {item.equipment?.assetTag}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td>
                      <StatusBadge status={req.status} />
                      {req.rejectionReason && (
                        <div className="small text-danger mt-1 text-truncate" style={{ maxWidth: '150px' }} title={req.rejectionReason}>
                          Reason: {req.rejectionReason}
                        </div>
                      )}
                    </td>

                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        {/* Staff Review Button for PENDING requests */}
                        {isStaff && req.status === 'PENDING' && (
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => {
                              setReviewRequest(req);
                              setShowReviewModal(true);
                            }}
                          >
                            <i className="bi bi-clipboard-check me-1"></i> Review
                          </button>
                        )}

                        {/* Handover Print Button */}
                        {['APPROVED', 'CHECKED_OUT', 'PARTIALLY_RETURNED', 'RETURNED'].includes(req.status) && (
                          <button
                            type="button"
                            className="btn btn-light border"
                            title="Print Handover Form"
                            onClick={() => setPrintHandoverReq(req)}
                          >
                            <i className="bi bi-file-earmark-text text-primary"></i>
                          </button>
                        )}

                        {/* Return Print Button */}
                        {['PARTIALLY_RETURNED', 'RETURNED'].includes(req.status) && (
                          <button
                            type="button"
                            className="btn btn-light border"
                            title="Print Return Voucher"
                            onClick={() => setPrintReturnReq(req)}
                          >
                            <i className="bi bi-receipt text-success"></i>
                          </button>
                        )}

                        {/* User Cancel Button if Pending */}
                        {req.status === 'PENDING' && (req.userId === user?.id || isStaff) && (
                          <button
                            type="button"
                            className="btn btn-light border text-danger"
                            title="Cancel Request"
                            onClick={() => handleCancel(req.id)}
                          >
                            <i className="bi bi-x-circle"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Request Modal */}
      <RequestFormModal
        show={showCreateModal}
        onHide={() => setShowCreateModal(false)}
        onSubmit={handleCreate}
      />

      {/* Staff Review Modal */}
      <RequestReviewModal
        show={showReviewModal}
        onHide={() => setShowReviewModal(false)}
        request={reviewRequest}
        onApprove={handleApprove}
        onReject={handleReject}
      />

      {/* Modal for Handover Print Document */}
      {printHandoverReq && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)' }}>
          <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header py-2 px-3 bg-light border-bottom no-print">
                <h6 className="modal-title fw-bold text-dark mb-0">
                  <i className="bi bi-printer me-2 text-primary"></i>
                  A4 Equipment Handover Voucher Preview
                </h6>
                <button type="button" className="btn-close" onClick={() => setPrintHandoverReq(null)}></button>
              </div>
              <div className="modal-body p-4">
                <HandoverPrintDocument
                  request={printHandoverReq}
                  staffUser={user}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Return Print Document */}
      {printReturnReq && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)' }}>
          <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header py-2 px-3 bg-light border-bottom no-print">
                <h6 className="modal-title fw-bold text-dark mb-0">
                  <i className="bi bi-printer me-2 text-success"></i>
                  A4 Return & Quality Inspection Voucher Preview
                </h6>
                <button type="button" className="btn-close" onClick={() => setPrintReturnReq(null)}></button>
              </div>
              <div className="modal-body p-4">
                <ReturnPrintDocument
                  request={printReturnReq}
                  staffUser={user}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BorrowRequests;
