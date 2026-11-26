import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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

const STATUS_TABS = [
  { key: 'ALL', label: 'All Requests' },
  { key: 'PENDING', label: 'Pending Review' },
  { key: 'APPROVED', label: 'Approved (Ready)' },
  { key: 'CHECKED_OUT', label: 'In Field (Active)' },
  { key: 'OVERDUE', label: 'Overdue Returns' },
  { key: 'RETURNED', label: 'Returned' },
  { key: 'REJECTED', label: 'Rejected' }
];

const BorrowRequests = () => {
  const { user, isStaff, isUser } = useAuth();
  const [searchParams] = useSearchParams();
  const [requests, setRequests] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const qStatus = searchParams.get('status');
    if (qStatus) {
      setStatusFilter(qStatus);
    }
  }, [searchParams]);

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

  // Inspection results modal for returned gear
  const [inspectionResultReq, setInspectionResultReq] = useState(null);

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
    setAlertMsg({ type: 'success', text: 'Request approved successfully. Ready for handover.' });
    loadRequests();
  };

  const handleReject = async (id, data) => {
    await rejectRequest(id, data);
    setAlertMsg({ type: 'warning', text: 'Request rejected with specified notes.' });
    loadRequests();
  };

  const handleCheckoutSubmit = async (payload) => {
    await checkoutItems(payload);
    setAlertMsg({ type: 'success', text: 'Equipment checked out successfully! Available stock updated.' });
    loadRequests();
  };

  const handleCheckinSubmit = async (payload) => {
    await checkinItems(payload);
    setAlertMsg({ type: 'success', text: 'Equipment returned & inspected. Stock quantities and conditions updated.' });
    loadRequests();
  };

  const handleCancel = async (id) => {
    if (window.confirm('Are you sure you want to cancel this pending borrow request?')) {
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

  // KPI calculations
  const totalCount = requests.length;
  const pendingCount = requests.filter(r => r.status === 'PENDING').length;
  const inFieldCount = requests.filter(r => ['CHECKED_OUT', 'PARTIALLY_RETURNED'].includes(r.status)).length;
  const overdueCount = requests.filter(r => isOverdue(r)).length;
  const returnedCount = requests.filter(r => r.status === 'RETURNED').length;

  // Filter by category
  const displayRequests = requests.filter(req => {
    if (categoryFilter !== 'ALL') {
      const hasCat = req.items?.some(i => i.equipment?.categoryId === categoryFilter);
      if (!hasCat) return false;
    }
    return true;
  });

  return (
    <div className="pb-5">
      {/* Top Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-2">
        <div>
          <h4 className="fw-bold text-dark mb-0">Borrow Requests & Requisition Vault</h4>
          <p className="text-muted small mb-0">
            Manage equipment loan workflows, technical approvals, fast handovers, and return quality inspections.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1 shadow-sm px-3"
            onClick={loadRequests}
            title="Refresh Requisition List"
          >
            <i className="bi bi-arrow-clockwise"></i>
            <span>Refresh</span>
          </button>

          <button
            type="button"
            className="btn btn-primary btn-sm d-flex align-items-center gap-1 shadow-sm px-3 fw-semibold"
            onClick={() => setShowCreateModal(true)}
          >
            <i className="bi bi-calendar2-plus"></i>
            <span>New Borrow Request</span>
          </button>
        </div>
      </div>

      {alertMsg.text && (
        <div className={`alert alert-${alertMsg.type} alert-dismissible fade show py-2.5 px-3 small mb-4 shadow-xs`} role="alert">
          <div className="d-flex align-items-center gap-2">
            <i className={`bi ${alertMsg.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-octagon-fill'}`}></i>
            <span>{alertMsg.text}</span>
          </div>
          <button type="button" className="btn-close py-2" onClick={() => setAlertMsg({ type: '', text: '' })}></button>
        </div>
      )}

      {/* KPI METRIC CARDS */}
      <div className="row g-3 mb-4">
        {/* Total */}
        <div className="col-6 col-md-4 col-lg">
          <div
            className={`card border-0 shadow-xs h-100 cursor-pointer transition-all ${statusFilter === 'ALL' ? 'border-primary border' : ''}`}
            onClick={() => setStatusFilter('ALL')}
          >
            <div className="kpi-card">
              <span className="kpi-label" title="Total Requisitions">Total Requisitions</span>
              <div className="kpi-value text-dark">{totalCount}</div>
              <span className="kpi-sub">All historical & active</span>
            </div>
          </div>
        </div>

        {/* Pending Review */}
        <div className="col-6 col-md-4 col-lg">
          <div
            className={`card border-0 shadow-xs h-100 cursor-pointer transition-all ${statusFilter === 'PENDING' ? 'border-warning border' : ''}`}
            onClick={() => setStatusFilter('PENDING')}
          >
            <div className="kpi-card">
              <span className="kpi-label" title="Pending Review">Pending Review</span>
              <div className="kpi-value text-warning">{pendingCount}</div>
              <span className="kpi-sub">Awaiting staff sign-off</span>
            </div>
          </div>
        </div>

        {/* In Field Active */}
        <div className="col-6 col-md-4 col-lg">
          <div
            className={`card border-0 shadow-xs h-100 cursor-pointer transition-all ${statusFilter === 'CHECKED_OUT' ? 'border-primary border' : ''}`}
            onClick={() => setStatusFilter('CHECKED_OUT')}
          >
            <div className="kpi-card">
              <span className="kpi-label" title="Active in Field">Active in Field</span>
              <div className="kpi-value text-primary">{inFieldCount}</div>
              <span className="kpi-sub">On loan on production</span>
            </div>
          </div>
        </div>

        {/* Overdue */}
        <div className="col-6 col-md-6 col-lg">
          <div
            className={`card border-0 shadow-xs h-100 cursor-pointer transition-all ${statusFilter === 'OVERDUE' ? 'border-danger border bg-danger-subtle bg-opacity-10' : ''}`}
            onClick={() => setStatusFilter('OVERDUE')}
          >
            <div className="kpi-card">
              <span className="kpi-label" title="Overdue Returns">Overdue Returns</span>
              <div className={`kpi-value ${overdueCount > 0 ? 'text-danger' : 'text-muted'}`}>
                {overdueCount}
              </div>
              <span className={`kpi-sub ${overdueCount > 0 ? 'text-danger fw-semibold' : ''}`}>
                {overdueCount > 0 ? 'Immediate return required' : 'No overdue loans'}
              </span>
            </div>
          </div>
        </div>

        {/* Completed */}
        <div className="col-12 col-md-6 col-lg">
          <div
            className={`card border-0 shadow-xs h-100 cursor-pointer transition-all ${statusFilter === 'RETURNED' ? 'border-success border' : ''}`}
            onClick={() => setStatusFilter('RETURNED')}
          >
            <div className="kpi-card">
              <span className="kpi-label" title="Returned & Closed">Returned & Closed</span>
              <div className="kpi-value text-success">{returnedCount}</div>
              <span className="kpi-sub">Inspected in vault</span>
            </div>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="card border-0 shadow-xs mb-4 bg-white">
        <div className="card-body p-3">
          <div className="row g-2 align-items-center">
            {/* Search */}
            <div className="col-md-5 col-lg-4">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-light border-end-0 text-muted">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 ps-0"
                  placeholder="Search requests..."
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
            <div className="col-md-4 col-lg-4">
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

            {/* Status Dropdown */}
            <div className="col-md-3 col-lg-4">
              <select
                className="form-select form-select-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                {STATUS_TABS.map(tab => (
                  <option key={tab.key} value={tab.key}>
                    {tab.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Status Filter Pills */}
          <div className="d-flex flex-wrap gap-1.5 mt-3 pt-2 border-top">
            {STATUS_TABS.map(tab => {
              const active = statusFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  className={`btn btn-xs py-1 px-2.5 rounded-pill font-sans transition-all ${
                    active ? 'btn-slate text-white fw-bold shadow-xs' : 'btn-outline-secondary text-secondary'
                  }`}
                  style={{
                    backgroundColor: active ? '#0f172a' : undefined,
                    borderColor: active ? '#0f172a' : undefined,
                    fontSize: '0.72rem'
                  }}
                  onClick={() => setStatusFilter(tab.key)}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* REQUESTS TABLE */}
      {loading ? (
        <div className="text-center py-5 card border-0 shadow-xs">
          <div className="spinner-border text-primary spinner-border-sm" role="status"></div>
          <p className="text-muted small mt-2">Loading requisition records...</p>
        </div>
      ) : displayRequests.length === 0 ? (
        <div className="card text-center py-5 border-0 shadow-xs bg-white">
          <div className="card-body">
            <i className="bi bi-calendar-x fs-1 text-muted d-block mb-2"></i>
            <h6 className="fw-bold text-dark">No requests found</h6>
            <p className="text-muted small mb-3">
              {isUser
                ? 'You have not submitted any equipment requests yet.'
                : 'No equipment requests match your selected filters.'}
            </p>
            <button
              type="button"
              className="btn btn-sm btn-primary px-3 shadow-xs"
              onClick={() => setShowCreateModal(true)}
            >
              <i className="bi bi-plus-lg me-1"></i> Submit New Request
            </button>
          </div>
        </div>
      ) : (
        <div className="card border-0 shadow-xs bg-white">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ minWidth: '920px' }}>
              <thead className="table-light text-muted small">
                <tr>
                  <th style={{ width: '16%' }}>Request & Borrower</th>
                  <th style={{ width: '22%' }}>Production Project & Purpose</th>
                  <th style={{ width: '18%' }}>Shoot & Return Timeline</th>
                  <th style={{ width: '16%' }}>Equipment Bundle</th>
                  <th style={{ width: '12%' }}>Status</th>
                  <th className="text-end" style={{ width: '16%' }}>Workflow Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayRequests.map(req => {
                  const overdue = isOverdue(req);
                  const isReturned = ['RETURNED', 'PARTIALLY_RETURNED'].includes(req.status);

                  return (
                    <tr key={req.id} className={overdue ? 'table-danger bg-opacity-25' : ''}>
                      {/* Request # & Borrower */}
                      <td>
                        <div className="d-flex align-items-center gap-1.5 mb-1">
                          <span className="badge bg-slate-900 text-white font-monospace" style={{ fontSize: '0.72rem' }}>
                            {req.requestNumber}
                          </span>
                        </div>
                        <div className="fw-bold text-dark small">{req.user?.name || 'Requisition User'}</div>
                        <div className="text-muted font-sans" style={{ fontSize: '0.7rem' }}>
                          {req.user?.department || 'Production'} • {formatDate(req.createdAt)}
                        </div>
                      </td>

                      {/* Project & Purpose */}
                      <td>
                        <div className="fw-bold text-dark small text-truncate" style={{ maxWidth: '240px' }} title={req.project?.title}>
                          {req.project?.title || 'Standalone Shoot'}
                        </div>
                        <div className="text-muted small text-truncate" style={{ maxWidth: '240px', fontSize: '0.74rem' }} title={req.purpose}>
                          {req.purpose || 'Production shooting'}
                        </div>
                        {req.destination && (
                          <div className="text-secondary small mt-0.5" style={{ fontSize: '0.68rem' }}>
                            <i className="bi bi-geo-alt me-1 text-primary"></i>{req.destination}
                          </div>
                        )}
                      </td>

                      {/* Shoot & Return Timeline */}
                      <td>
                        <div className="small font-sans">
                          <span className="text-muted">Out:</span> <strong className="text-dark">{formatDate(req.startDate)}</strong>
                        </div>
                        <div className={`small font-sans mt-0.5 ${overdue ? 'text-danger fw-bold' : 'text-muted'}`}>
                          <span>Return:</span> <strong className={overdue ? 'text-danger' : 'text-dark'}>{formatDate(req.endDate)}</strong>
                          {overdue && (
                            <span className="badge bg-danger text-white ms-1" style={{ fontSize: '0.65rem' }}>
                              OVERDUE
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Requested Gear Items */}
                      <td>
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm d-flex align-items-center justify-content-between p-1.5 px-2 text-start w-100 shadow-none border"
                          style={{ fontSize: '0.74rem' }}
                          onClick={() => setViewItemsReq(req)}
                          title="Click to preview requested equipment kit"
                        >
                          <div className="d-flex align-items-center gap-1.5 text-truncate">
                            <span className="badge bg-primary text-white font-monospace">
                              {req.items?.length || 0}
                            </span>
                            <span className="text-truncate text-secondary">
                              {req.items?.[0]?.equipment?.name || 'Gear Kit'}
                              {(req.items?.length || 0) > 1 ? ` +${req.items.length - 1} more` : ''}
                            </span>
                          </div>
                          <i className="bi bi-box-arrow-up-right text-muted ms-1" style={{ fontSize: '0.7rem' }}></i>
                        </button>
                      </td>

                      {/* Status */}
                      <td>
                        <div>
                          {overdue ? (
                            <span className="badge bg-danger text-white px-2 py-1 fw-semibold d-inline-flex align-items-center" style={{ fontSize: '0.7rem', borderRadius: '14px' }}>
                              <span className="status-dot" style={{ backgroundColor: '#ffffff' }}></span>
                              Overdue
                            </span>
                          ) : (
                            <StatusBadge status={req.status} />
                          )}
                        </div>

                        {req.rejectionReason && (
                          <div className="text-danger small mt-1 text-truncate" style={{ maxWidth: '140px', fontSize: '0.68rem' }} title={req.rejectionReason}>
                            Reason: {req.rejectionReason}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="text-end">
                        <div className="d-inline-flex align-items-center gap-1">
                          {/* Staff Review Button for PENDING requests */}
                          {isStaff && req.status === 'PENDING' && (
                            <button
                              type="button"
                              className="btn btn-primary btn-sm px-2.5 fw-semibold shadow-xs"
                              style={{ fontSize: '0.74rem' }}
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
                              className="btn btn-warning btn-sm text-dark px-2.5 fw-semibold shadow-xs"
                              style={{ fontSize: '0.74rem' }}
                              title="Checkout and handover equipment to crew"
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
                              className="btn btn-success btn-sm text-white px-2.5 fw-semibold shadow-xs text-nowrap"
                              style={{ fontSize: '0.74rem' }}
                              title="Process return intake & inspection"
                              onClick={() => {
                                setCheckinRequest(req);
                                setShowCheckinModal(true);
                              }}
                            >
                              <i className="bi bi-box-arrow-in-left me-1"></i> Return & Inspect
                            </button>
                          )}

                          {/* View Inspection Report Button for RETURNED requests */}
                          {isReturned && (
                            <button
                              type="button"
                              className="btn btn-outline-success btn-sm px-2 text-nowrap"
                              style={{ fontSize: '0.72rem' }}
                              title="View technical return inspection details"
                              onClick={() => setInspectionResultReq(req)}
                            >
                              <i className="bi bi-card-checklist me-1"></i> Inspection
                            </button>
                          )}

                          {/* Print Handover Form */}
                          {['APPROVED', 'CHECKED_OUT', 'PARTIALLY_RETURNED', 'RETURNED'].includes(req.status) && (
                            <button
                              type="button"
                              className="btn btn-light border btn-sm"
                              style={{ width: '28px', height: '28px', padding: 0 }}
                              title="Print A4 Handover Agreement"
                              onClick={() => setPrintHandoverReq(req)}
                            >
                              <i className="bi bi-file-earmark-text text-primary" style={{ fontSize: '0.75rem' }}></i>
                            </button>
                          )}

                          {/* Print Return Slip */}
                          {isReturned && (
                            <button
                              type="button"
                              className="btn btn-light border btn-sm"
                              style={{ width: '28px', height: '28px', padding: 0 }}
                              title="Print A4 Return Quality Inspection Receipt"
                              onClick={() => setPrintReturnReq(req)}
                            >
                              <i className="bi bi-receipt text-success" style={{ fontSize: '0.75rem' }}></i>
                            </button>
                          )}

                          {/* User Cancel Button if Pending */}
                          {req.status === 'PENDING' && (req.userId === user?.id || isStaff) && (
                            <button
                              type="button"
                              className="btn btn-light border btn-sm text-danger"
                              style={{ width: '28px', height: '28px', padding: 0 }}
                              title="Cancel Request"
                              onClick={() => handleCancel(req.id)}
                            >
                              <i className="bi bi-x-circle" style={{ fontSize: '0.75rem' }}></i>
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

      {/* GEAR BUNDLE PREVIEW MODAL */}
      {viewItemsReq && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-slate-900 text-white" style={{ backgroundColor: '#0f172a' }}>
                <div className="d-flex align-items-center gap-2">
                  <div className="p-2 rounded bg-primary-subtle text-primary d-flex align-items-center justify-content-center" style={{ width: 32, height: 32 }}>
                    <i className="bi bi-boxes" style={{ fontSize: '0.9rem' }}></i>
                  </div>
                  <div>
                    <h6 className="modal-title fw-bold text-white mb-0">
                      Equipment Bundle ({viewItemsReq.requestNumber})
                    </h6>
                    <small className="text-slate-400" style={{ fontSize: '0.72rem' }}>
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

              <div className="modal-body p-3 p-md-4">
                <div className="list-group">
                  {viewItemsReq.items?.map((item, idx) => (
                    <div key={item.id || idx} className="list-group-item d-flex align-items-center gap-3 p-3 border rounded mb-2">
                      {item.equipment?.imageUrl ? (
                        <img
                          src={item.equipment.imageUrl}
                          alt={item.equipment.name}
                          referrerPolicy="no-referrer"
                          className="rounded border flex-shrink-0"
                          style={{ width: '48px', height: '48px', objectFit: 'cover' }}
                          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=100&auto=format&fit=crop&q=80'; }}
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
                          Brand: {item.equipment?.brand || '—'} • Model: {item.equipment?.model || '—'} {item.equipment?.serialNumber ? `• S/N: ${item.equipment.serialNumber}` : ''}
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

              <div className="modal-footer py-2 px-3 bg-light border-top d-flex justify-content-between align-items-center">
                <span className="small text-muted">
                  Total Bundle Items: <strong>{viewItemsReq.items?.length || 0}</strong>
                </span>
                <button type="button" className="btn btn-secondary btn-sm px-3" onClick={() => setViewItemsReq(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INSPECTION RESULTS MODAL */}
      {inspectionResultReq && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-slate-900 text-white" style={{ backgroundColor: '#0f172a' }}>
                <div className="d-flex align-items-center gap-2">
                  <div className="p-2 rounded bg-success text-white d-flex align-items-center justify-content-center" style={{ width: 32, height: 32 }}>
                    <i className="bi bi-card-checklist" style={{ fontSize: '0.9rem' }}></i>
                  </div>
                  <div>
                    <h6 className="modal-title fw-bold text-white mb-0">
                      Technical Return Inspection Record
                    </h6>
                    <small className="text-slate-400" style={{ fontSize: '0.72rem' }}>
                      Requisition: {inspectionResultReq.requestNumber} • Project: {inspectionResultReq.project?.title || 'Standalone Shoot'}
                    </small>
                  </div>
                </div>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setInspectionResultReq(null)}
                  aria-label="Close"
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>

              <div className="modal-body p-3 p-md-4">
                <div className="p-3 bg-light border rounded mb-3">
                  <div className="row g-2">
                    <div className="col-sm-6">
                      <span className="text-muted small">Returning Custodian:</span>
                      <div className="fw-semibold text-dark">{inspectionResultReq.user?.name}</div>
                    </div>
                    <div className="col-sm-6">
                      <span className="text-muted small">Return Status:</span>
                      <div><StatusBadge status={inspectionResultReq.status} /></div>
                    </div>
                  </div>
                </div>

                <h6 className="fw-bold text-dark small text-uppercase mb-2">
                  Inspected Gear Items ({inspectionResultReq.items?.length || 0})
                </h6>

                <div className="list-group">
                  {inspectionResultReq.items?.map((item, idx) => (
                    <div key={item.id || idx} className="list-group-item p-3 border rounded mb-2">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <div className="d-flex align-items-center gap-1.5 mb-1">
                            <span className="badge bg-slate-900 text-white font-monospace" style={{ fontSize: '0.7rem' }}>
                              {item.equipment?.assetTag || 'GEAR-TAG'}
                            </span>
                            <span className="badge bg-primary-subtle text-primary border border-primary-subtle" style={{ fontSize: '0.68rem' }}>
                              {item.equipment?.category?.name || 'Equipment'}
                            </span>
                          </div>
                          <div className="fw-bold text-dark small">{item.equipment?.name}</div>
                          <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                            Model: {item.equipment?.model || 'Standard'} • S/N: {item.equipment?.serialNumber || 'N/A'}
                          </div>
                        </div>

                        <div className="text-end">
                          <span className={`badge ${
                            item.returnedCondition === 'EXCELLENT' ? 'bg-success' :
                            item.returnedCondition === 'GOOD' ? 'bg-primary' :
                            item.returnedCondition === 'FAIR' ? 'bg-warning text-dark' :
                            'bg-danger text-white'
                          } px-2 py-1`} style={{ fontSize: '0.7rem' }}>
                            Condition: {item.returnedCondition || item.equipment?.condition || 'GOOD'}
                          </span>
                        </div>
                      </div>

                      {item.notes && (
                        <div className="p-2 bg-light border rounded text-secondary small mt-2" style={{ fontSize: '0.74rem' }}>
                          <i className="bi bi-chat-left-text me-1"></i> Inspector Note: {item.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-footer py-2 px-3 bg-light border-top d-flex justify-content-between align-items-center">
                <button
                  type="button"
                  className="btn btn-outline-success btn-sm d-flex align-items-center gap-1"
                  onClick={() => {
                    const req = inspectionResultReq;
                    setInspectionResultReq(null);
                    setPrintReturnReq(req);
                  }}
                >
                  <i className="bi bi-printer"></i>
                  <span>Print Formal A4 Return Voucher</span>
                </button>

                <button type="button" className="btn btn-secondary btn-sm px-3" onClick={() => setInspectionResultReq(null)}>
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
