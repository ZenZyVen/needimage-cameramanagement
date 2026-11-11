import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAuditLogs } from '../services/settingsService';
import { getUsers } from '../services/userService';
import { formatDateTime, formatDate } from '../utils/formatters';

const ACTION_TABS = [
  { id: 'ALL', label: 'All Records', icon: 'bi-archive-fill' },
  { id: 'BORROW', label: 'Borrowing', icon: 'bi-box-arrow-right' },
  { id: 'RETURN', label: 'Returning', icon: 'bi-box-arrow-in-left' },
  { id: 'STOCK', label: 'Stock Changes', icon: 'bi-boxes' },
  { id: 'APPROVAL', label: 'Approvals & Rejections', icon: 'bi-check2-circle' },
  { id: 'UPDATE', label: 'Record Updates', icon: 'bi-pencil-square' }
];

const HistoryRecords = () => {
  const { user, isAdmin, isStaff } = useAuth();
  const [records, setRecords] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [userFilter, setUserFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Detail Modal
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    loadRecords();
  }, [userFilter, startDate, endDate]);

  const loadUsers = async () => {
    try {
      const res = await getUsers();
      if (res.data?.data) setUsersList(res.data.data);
    } catch (e) {
      console.warn('Could not load users list:', e);
    }
  };

  const loadRecords = async () => {
    try {
      setLoading(true);
      const params = {
        limit: 300,
        userId: userFilter !== 'ALL' ? userFilter : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        search: searchTerm.trim() || undefined
      };
      const res = await getAuditLogs(params);
      if (res.data?.success) {
        setRecords(res.data.data || []);
      }
    } catch (err) {
      console.warn('Error loading history records:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadRecords();
  };

  // Determine category of action for tab filtering
  const matchesTab = (rec, tab) => {
    if (tab === 'ALL') return true;
    const action = (rec.action || '').toUpperCase();
    const entity = (rec.entity || '').toUpperCase();

    if (tab === 'BORROW') {
      return action.includes('CHECK_OUT') || (action.includes('REQUEST') && !action.includes('REJECT') && !action.includes('APPROVE'));
    }
    if (tab === 'RETURN') {
      return action.includes('CHECK_IN') || action.includes('RETURN');
    }
    if (tab === 'STOCK') {
      return action.includes('STOCK') || action.includes('RESTOCK') || action.includes('DEDUCT');
    }
    if (tab === 'APPROVAL') {
      return action.includes('APPROVE') || action.includes('REJECT');
    }
    if (tab === 'UPDATE') {
      return action.includes('UPDATE') || action.includes('EDIT') || action.includes('MODIFY');
    }
    return true;
  };

  const filteredRecords = records.filter(rec => {
    if (!matchesTab(rec, activeTab)) return false;

    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    const action = (rec.action || '').toLowerCase();
    const entity = (rec.entity || '').toLowerCase();
    const userName = (rec.user?.name || '').toLowerCase();
    const detailsStr = rec.details ? JSON.stringify(rec.details).toLowerCase() : '';

    return action.includes(q) || entity.includes(q) || userName.includes(q) || detailsStr.includes(q);
  });

  // Action badge helper
  const getActionInfo = (action = '') => {
    const act = action.toUpperCase();
    if (act.includes('CHECK_OUT') || act === 'CREATE_REQUEST') {
      return { label: 'BORROW', badgeClass: 'bg-primary text-white', icon: 'bi-box-arrow-right' };
    }
    if (act.includes('CHECK_IN') || act.includes('RETURN')) {
      return { label: 'RETURN', badgeClass: 'bg-success text-white', icon: 'bi-box-arrow-in-left' };
    }
    if (act.includes('RESTOCK')) {
      return { label: 'RESTOCK', badgeClass: 'bg-emerald text-white', style: { backgroundColor: '#059669' }, icon: 'bi-plus-circle-fill' };
    }
    if (act.includes('REDUCE') || act.includes('DEDUCT')) {
      return { label: 'STOCK DEDUCT', badgeClass: 'bg-warning text-dark', icon: 'bi-dash-circle-fill' };
    }
    if (act.includes('APPROVE')) {
      return { label: 'APPROVED', badgeClass: 'bg-info text-dark', icon: 'bi-check-circle-fill' };
    }
    if (act.includes('REJECT')) {
      return { label: 'REJECTED', badgeClass: 'bg-danger text-white', icon: 'bi-x-circle-fill' };
    }
    if (act.includes('UPDATE')) {
      return { label: 'RECORD UPDATE', badgeClass: 'bg-secondary text-white', icon: 'bi-pencil' };
    }
    if (act.includes('CREATE')) {
      return { label: 'CREATED', badgeClass: 'bg-slate-800 text-white', style: { backgroundColor: '#1e293b' }, icon: 'bi-plus-lg' };
    }
    return { label: act.replace(/_/g, ' '), badgeClass: 'bg-light text-dark border', icon: 'bi-circle' };
  };

  // Human-readable summary
  const getRecordDescription = (rec) => {
    const details = rec.details || {};
    const action = (rec.action || '').toUpperCase();

    if (action === 'CREATE_REQUEST') {
      return `Submitted borrow request #${details.requestNumber || rec.entityId || ''} (${details.itemsCount || 1} item(s))`;
    }
    if (action === 'APPROVE_REQUEST') {
      return `Approved borrow requisition #${details.requestNumber || rec.entityId || ''}`;
    }
    if (action === 'REJECT_REQUEST') {
      return `Rejected requisition #${details.requestNumber || rec.entityId || ''}: "${details.reason || 'Not approved'}"`;
    }
    if (action === 'CHECK_OUT') {
      return `Handed over ${details.itemsCount || 1} item(s) to ${details.borrower || 'crew lead'}`;
    }
    if (action === 'CHECK_IN') {
      return `Verified return inspection of ${details.itemsCount || 1} item(s) from ${details.borrower || 'crew lead'}`;
    }
    if (action === 'RESTOCK_EQUIPMENT') {
      return `Restocked +${details.delta || ''} units of [${details.assetTag || ''}] ${details.name || ''} (New Avail: ${details.newAvailable || ''})`;
    }
    if (action === 'REDUCE_STOCK') {
      return `Deducted ${details.delta || ''} units of [${details.assetTag || ''}] ${details.name || ''}`;
    }
    if (action === 'UPDATE_EQUIPMENT') {
      return `Updated equipment records for [${details.assetTag || ''}] ${details.name || ''}`;
    }
    if (action.includes('PROJECT')) {
      return `${action.replace(/_/g, ' ')} for project "${details.title || rec.entityId || ''}"`;
    }
    return `${action.replace(/_/g, ' ')} on ${rec.entity || 'System'} #${rec.entityId || ''}`;
  };

  // CSV Export
  const handleExportCSV = () => {
    if (filteredRecords.length === 0) return;
    const headers = ['Date & Time', 'Action Type', 'User / Actor', 'Role', 'Target Entity', 'Summary Details', 'IP Address'];
    const rows = filteredRecords.map(r => [
      formatDateTime(r.createdAt),
      r.action || 'ACTION',
      `"${(r.user?.name || 'System').replace(/"/g, '""')}"`,
      r.user?.role || 'SYSTEM',
      r.entity || 'System',
      `"${getRecordDescription(r).replace(/"/g, '""')}"`,
      r.ipAddress || '127.0.0.1'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `History_Records_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Set quick date preset
  const setQuickDate = (preset) => {
    const now = new Date();
    if (preset === 'today') {
      const d = now.toISOString().substring(0, 10);
      setStartDate(d);
      setEndDate(d);
    } else if (preset === 'week') {
      const past = new Date(now.getTime() - 7 * 86400000).toISOString().substring(0, 10);
      setStartDate(past);
      setEndDate(now.toISOString().substring(0, 10));
    } else if (preset === 'month') {
      const past = new Date(now.getTime() - 30 * 86400000).toISOString().substring(0, 10);
      setStartDate(past);
      setEndDate(now.toISOString().substring(0, 10));
    } else if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    }
  };

  return (
    <div className="pb-5">
      {/* Top Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-2">
        <div>
          <h4 className="fw-bold text-dark mb-0">History Records</h4>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1 shadow-sm px-3"
            onClick={loadRecords}
          >
            <i className="bi bi-arrow-clockwise"></i>
            <span>Refresh</span>
          </button>
          <button
            type="button"
            className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1 shadow-sm px-3"
            onClick={handleExportCSV}
            disabled={filteredRecords.length === 0}
          >
            <i className="bi bi-download"></i>
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-3">
              <span className="text-muted small fw-semibold text-uppercase">Total Records</span>
              <div className="fs-4 fw-bold text-dark mt-1">{records.length}</div>
              <small className="text-secondary">Historical entries stored</small>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-3">
              <span className="text-muted small fw-semibold text-uppercase">Loans & Handovers</span>
              <div className="fs-4 fw-bold text-primary mt-1">
                {records.filter(r => matchesTab(r, 'BORROW') || matchesTab(r, 'RETURN')).length}
              </div>
              <small className="text-secondary">Borrow & return events</small>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-3">
              <span className="text-muted small fw-semibold text-uppercase">Stock Adjustments</span>
              <div className="fs-4 fw-bold text-success mt-1">
                {records.filter(r => matchesTab(r, 'STOCK')).length}
              </div>
              <small className="text-secondary">Restocks and deductions</small>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-3">
              <span className="text-muted small fw-semibold text-uppercase">Approvals & Reviews</span>
              <div className="fs-4 fw-bold text-dark mt-1">
                {records.filter(r => matchesTab(r, 'APPROVAL')).length}
              </div>
              <small className="text-secondary">Admin review decisions</small>
            </div>
          </div>
        </div>
      </div>

      {/* Action Category Tabs */}
      <div className="d-flex align-items-center gap-1 overflow-auto mb-3 pb-1" style={{ whiteSpace: 'nowrap' }}>
        {ACTION_TABS.map(tab => {
          const isActive = activeTab === tab.id;
          const count = records.filter(r => matchesTab(r, tab.id)).length;
          return (
            <button
              key={tab.id}
              type="button"
              className={`btn btn-sm d-flex align-items-center gap-2 py-2 px-3 rounded-pill ${
                isActive ? 'btn-primary text-white shadow-xs fw-semibold' : 'btn-light text-secondary border'
              }`}
              style={{ fontSize: '0.8rem' }}
              onClick={() => setActiveTab(tab.id)}
            >
              <i className={`bi ${tab.icon}`}></i>
              <span>{tab.label}</span>
              <span className={`badge rounded-pill ${isActive ? 'bg-white text-primary' : 'bg-secondary text-white'}`} style={{ fontSize: '0.65rem' }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter Toolbar */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-3">
          <form onSubmit={handleSearchSubmit} className="row g-2 align-items-center">
            {/* Search */}
            <div className="col-md-4">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-white"><i className="bi bi-search text-muted"></i></span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search user, action, gear tag, or keyword..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button type="button" className="btn btn-outline-secondary" onClick={() => { setSearchTerm(''); loadRecords(); }}>
                    <i className="bi bi-x"></i>
                  </button>
                )}
              </div>
            </div>

            {/* User Filter */}
            <div className="col-md-3">
              <select
                className="form-select form-select-sm"
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
              >
                <option value="ALL">All Team Members</option>
                {usersList.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                ))}
              </select>
            </div>

            {/* Date Range & Presets */}
            <div className="col-md-5 d-flex align-items-center gap-1">
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
              <div className="btn-group btn-group-sm ms-1">
                <button type="button" className="btn btn-outline-secondary px-2" onClick={() => setQuickDate('today')}>Today</button>
                <button type="button" className="btn btn-outline-secondary px-2" onClick={() => setQuickDate('week')}>7d</button>
                <button type="button" className="btn btn-outline-secondary px-2" onClick={() => setQuickDate('all')}>All</button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Records Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary spinner-border-sm"></div>
              <span className="text-muted small ms-2">Loading historical records...</span>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-clock-history fs-2 text-secondary d-block mb-1"></i>
              No historical records found matching your filter criteria.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light text-muted small">
                  <tr>
                    <th style={{ width: '160px' }}>Date & Time</th>
                    <th style={{ width: '140px' }}>Action Type</th>
                    <th>User / Responsible Staff</th>
                    <th>Record Description</th>
                    <th className="text-end" style={{ width: '90px' }}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map(rec => {
                    const info = getActionInfo(rec.action);
                    const userName = rec.user?.name || 'System / Automated';
                    const userRole = rec.user?.role || 'SYSTEM';

                    return (
                      <tr key={rec.id}>
                        <td className="small text-nowrap font-monospace text-secondary">
                          {formatDateTime(rec.createdAt)}
                        </td>

                        <td>
                          <span
                            className={`badge ${info.badgeClass} d-inline-flex align-items-center gap-1`}
                            style={{ fontSize: '0.68rem', ...info.style }}
                          >
                            <i className={`bi ${info.icon}`}></i>
                            {info.label}
                          </span>
                        </td>

                        <td>
                          <div className="fw-semibold text-dark small">{userName}</div>
                          <div className="d-flex align-items-center gap-1">
                            <span className="badge bg-light text-muted border" style={{ fontSize: '0.62rem' }}>
                              {userRole}
                            </span>
                            {rec.user?.department && (
                              <span className="text-muted" style={{ fontSize: '0.68rem' }}>• {rec.user.department}</span>
                            )}
                          </div>
                        </td>

                        <td className="small text-dark">
                          <div>{getRecordDescription(rec)}</div>
                          <div className="text-muted font-monospace" style={{ fontSize: '0.7rem' }}>
                            Entity: {rec.entity} {rec.entityId ? `#${rec.entityId}` : ''}
                          </div>
                        </td>

                        <td className="text-end">
                          <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm py-0 px-2"
                            style={{ fontSize: '0.72rem' }}
                            onClick={() => {
                              setSelectedRecord(rec);
                              setShowModal(true);
                            }}
                          >
                            Inspect
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

      {/* Record Inspect Modal */}
      {showModal && selectedRecord && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header py-2 px-3 bg-light border-bottom">
                <h6 className="modal-title fw-bold text-dark mb-0">
                  <i className="bi bi-clock-history text-primary me-2"></i>
                  Historical Audit Record #{selectedRecord.id}
                </h6>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>

              <div className="modal-body p-3">
                <div className="p-3 border rounded bg-light mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className={`badge ${getActionInfo(selectedRecord.action).badgeClass}`}>
                      {selectedRecord.action}
                    </span>
                    <span className="small text-muted font-monospace">{formatDateTime(selectedRecord.createdAt)}</span>
                  </div>
                  <div className="fw-bold text-dark fs-6">{getRecordDescription(selectedRecord)}</div>
                </div>

                <div className="row g-2 mb-3">
                  <div className="col-md-6">
                    <div className="p-2 border rounded">
                      <span className="text-muted small">Responsible Actor:</span>
                      <div className="fw-bold text-dark small">{selectedRecord.user?.name || 'System'} ({selectedRecord.user?.role || 'SYSTEM'})</div>
                      <div className="text-muted small">{selectedRecord.user?.email || 'N/A'}</div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="p-2 border rounded">
                      <span className="text-muted small">Target Entity:</span>
                      <div className="fw-bold text-dark small">{selectedRecord.entity} #{selectedRecord.entityId || 'N/A'}</div>
                      <div className="text-muted small">IP: {selectedRecord.ipAddress || '127.0.0.1'}</div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-muted small fw-semibold">Recorded Payload / Metadata (JSON):</label>
                  <pre className="p-3 rounded bg-slate-900 text-slate-100 font-monospace small mb-0" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {JSON.stringify(selectedRecord.details || {}, null, 2)}
                  </pre>
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

export default HistoryRecords;
