import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { getRequests } from '../services/requestService';
import StatusBadge from '../components/common/StatusBadge';
import { formatDate, formatDateTime, formatCurrency } from '../utils/formatters';

const Reports = () => {
  const { user, isAdmin } = useAuth();
  const { settings } = useSettings();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Timeframe filter: 'week' | 'month' | 'year' | 'all' | 'custom'
  const [timeframe, setTimeframe] = useState('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Selected Request for Invoice / Voucher Modal Preview
  const [selectedReqForInvoice, setSelectedReqForInvoice] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  useEffect(() => {
    // Initialize date ranges based on preset
    calculatePresetDates(timeframe);
  }, [timeframe]);

  useEffect(() => {
    loadLoanData();
  }, [startDate, endDate, statusFilter, searchTerm]);

  const calculatePresetDates = (preset) => {
    const now = new Date();
    if (preset === 'week') {
      const past7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      setStartDate(past7.toISOString().substring(0, 10));
      setEndDate(now.toISOString().substring(0, 10));
    } else if (preset === 'month') {
      const past30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      setStartDate(past30.toISOString().substring(0, 10));
      setEndDate(now.toISOString().substring(0, 10));
    } else if (preset === 'year') {
      const past365 = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      setStartDate(past365.toISOString().substring(0, 10));
      setEndDate(now.toISOString().substring(0, 10));
    } else if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    }
  };

  const loadLoanData = async () => {
    try {
      setLoading(true);
      const params = {
        status: statusFilter !== 'ALL' && statusFilter !== 'OVERDUE' ? statusFilter : undefined,
        search: searchTerm.trim() || undefined
      };
      const res = await getRequests(params);
      if (res.data?.success) {
        let list = res.data.data || [];

        // Apply date range filter
        if (startDate) {
          const s = new Date(startDate);
          list = list.filter(r => new Date(r.startDate || r.createdAt) >= s);
        }
        if (endDate) {
          const e = new Date(endDate);
          e.setHours(23, 59, 59, 999);
          list = list.filter(r => new Date(r.startDate || r.createdAt) <= e);
        }

        if (statusFilter === 'OVERDUE') {
          const now = new Date();
          list = list.filter(r =>
            ['CHECKED_OUT', 'PARTIALLY_RETURNED'].includes(r.status) &&
            new Date(r.endDate) < now
          );
        }

        // Sort descending by startDate / createdAt
        list.sort((a, b) => new Date(b.startDate || b.createdAt) - new Date(a.startDate || a.createdAt));

        setRequests(list);
      }
    } catch (e) {
      console.warn('Error loading loan activity data:', e);
    } finally {
      setLoading(false);
    }
  };

  // Aggregated Summary Metrics
  const totalLoans = requests.length;
  const activeLoans = requests.filter(r => ['CHECKED_OUT', 'PARTIALLY_RETURNED'].includes(r.status)).length;
  const completedReturns = requests.filter(r => r.status === 'RETURNED').length;
  const now = new Date();
  const overdueLoans = requests.filter(r => ['CHECKED_OUT', 'PARTIALLY_RETURNED'].includes(r.status) && new Date(r.endDate) < now).length;
  const totalUnitsLoaned = requests.reduce((acc, r) => acc + (r.items?.length || 0), 0);

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  // Export CSV
  const handleExportCSV = () => {
    if (requests.length === 0) return;
    const headers = [
      'Request Number',
      'Project Code',
      'Project Title',
      'Shoot Location',
      'Borrower Name',
      'Borrower Email',
      'Department',
      'Items Borrowed',
      'Total Items',
      'Start Date',
      'Expected Return',
      'Actual Return',
      'Loan Status',
      'Approved By'
    ];

    const rows = requests.map(r => {
      const itemsStr = (r.items || []).map(i => `${i.equipment?.assetTag || ''} (${i.equipment?.name || ''})`).join('; ');
      return [
        r.requestNumber,
        r.project?.projectCode || '—',
        `"${(r.project?.title || '—').replace(/"/g, '""')}"`,
        `"${(r.destination || r.project?.location || '—').replace(/"/g, '""')}"`,
        `"${(r.user?.name || '—').replace(/"/g, '""')}"`,
        `"${(r.user?.email || '—').replace(/"/g, '""')}"`,
        `"${(r.user?.department || 'Cinematography').replace(/"/g, '""')}"`,
        `"${itemsStr.replace(/"/g, '""')}"`,
        r.items?.length || 0,
        r.startDate ? new Date(r.startDate).toISOString().slice(0, 10) : '',
        r.endDate ? new Date(r.endDate).toISOString().slice(0, 10) : '',
        r.actualReturnDate ? new Date(r.actualReturnDate).toISOString().slice(0, 10) : 'Active',
        r.status,
        `"${(r.approvedBy?.name || '—').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `cinevault-loan-activity-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="pb-5">
      {/* Printable Report Header (Visible only when printed) */}
      <div className="d-none d-print-block mb-4 border-bottom pb-3">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h3 className="fw-bold text-dark mb-0">{settings.companyName || 'CineVault Media Studios'}</h3>
            <p className="text-muted small mb-0">Equipment Loan Activity & Utilization Audit Report</p>
          </div>
          <div className="text-end small text-muted font-monospace">
            <div>Generated: {new Date().toLocaleDateString()}</div>
            <div>Timeframe: {timeframe.toUpperCase()} {startDate && `(${startDate} to ${endDate})`}</div>
          </div>
        </div>
      </div>

      {/* Screen Top Header (Hidden when printed) */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-2 no-print">
        <div>
          <h4 className="fw-bold text-dark mb-0">Loan Activity Report</h4>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1 shadow-sm px-3"
            onClick={handleExportCSV}
            disabled={requests.length === 0}
          >
            <i className="bi bi-download"></i>
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm d-flex align-items-center gap-1 shadow-sm px-3 fw-semibold"
            onClick={handlePrint}
          >
            <i className="bi bi-printer"></i>
            <span>Print Report (PDF)</span>
          </button>
        </div>
      </div>

      {/* Metric Summary Cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-4 col-lg-2">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-3">
              <span className="text-muted small d-block">Total Loans</span>
              <h3 className="fw-bold text-dark mb-0 mt-1">{totalLoans}</h3>
              <span className="text-muted" style={{ fontSize: '0.72rem' }}>requisitions</span>
            </div>
          </div>
        </div>

        <div className="col-6 col-md-4 col-lg-2">
          <div className="card border-0 shadow-sm h-100 border-start border-primary border-3">
            <div className="card-body p-3">
              <span className="text-muted small d-block">Active In Field</span>
              <h3 className="fw-bold text-primary mb-0 mt-1">{activeLoans}</h3>
              <span className="text-muted" style={{ fontSize: '0.72rem' }}>currently on loan</span>
            </div>
          </div>
        </div>

        <div className="col-6 col-md-4 col-lg-2">
          <div className="card border-0 shadow-sm h-100 border-start border-success border-3">
            <div className="card-body p-3">
              <span className="text-muted small d-block">Completed Returns</span>
              <h3 className="fw-bold text-success mb-0 mt-1">{completedReturns}</h3>
              <span className="text-muted" style={{ fontSize: '0.72rem' }}>returned to vault</span>
            </div>
          </div>
        </div>

        <div className="col-6 col-md-4 col-lg-3">
          <div className="card border-0 shadow-sm h-100 border-start border-danger border-3">
            <div className="card-body p-3">
              <span className="text-muted small d-block">Overdue Loans</span>
              <h3 className={`fw-bold mb-0 mt-1 ${overdueLoans > 0 ? 'text-danger' : 'text-muted'}`}>
                {overdueLoans}
              </h3>
              <span className="text-muted" style={{ fontSize: '0.72rem' }}>past expected return date</span>
            </div>
          </div>
        </div>

        <div className="col-6 col-md-4 col-lg-3">
          <div className="card border-0 shadow-sm h-100 border-start border-secondary border-3">
            <div className="card-body p-3">
              <span className="text-muted small d-block">Total Gear Items</span>
              <h3 className="fw-bold text-dark mb-0 mt-1">{totalUnitsLoaned}</h3>
              <span className="text-muted" style={{ fontSize: '0.72rem' }}>units dispatched</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Timeframe Toolbar (Hidden in Print) */}
      <div className="card border-0 shadow-sm mb-4 no-print">
        <div className="card-body p-3">
          <div className="row g-2 align-items-center">
            {/* Timeframe Presets Buttons */}
            <div className="col-md-5">
              <label className="form-label small fw-semibold text-secondary mb-1 d-block">
                Report Period Filter:
              </label>
              <div className="btn-group btn-group-sm w-100" role="group">
                <button
                  type="button"
                  className={`btn ${timeframe === 'week' ? 'btn-primary fw-bold' : 'btn-outline-secondary'}`}
                  onClick={() => setTimeframe('week')}
                >
                  This Week
                </button>
                <button
                  type="button"
                  className={`btn ${timeframe === 'month' ? 'btn-primary fw-bold' : 'btn-outline-secondary'}`}
                  onClick={() => setTimeframe('month')}
                >
                  This Month
                </button>
                <button
                  type="button"
                  className={`btn ${timeframe === 'year' ? 'btn-primary fw-bold' : 'btn-outline-secondary'}`}
                  onClick={() => setTimeframe('year')}
                >
                  This Year
                </button>
                <button
                  type="button"
                  className={`btn ${timeframe === 'all' ? 'btn-primary fw-bold' : 'btn-outline-secondary'}`}
                  onClick={() => setTimeframe('all')}
                >
                  All Time
                </button>
              </div>
            </div>

            {/* Custom Dates */}
            <div className="col-md-3">
              <label className="form-label small fw-semibold text-secondary mb-1 d-block">
                Custom Date Range:
              </label>
              <div className="d-flex align-items-center gap-1">
                <input
                  type="date"
                  className="form-control form-control-sm"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setTimeframe('custom');
                  }}
                  title="From Date"
                />
                <span className="text-muted">–</span>
                <input
                  type="date"
                  className="form-control form-control-sm"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setTimeframe('custom');
                  }}
                  title="To Date"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="col-md-2">
              <label className="form-label small fw-semibold text-secondary mb-1 d-block">
                Loan Status:
              </label>
              <select
                className="form-select form-select-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Statuses</option>
                <option value="CHECKED_OUT">Active / In Field</option>
                <option value="RETURNED">Returned & Inspected</option>
                <option value="OVERDUE">Overdue Only</option>
                <option value="APPROVED">Approved (Pending Pickup)</option>
                <option value="PENDING">Pending Review</option>
              </select>
            </div>

            {/* Search */}
            <div className="col-md-2">
              <label className="form-label small fw-semibold text-secondary mb-1 d-block">
                Search:
              </label>
              <div className="input-group input-group-sm">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Borrower, project..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button className="btn btn-outline-secondary" type="button" onClick={() => setSearchTerm('')}>
                    <i className="bi bi-x"></i>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Loan Activity Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary spinner-border-sm"></div>
              <span className="text-muted small ms-2">Loading loan activity records...</span>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-calendar-x fs-2 text-secondary d-block mb-1"></i>
              No loan records found for the selected period.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light text-muted small">
                  <tr>
                    <th>Loan / Request #</th>
                    <th>Production Project</th>
                    <th>Borrower / Crew Lead</th>
                    <th>Equipment Dispatched</th>
                    <th>Loan Period</th>
                    <th>Status</th>
                    <th className="no-print text-end" style={{ width: '120px' }}>Invoice</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => {
                    const isOverdue = ['CHECKED_OUT', 'PARTIALLY_RETURNED'].includes(req.status) && new Date(req.endDate) < now;
                    return (
                      <tr key={req.id}>
                        <td>
                          <span className="fw-bold font-monospace text-dark d-block">
                            {req.requestNumber}
                          </span>
                          <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                            Created: {formatDate(req.createdAt)}
                          </span>
                        </td>

                        <td>
                          <div className="fw-semibold text-dark small text-truncate" style={{ maxWidth: '180px' }}>
                            {req.project?.title || 'Standalone Shoot'}
                          </div>
                          <div className="text-muted small d-flex align-items-center gap-1">
                            <i className="bi bi-geo-alt" style={{ fontSize: '0.7rem' }}></i>
                            <span className="text-truncate" style={{ maxWidth: '160px' }}>
                              {req.destination || req.project?.location || 'Studio Set'}
                            </span>
                          </div>
                        </td>

                        <td>
                          <div className="fw-bold text-dark small">{req.user?.name || '—'}</div>
                          <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                            {req.user?.department || 'Cinematography'} • {req.user?.email || ''}
                          </div>
                        </td>

                        <td>
                          <div className="d-flex flex-wrap gap-1" style={{ maxWidth: '280px' }}>
                            {(req.items || []).map((item, idx) => (
                              <span
                                key={idx}
                                className="badge bg-light text-dark border font-monospace"
                                style={{ fontSize: '0.68rem' }}
                                title={item.equipment?.name}
                              >
                                {item.equipment?.assetTag || 'ITEM'}
                              </span>
                            ))}
                            {(req.items || []).length === 0 && (
                              <span className="text-muted small">No items linked</span>
                            )}
                          </div>
                          <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                            {(req.items || []).length} equipment unit(s)
                          </small>
                        </td>

                        <td>
                          <div className="small font-monospace">
                            <span className="text-dark">{formatDate(req.startDate)}</span>
                            <i className="bi bi-arrow-right mx-1 text-muted"></i>
                            <span className={isOverdue ? 'text-danger fw-bold' : 'text-dark'}>
                              {formatDate(req.endDate)}
                            </span>
                          </div>
                          {req.actualReturnDate && (
                            <div className="text-success small" style={{ fontSize: '0.7rem' }}>
                              Returned: {formatDate(req.actualReturnDate)}
                            </div>
                          )}
                          {isOverdue && (
                            <div className="badge bg-danger-subtle text-danger border border-danger-subtle" style={{ fontSize: '0.65rem' }}>
                              <i className="bi bi-clock-history me-1"></i> Overdue
                            </div>
                          )}
                        </td>

                        <td>
                          <StatusBadge status={req.status} />
                        </td>

                        <td className="no-print text-end">
                          <button
                            type="button"
                            className="btn btn-outline-primary btn-sm py-1 px-2"
                            style={{ fontSize: '0.72rem' }}
                            onClick={() => {
                              setSelectedReqForInvoice(req);
                              setShowInvoiceModal(true);
                            }}
                            title="Generate Official Loan Invoice / Voucher"
                          >
                            <i className="bi bi-file-earmark-text me-1"></i> Invoice
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* OFFICIAL LOAN INVOICE / VOUCHER MODAL & PRINT PREVIEW */}
      {showInvoiceModal && selectedReqForInvoice && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)' }}>
          <div className="modal-dialog modal-dialog-centered modal-xl">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-slate-900 text-white no-print" style={{ backgroundColor: '#0f172a' }}>
                <div className="d-flex align-items-center gap-2">
                  <div className="p-2 rounded bg-primary-subtle text-primary d-flex align-items-center justify-content-center" style={{ width: 32, height: 32 }}>
                    <i className="bi bi-receipt"></i>
                  </div>
                  <div>
                    <h6 className="modal-title fw-bold text-white mb-0">Equipment Custody & Loan Invoice</h6>
                    <small className="text-secondary" style={{ fontSize: '0.72rem' }}>Official printable custody invoice for {selectedReqForInvoice.requestNumber}</small>
                  </div>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-primary btn-sm d-flex align-items-center gap-1"
                    onClick={() => window.print()}
                  >
                    <i className="bi bi-printer"></i> Print Invoice (PDF)
                  </button>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setShowInvoiceModal(false)}></button>
                </div>
              </div>

              {/* INVOICE BODY (Clean, printable A4 document) */}
              <div className="modal-body p-4 bg-white" id="printable-invoice">
                {/* Invoice Header */}
                <div className="d-flex justify-content-between align-items-start border-bottom pb-4 mb-4">
                  <div>
                    <h4 className="fw-bold text-dark mb-1">{settings.companyName || 'CineVault Media Production Studios'}</h4>
                    <p className="text-muted small mb-1">{settings.address || 'Studio Lot 4B, Media Arts District, CA'}</p>
                    <p className="text-muted small mb-0">
                      Phone: {settings.phone || '+1 (555) 019-2831'} • Email: {settings.email || 'operations@cinevault-studios.com'}
                    </p>
                    {settings.invoiceTaxId && (
                      <span className="badge bg-light text-secondary border font-monospace mt-2">
                        Tax ID: {settings.invoiceTaxId}
                      </span>
                    )}
                  </div>
                  <div className="text-end">
                    <span className="badge bg-dark fs-6 font-monospace mb-2">
                      INVOICE #{selectedReqForInvoice.requestNumber}
                    </span>
                    <div className="small text-muted">
                      <strong>Issue Date:</strong> {new Date().toLocaleDateString()}
                    </div>
                    <div className="small text-muted">
                      <strong>Status:</strong> {selectedReqForInvoice.status}
                    </div>
                  </div>
                </div>

                {/* Borrower & Production Metadata */}
                <div className="row g-3 p-3 bg-light rounded border mb-4">
                  <div className="col-md-6 border-end">
                    <h6 className="fw-bold text-secondary text-uppercase small mb-2">
                      <i className="bi bi-person-badge text-primary me-1"></i> Authorized Borrower (Custody Lead)
                    </h6>
                    <div className="fw-bold text-dark fs-6">{selectedReqForInvoice.user?.name || '—'}</div>
                    <div className="small text-muted">Department: <strong className="text-secondary">{selectedReqForInvoice.user?.department || 'Cinematography'}</strong></div>
                    <div className="small text-muted">Email: {selectedReqForInvoice.user?.email || '—'}</div>
                    <div className="small text-muted">Contact Phone: {selectedReqForInvoice.user?.phone || '+1 555-019-7711'}</div>
                  </div>

                  <div className="col-md-6 ps-md-4">
                    <h6 className="fw-bold text-secondary text-uppercase small mb-2">
                      <i className="bi bi-film text-primary me-1"></i> Production & Shoot Details
                    </h6>
                    <div className="fw-bold text-dark fs-6">{selectedReqForInvoice.project?.title || 'Production Assignment'}</div>
                    <div className="small text-muted">Project Code: <strong className="text-secondary font-monospace">{selectedReqForInvoice.project?.projectCode || 'PRJ-2026-X'}</strong></div>
                    <div className="small text-muted">Shoot Location: <strong>{selectedReqForInvoice.destination || selectedReqForInvoice.project?.location || 'Studio Stage'}</strong></div>
                    <div className="small text-muted">
                      Shoot Period: <strong className="text-dark">{formatDate(selectedReqForInvoice.startDate)}</strong> to <strong className="text-primary">{formatDate(selectedReqForInvoice.endDate)}</strong>
                    </div>
                  </div>
                </div>

                {/* Equipment Schedule Table */}
                <div className="mb-4">
                  <h6 className="fw-bold text-dark mb-2">Itemized Equipment & Serial Schedule</h6>
                  <div className="table-responsive border rounded">
                    <table className="table table-sm align-middle mb-0">
                      <thead className="table-light text-muted small">
                        <tr>
                          <th style={{ width: '40px' }}>#</th>
                          <th style={{ width: '100px' }}>Asset Tag</th>
                          <th>Equipment Description</th>
                          <th>Brand & Model</th>
                          <th>Serial Number</th>
                          <th className="text-center">Verified Condition</th>
                          <th className="text-end">Daily Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selectedReqForInvoice.items || []).map((item, idx) => (
                          <tr key={item.id || idx}>
                            <td className="small text-muted">{idx + 1}</td>
                            <td>
                              <span className="badge bg-dark font-monospace" style={{ fontSize: '0.72rem' }}>
                                {item.equipment?.assetTag || 'CAM-001'}
                              </span>
                            </td>
                            <td className="fw-bold text-dark small">
                              {item.equipment?.name || 'Cinema Equipment Item'}
                            </td>
                            <td className="small text-muted">
                              {item.equipment?.brand || 'Sony'} {item.equipment?.model || ''}
                            </td>
                            <td className="small font-monospace text-secondary">
                              {item.equipment?.serialNumber || 'SN-VERIFIED-OK'}
                            </td>
                            <td className="text-center">
                              <span className="badge bg-success-subtle text-success border border-success-subtle" style={{ fontSize: '0.68rem' }}>
                                {item.returnedCondition || 'EXCELLENT'}
                              </span>
                            </td>
                            <td className="text-end small font-monospace fw-semibold">
                              {formatCurrency(item.equipment?.dailyRate || 120)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Terms and Signatures */}
                <div className="p-3 bg-light border rounded mb-4">
                  <div className="fw-bold text-dark small mb-1">CUSTODY DECLARATION & RETURN POLICY</div>
                  <p className="text-muted small mb-0" style={{ fontSize: '0.75rem', lineHeight: 1.5 }}>
                    {settings.invoiceTerms ||
                      'The borrower acknowledges full custody and legal responsibility for all equipment listed herein. All items must be returned in their original flight cases with verified components. Any damaged optical sensors, missing cables, or body damage will be billed according to standard studio repair rates.'}
                  </p>
                </div>

                {/* Sign-off Blocks */}
                <div className="row g-4 pt-3">
                  <div className="col-6">
                    <div className="border-bottom pb-4 mb-2 text-center" style={{ minHeight: '60px' }}>
                      <span className="font-monospace text-muted small">[ Borrower Signature Acknowledgment ]</span>
                    </div>
                    <div className="text-center small">
                      <strong className="d-block text-dark">{selectedReqForInvoice.user?.name || 'Borrower'}</strong>
                      <span className="text-muted">Lead Cinematographer / Custody Holder</span>
                    </div>
                  </div>

                  <div className="col-6">
                    <div className="border-bottom pb-4 mb-2 text-center" style={{ minHeight: '60px' }}>
                      <span className="font-monospace text-muted small">[ Vault Officer Signature ]</span>
                    </div>
                    <div className="text-center small">
                      <strong className="d-block text-dark">{selectedReqForInvoice.approvedBy?.name || 'Studio Administrator'}</strong>
                      <span className="text-muted">{settings.invoiceAuthorizedSigner || 'Gear Vault Logistics Authority'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="modal-footer bg-light px-4 py-3 no-print">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowInvoiceModal(false)}>
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-primary px-4 fw-semibold"
                  onClick={() => window.print()}
                >
                  <i className="bi bi-printer me-1"></i> Print Invoice as PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;