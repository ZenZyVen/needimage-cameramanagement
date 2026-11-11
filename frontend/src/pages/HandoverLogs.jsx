import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDashboardStats } from '../services/dashboardService';
import { formatDateTime, formatDate } from '../utils/formatters';

const HandoverLogs = () => {
  const { user, isAdmin, isStaff } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL'); // ALL, CHECK_OUT, CHECK_IN
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Inspection modal
  const [selectedLog, setSelectedLog] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadHandoverLogs();
  }, []);

  const loadHandoverLogs = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await getDashboardStats({ timeframe: 'all' });
      if (res.data?.success && res.data.recentActivity) {
        setLogs(res.data.recentActivity || []);
      }
    } catch (err) {
      setErrorMsg('Failed to load handover and return logs.');
    } finally {
      setLoading(false);
    }
  };

  // Filter in-memory
  const filteredLogs = logs.filter(item => {
    if (typeFilter !== 'ALL' && item.type !== typeFilter) return false;

    if (startDate) {
      const logDate = new Date(item.actionDate || item.createdAt);
      if (logDate < new Date(startDate)) return false;
    }
    if (endDate) {
      const logDate = new Date(item.actionDate || item.createdAt);
      const e = new Date(endDate);
      e.setHours(23, 59, 59, 999);
      if (logDate > e) return false;
    }

    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    const tag = (item.equipment?.assetTag || '').toLowerCase();
    const gearName = (item.equipment?.name || '').toLowerCase();
    const borrower = (item.borrowerName || '').toLowerCase();
    const handler = (item.handledBy?.name || '').toLowerCase();
    const notes = (item.notes || '').toLowerCase();

    return tag.includes(q) || gearName.includes(q) || borrower.includes(q) || handler.includes(q) || notes.includes(q);
  });

  const checkoutsCount = logs.filter(l => l.type === 'CHECK_OUT').length;
  const returnsCount = logs.filter(l => l.type === 'CHECK_IN').length;

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return;
    const headers = ['Action Type', 'Date & Time', 'Asset Tag', 'Equipment Name', 'Borrower', 'Handled By', 'Notes'];
    const rows = filteredLogs.map(l => [
      l.type === 'CHECK_OUT' ? 'HANDOVER / CHECKOUT' : 'RETURN INSPECTION',
      formatDateTime(l.actionDate || l.createdAt),
      l.equipment?.assetTag || 'N/A',
      `"${(l.equipment?.name || '').replace(/"/g, '""')}"`,
      `"${(l.borrowerName || '').replace(/"/g, '""')}"`,
      `"${(l.handledBy?.name || 'Vault Tech').replace(/"/g, '""')}"`,
      `"${(l.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Handover_Return_Logs_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="pb-5">
      {/* Top Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-2">
        <div>
          <h4 className="fw-bold text-dark mb-0">Handover & Return Logs</h4>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1 shadow-sm px-3"
            onClick={loadHandoverLogs}
          >
            <i className="bi bi-arrow-clockwise"></i>
            <span>Refresh</span>
          </button>
          <button
            type="button"
            className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1 shadow-sm px-3"
            onClick={handleExportCSV}
            disabled={filteredLogs.length === 0}
          >
            <i className="bi bi-download"></i>
            <span>Export CSV</span>
          </button>
          <Link to="/checkin-out" className="btn btn-primary btn-sm d-flex align-items-center gap-1 shadow-sm px-3">
            <i className="bi bi-arrow-left-right"></i>
            <span>Checkout / Check-in</span>
          </Link>
        </div>
      </div>

      {errorMsg && (
        <div className="alert alert-danger py-2 small mb-4 shadow-sm">
          <i className="bi bi-exclamation-triangle me-1"></i> {errorMsg}
        </div>
      )}

      {/* KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-3">
              <span className="text-muted small fw-semibold text-uppercase">Total Operations</span>
              <div className="fs-4 fw-bold text-dark mt-1">{logs.length}</div>
              <small className="text-secondary">Logged transactions</small>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-3">
              <span className="text-muted small fw-semibold text-uppercase">Handovers / Checkouts</span>
              <div className="fs-4 fw-bold text-primary mt-1">{checkoutsCount}</div>
              <small className="text-secondary">Equipment issued to crew</small>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-3">
              <span className="text-muted small fw-semibold text-uppercase">Return Inspections</span>
              <div className="fs-4 fw-bold text-success mt-1">{returnsCount}</div>
              <small className="text-secondary">Vault check-ins verified</small>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-3">
              <span className="text-muted small fw-semibold text-uppercase">Current Filter Count</span>
              <div className="fs-4 fw-bold text-dark mt-1">{filteredLogs.length}</div>
              <small className="text-secondary">Matching active search</small>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-3">
          <div className="row g-2 align-items-center">
            {/* Search */}
            <div className="col-md-5">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-white"><i className="bi bi-search text-muted"></i></span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search gear, asset tag, borrower, or vault tech..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setSearchTerm('')}>
                    <i className="bi bi-x"></i>
                  </button>
                )}
              </div>
            </div>

            {/* Type filter */}
            <div className="col-md-3">
              <select
                className="form-select form-select-sm"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="ALL">All Operations (Handovers & Returns)</option>
                <option value="CHECK_OUT">Handovers / Checkouts Only</option>
                <option value="CHECK_IN">Return Inspections Only</option>
              </select>
            </div>

            {/* Date Range */}
            <div className="col-md-4 d-flex align-items-center gap-1">
              <input
                type="date"
                className="form-control form-control-sm"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                title="Start Date"
              />
              <span className="text-muted small">–</span>
              <input
                type="date"
                className="form-control form-control-sm"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                title="End Date"
              />
              {(startDate || endDate) && (
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => { setStartDate(''); setEndDate(''); }}
                  title="Clear Dates"
                >
                  <i className="bi bi-x-circle"></i>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary spinner-border-sm"></div>
              <span className="text-muted small ms-2">Loading handover records...</span>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-journal-x fs-2 text-secondary d-block mb-1"></i>
              No handover or return records match your search criteria.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light text-muted small">
                  <tr>
                    <th>Date & Time</th>
                    <th>Type</th>
                    <th>Equipment Details</th>
                    <th>Borrower</th>
                    <th>Vault Staff</th>
                    <th>Condition / Notes</th>
                    <th className="text-end">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map(log => {
                    const isCheckout = log.type === 'CHECK_OUT';
                    return (
                      <tr key={log.id}>
                        <td className="small text-nowrap font-monospace text-secondary">
                          {formatDateTime(log.actionDate || log.createdAt)}
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              isCheckout ? 'bg-primary text-white' : 'bg-success text-white'
                            }`}
                            style={{ fontSize: '0.7rem' }}
                          >
                            <i className={`bi ${isCheckout ? 'bi-box-arrow-right me-1' : 'bi-box-arrow-in-left me-1'}`}></i>
                            {isCheckout ? 'HANDOVER' : 'RETURN'}
                          </span>
                        </td>
                        <td>
                          <div className="fw-bold text-dark small">
                            {log.equipment?.assetTag || 'GEAR-TAG'}
                          </div>
                          <div className="text-muted small text-truncate" style={{ maxWidth: '240px' }}>
                            {log.equipment?.name || 'Equipment'}
                          </div>
                        </td>
                        <td>
                          <div className="fw-semibold text-dark small">{log.borrowerName || 'Staff Lead'}</div>
                          <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                            {log.borrowerSignature ? '✓ Signed on handover' : 'Standard issue'}
                          </div>
                        </td>
                        <td>
                          <div className="small text-dark">{log.handledBy?.name || 'Vault Tech'}</div>
                          <div className="text-muted" style={{ fontSize: '0.7rem' }}>Authorized Staff</div>
                        </td>
                        <td>
                          <div className="small text-secondary text-truncate" style={{ maxWidth: '200px' }} title={log.notes || 'No special notes'}>
                            {log.notes || '—'}
                          </div>
                          {log.condition && (
                            <span className="badge bg-light text-dark border" style={{ fontSize: '0.65rem' }}>
                              Condition: {log.condition}
                            </span>
                          )}
                        </td>
                        <td className="text-end">
                          <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm py-0 px-2"
                            style={{ fontSize: '0.72rem' }}
                            onClick={() => {
                              setSelectedLog(log);
                              setShowModal(true);
                            }}
                          >
                            View
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

      {/* Details Modal */}
      {showModal && selectedLog && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header py-2 px-3 bg-light border-bottom">
                <h6 className="modal-title fw-bold text-dark mb-0">
                  <i className="bi bi-file-earmark-text text-primary me-2"></i>
                  Handover Log #{selectedLog.id}
                </h6>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setShowModal(false)}
                  aria-label="Close"
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>
              <div className="modal-body p-3">
                <div className="p-3 border rounded bg-light mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className={`badge ${selectedLog.type === 'CHECK_OUT' ? 'bg-primary' : 'bg-success'}`}>
                      {selectedLog.type === 'CHECK_OUT' ? 'EQUIPMENT HANDOVER' : 'RETURN INSPECTION'}
                    </span>
                    <span className="small text-muted font-monospace">{formatDateTime(selectedLog.actionDate || selectedLog.createdAt)}</span>
                  </div>
                  <div className="fw-bold text-dark fs-6">{selectedLog.equipment?.assetTag} - {selectedLog.equipment?.name}</div>
                </div>

                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <div className="p-2 border rounded">
                      <div className="text-muted small">Borrower:</div>
                      <div className="fw-bold text-dark small">{selectedLog.borrowerName || 'Staff Lead'}</div>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="p-2 border rounded">
                      <div className="text-muted small">Handled By:</div>
                      <div className="fw-bold text-dark small">{selectedLog.handledBy?.name || 'Vault Tech'}</div>
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="text-muted small fw-semibold">Condition Assessment:</label>
                  <div className="p-2 border rounded bg-white small">
                    {selectedLog.condition || 'Inspected Good Condition'}
                  </div>
                </div>

                <div>
                  <label className="text-muted small fw-semibold">Notes & Remarks:</label>
                  <div className="p-2 border rounded bg-white small">
                    {selectedLog.notes || 'No remarks recorded.'}
                  </div>
                </div>
              </div>
              <div className="modal-footer py-2 px-3 bg-light border-top">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HandoverLogs;
