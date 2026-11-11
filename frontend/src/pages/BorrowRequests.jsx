import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getRequests,
  createRequest,
  approveRequest,
  rejectRequest,
  cancelRequest
} from '../services/requestService';
import { getCategories } from '../services/equipmentService';
import { checkoutItems, checkinItems } from '../services/checkInOutService';
import RequestFormModal from '../components/requests/RequestFormModal';
import RequestReviewModal from '../components/requests/RequestReviewModal';
import CheckoutModal from '../components/checkinout/CheckoutModal';
import CheckinModal from '../components/checkinout/CheckinModal';
import HandoverPrintDocument from '../components/print/HandoverPrintDocument';
import ReturnPrintDocument from '../components/print/ReturnPrintDocument';
import StatusBadge from '../components/common/StatusBadge';
import { formatDate } from '../utils/formatters';

const BorrowRequests = () => {
  const { user, isStaff, isUser } = useAuth();
  const [requests, setRequests] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [reviewRequest, setReviewRequest] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // CheckInOut Modals
  const [checkoutRequest, setCheckoutRequest] = useState(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkinRequest, setCheckinRequest] = useState(null);
  const [showCheckinModal, setShowCheckinModal] = useState(false);

  // Print Documents
  const [printHandoverReq, setPrintHandoverReq] = useState(null);
  const [printReturnReq, setPrintReturnReq] = useState(null);

  // Inspection modal for gear bundle preview
  const [viewItemsReq, setViewItemsReq] = useState(null);

  const [alertMsg, setAlertMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadRequests();
  }, [statusFilter, searchTerm]);

  const loadCategories = async () => {
    try {
      const res = await getCategories();
      if (res.data?.data) setCategories(res.data.data);
    } catch (e) {
      console.warn('Failed to load categories:', e);
    }
  };

  const loadRequests = async () => {
    try {
      setLoading(true);
      const params = {
        status: (statusFilter !== 'ALL' && statusFilter !== 'OVERDUE') ? statusFilter : undefined,
        search: searchTerm.trim() || undefined
      };
      const res = await getRequests(params);
      if (res.data?.success) {
        let list = res.data.data || [];
        if (statusFilter === 'OVERDUE') {
          const now = new Date();
          list = list.filter(r => 
            ['CHECKED_OUT', 'PARTIALLY_RETURNED'].includes(r.status) && 
            new Date(r.endDate) < now
          );
        }
        setRequests(list);
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

  const handleCheckoutSubmit = async (payload) => {
    await checkoutItems(payload);
    setAlertMsg({ type: 'success', text: 'Equipment checked out successfully! Available stock has been updated.' });
    loadRequests();
  };

  const handleCheckinSubmit = async (payload) => {
    await checkinItems(payload);
    setAlertMsg({ type: 'success', text: 'Equipment returned & inspected. Stock quantities and conditions have been updated.' });
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

  const isOverdue = (req) => {
    return ['CHECKED_OUT', 'PARTIALLY_RETURNED'].includes(req.status) && new Date(req.endDate) < new Date();
  };

  // Filter by category
  const displayRequests = requests.filter(req => {
    if (categoryFilter !== 'ALL') {
      const hasCat = req.items?.some(i => i.equipment?.categoryId === categoryFilter);
      if (!hasCat) return false;
    }
    return true;
  });

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-2">
        <div>
          <h4 className="fw-bold text-dark mb-0">Borrow Requests</h4>
        </div>

        <button
          type="button"
          className="btn btn-sm btn-primary d-flex align-items-center gap-1 shadow-sm"
          onClick={() => setShowCreateModal(true)}
        >
          <i className="bi bi-calendar2-plus"></i>
          <span>New Borrow Request</span>
        </button>
      </div>

      {alertMsg.text && (
        <div className={`alert alert-${alertMsg.type} alert-dismissible fade show py-2 small mb-3 shadow-sm`} role="alert">
          {alertMsg.text}
          <button type="button" className="btn-close py-2" onClick={() => setAlertMsg({ type: '', text: '' })}></button>
        </div>
      )}

      {/* Filter toolbar */}
      <div className="card mb-4 border-0 shadow-sm">
        <div className="card-body p-3">
          <div className="row g-2 align-items-center">
            {/* Search */}
            <div className="col-md-5">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-white border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 ps-0"
                  placeholder="Search request #, borrower, project..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={() => setSearchTerm('')}
                  >
                    <i className="bi bi-x-lg"></i>
                  </button>
                )}
              </div>
            </div>

            {/* Equipment Category Selection Filter */}
            <div className="col-md-4">
              <select
                className="form-select form-select-sm"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="ALL">All Equipment Categories ({categories.length})</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="col-md-3">
              <select
                className="form-select form-select-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Request Statuses</option>
                <option value="PENDING">Pending Review (Awaiting)</option>
                <option value="APPROVED">Approved (Ready for Pickup)</option>
                <option value="CHECKED_OUT">In Field / On Loan</option>
                <option value="OVERDUE">Overdue Returns</option>
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
      ) : displayRequests.length === 0 ? (
        <div className="card text-center py-5 border-0 shadow-sm">
          <div className="card-body">
            <i className="bi bi-calendar-x fs-1 text-muted d-block mb-2"></i>
            <h6 className="fw-bold text-dark">No requests found</h6>
            <p className="text-muted small mb-3">
              {isUser
                ? 'You have not submitted any equipment requests yet.'
                : 'No equipment requests match the current filters.'}
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
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table table-custom align-middle mb-0">
              <thead>
                <tr>
                  <th style={{ width: '130px' }}>Request #</th>
                  {isStaff && <th>Borrower</th>}
                  <th>Production Project</th>
                  <th style={{ width: '170px' }}>Dates (Start - Return)</th>
                  <th style={{ minWidth: '180px' }}>Requested Gear Items</th>
                  <th style={{ width: '130px' }}>Status</th>
                  <th className="text-end" style={{ width: '160px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayRequests.map(req => {
                  const overdue = isOverdue(req);
                  return (
                    <tr key={req.id} className={overdue ? 'bg-danger-subtle' : ''}>
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
                        <div className={overdue ? 'text-danger fw-bold' : 'text-muted'}>
                          <i className="bi bi-calendar-check me-1"></i>{formatDate(req.endDate)}
                          {overdue && <span className="ms-1 badge bg-danger text-white">Overdue</span>}
                        </div>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="btn btn-light btn-sm border d-flex align-items-center gap-2 py-1 px-2 text-start shadow-xs w-100"
                          style={{ fontSize: '0.75rem', maxWidth: '240px' }}
                          onClick={() => setViewItemsReq(req)}
                          title="Click to view all gear items in this request"
                        >
                          <span className="badge bg-primary text-white">
                            {req.items?.length || 0}
                          </span>
                          <span className="text-truncate text-secondary flex-grow-1" style={{ fontSize: '0.74rem' }}>
                            {req.items?.map(i => i.equipment?.name).filter(Boolean).slice(0, 2).join(', ')}
                            {(req.items?.length || 0) > 2 ? '...' : ''}
                          </span>
                          <i className="bi bi-eye text-muted small ms-auto"></i>
                        </button>
                      </td>

                      <td>
                        {overdue ? (
                          <span className="badge bg-danger text-white px-2 py-1 fw-semibold d-inline-flex align-items-center" style={{ fontSize: '0.72rem', borderRadius: '14px' }}>
                            <span className="status-dot" style={{ backgroundColor: '#ffffff' }}></span>
                            Overdue
                          </span>
                        ) : (
                          <StatusBadge status={req.status} />
                        )}
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

                          {/* Staff Handover / Checkout Button for APPROVED requests */}
                          {isStaff && req.status === 'APPROVED' && (
                            <button
                              type="button"
                              className="btn btn-warning text-dark fw-semibold"
                              title="Checkout / Handover Gear"
                              onClick={() => {
                                setCheckoutRequest(req);
                                setShowCheckoutModal(true);
                              }}
                            >
                              <i className="bi bi-box-arrow-up-right me-1"></i> Handover
                            </button>
                          )}

                          {/* Staff Return & Inspection Button for CHECKED_OUT / PARTIALLY_RETURNED */}
                          {isStaff && ['CHECKED_OUT', 'PARTIALLY_RETURNED'].includes(req.status) && (
                            <button
                              type="button"
                              className="btn btn-success text-white fw-semibold"
                              title="Check In / Confirm Return Condition"
                              onClick={() => {
                                setCheckinRequest(req);
                                setShowCheckinModal(true);
                              }}
                            >
                              <i className="bi bi-box-arrow-in-left me-1"></i> Return & Inspect
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
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Gear Bundle Preview Modal */}
      {viewItemsReq && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header py-2 px-3 bg-light border-bottom">
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-camera text-primary fs-5"></i>
                  <div>
                    <h6 className="modal-title fw-bold text-dark mb-0">
                      Requested Equipment ({viewItemsReq.requestNumber})
                    </h6>
                    <small className="text-muted" style={{ fontSize: '0.72rem' }}>
                      Project: {viewItemsReq.project?.title || 'Standalone Shoot'} • Requester: {viewItemsReq.user?.name}
                    </small>
                  </div>
                </div>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setViewItemsReq(null)}
                  aria-label="Close"
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>

              <div className="modal-body p-3">
                <div className="list-group">
                  {viewItemsReq.items?.map((item, idx) => (
                    <div key={item.id || idx} className="list-group-item d-flex align-items-center gap-3 p-3">
                      {item.equipment?.imageUrl ? (
                        <img
                          src={item.equipment.imageUrl}
                          alt={item.equipment.name}
                          className="rounded border flex-shrink-0"
                          style={{ width: '48px', height: '48px', objectFit: 'cover' }}
                        />
                      ) : (
                        <div
                          className="rounded bg-light border d-flex align-items-center justify-content-center text-muted flex-shrink-0"
                          style={{ width: '48px', height: '48px' }}
                        >
                          <i className="bi bi-camera fs-4"></i>
                        </div>
                      )}

                      <div className="flex-grow-1 min-width-0">
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <span className="badge bg-slate-900 text-white font-monospace" style={{ fontSize: '0.72rem' }}>
                            {item.equipment?.assetTag || 'GEAR-TAG'}
                          </span>
                          <span className="badge bg-light text-secondary border" style={{ fontSize: '0.68rem' }}>
                            {item.equipment?.category?.name || 'Equipment'}
                          </span>
                        </div>
                        <div className="fw-bold text-dark small">{item.equipment?.name}</div>
                        <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                          Brand: {item.equipment?.brand || '—'} • Model: {item.equipment?.model || '—'}
                        </div>
                      </div>

                      <div className="text-end flex-shrink-0">
                        <div className="fw-bold text-primary fs-6">×{item.quantity || 1}</div>
                        <span className="badge bg-success-subtle text-success border border-success-subtle" style={{ fontSize: '0.65rem' }}>
                          Requested
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-footer py-2 px-3 bg-light border-top">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setViewItemsReq(null)}>
                  Close
                </button>
              </div>
            </div>
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

      {/* Staff Handover / Checkout Modal */}
      <CheckoutModal
        show={showCheckoutModal}
        onHide={() => {
          setShowCheckoutModal(false);
          setCheckoutRequest(null);
        }}
        request={checkoutRequest}
        onSubmit={handleCheckoutSubmit}
      />

      {/* Staff Check-In / Return Condition Inspection Modal */}
      <CheckinModal
        show={showCheckinModal}
        onHide={() => {
          setShowCheckinModal(false);
          setCheckinRequest(null);
        }}
        request={checkinRequest}
        onSubmit={handleCheckinSubmit}
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
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setPrintHandoverReq(null)}
                  aria-label="Close"
                >
                  <i className="bi bi-x-lg"></i>
                </button>
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
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setPrintReturnReq(null)}
                  aria-label="Close"
                >
                  <i className="bi bi-x-lg"></i>
                </button>
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
