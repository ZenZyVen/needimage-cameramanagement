import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAuditLogs } from '../services/settingsService';
import { getUsers } from '../services/userService';
import { formatDateTime } from '../utils/formatters';

const ACTION_CATEGORIES = [
  { value: 'ALL', label: 'All Action Categories' },
  { value: 'PROJECT', label: 'Projects (Create, Edit, Delete, Crew)' },
  { value: 'EQUIPMENT', label: 'Equipment & Vault (Add, Edit, Delete)' },
  { value: 'STOCK', label: 'Stock Operations (Restock, Deduct)' },
  { value: 'LOAN', label: 'Borrow Requests & Approvals' },
  { value: 'CHECK', label: 'Checkout & Return Logistics' },
  { value: 'MAINTENANCE', label: 'Maintenance & Service Tickets' },
  { value: 'SETTINGS', label: 'Settings & Invoices' },
  { value: 'AUTH', label: 'Authentication & Profile' }
];

const ActivityLog = () => {
  const { user, isAdmin } = useAuth();
  const [logs, setLogs] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [userFilter, setUserFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Selected Log for JSON inspector
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    loadLogs();
  }, [categoryFilter, userFilter, startDate, endDate]);

  const loadUsers = async () => {
    try {
      const res = await getUsers();
      if (res.data?.data) setUsersList(res.data.data);
    } catch (e) {
      console.warn('Could not load users for activity filter:', e);
    }
  };

  const loadLogs = async () => {
    try {
      setLoading(true);
      const params = {
        limit: 200,
        userId: userFilter !== 'ALL' ? userFilter : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        search: searchTerm.trim() || undefined
      };
      const res = await getAuditLogs(params);
      if (res.data?.success) {
        setLogs(res.data.data || []);
      }
    } catch (e) {
      console.warn('Failed to load audit logs:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadLogs();
  };

  // Filter logs by category in-memory for flexible matching
  const filteredLogs = logs.filter(l => {
    if (categoryFilter === 'ALL') return true;
    const action = (l.action || '').toUpperCase();
    const entity = (l.entity || '').toUpperCase();

    if (categoryFilter === 'PROJECT') {
      return action.includes('PROJECT') || entity.includes('PROJECT');
    }
    if (categoryFilter === 'EQUIPMENT') {
      return (action.includes('EQUIPMENT') || entity.includes('EQUIPMENT')) && !action.includes('STOCK') && !action.includes('RESTOCK');
    }
    if (categoryFilter === 'STOCK') {
      return action.includes('STOCK') || action.includes('RESTOCK') || action.includes('ADJUST') || action.includes('DEDUCT');
    }
    if (categoryFilter === 'LOAN') {
      return action.includes('REQUEST') || entity.includes('BORROW');
    }
    if (categoryFilter === 'CHECK') {
      return action.includes('CHECK_OUT') || action.includes('CHECK_IN') || entity.includes('CHECK');
    }
    if (categoryFilter === 'MAINTENANCE') {
      return action.includes('MAINTENANCE') || entity.includes('MAINTENANCE');
    }
    if (categoryFilter === 'SETTINGS') {
      return action.includes('SETTING') || entity.includes('SETTING');
    }
    if (categoryFilter === 'AUTH') {
      return action.includes('LOGIN') || action.includes('REGISTER') || action.includes('USER');
    }
    return true;
  });

  const getActionBadgeClass = (action = '') => {
    const a = action.toUpperCase();
    if (a.includes('CREATE') || a.includes('APPROVE') || a.includes('RESTOCK') || a.includes('RESTORE')) {
      return 'bg-success-subtle text-success border border-success-subtle';
    }
    if (a.includes('DELETE') || a.includes('REJECT') || a.includes('DEDUCT') || a.includes('WRITE_OFF')) {
      return 'bg-danger-subtle text-danger border border-danger-subtle';
    }
    if (a.includes('CHECK_OUT') || a.includes('SUBMIT') || a.includes('UPDATE')) {
      return 'bg-primary-subtle text-primary border border-primary-subtle';
    }
    if (a.includes('CHECK_IN')) {
      return 'bg-info-subtle text-info border border-info-subtle';
    }
    return 'bg-secondary-subtle text-secondary border';
  };

  const formatActionName = (action = '') => {
    return action.replace(/_/g, ' ');
  };

  const getHumanDescription = (log) => {
    const details = log.details || {};
    if (details.message) return details.message;
    if (log.action === 'CREATE_PROJECT') {
      return `Created production project "${details.title || log.entityId}" (${details.projectCode || ''})`;
    }
    if (log.action === 'SUBMIT_REQUEST') {
      return `Submitted loan requisition for ${details.purpose || 'film shoot'}`;
    }
    if (log.action === 'APPROVE_REQUEST') {
      return `Approved equipment borrow request ${details.requestNumber || log.entityId}`;
    }
    if (log.action === 'RESTOCK_EQUIPMENT') {
      return `Restocked +${details.delta || ''} units of ${details.name || details.assetTag || ''}`;
    }
    if (log.action === 'REDUCE_STOCK') {
      return `Deducted ${details.delta || ''} units from ${details.name || details.assetTag || ''} (${details.reason || 'write-off'})`;
    }
    if (log.action === 'CHECK_OUT') {
      return `Checked out equipment to ${details.borrower || 'crew lead'}`;
    }
    if (log.action === 'CHECK_IN') {
      return `Returned & inspected gear into vault`;
    }
    if (log.action === 'REPORT_MAINTENANCE') {
      return `Reported service ticket for ${details.assetTag || ''}: ${details.issue || ''}`;
    }
    if (log.action === 'UPDATE_SETTINGS') {
      return `Updated system configuration (${(details.updatedKeys || []).join(', ')})`;
    }
    return details.name || details.title || JSON.stringify(details);
  };

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return;
    const headers = ['Timestamp', 'User Name', 'User Email', 'User Role', 'Action', 'Entity', 'Entity ID', 'Description', 'IP Address'];
    const rows = filteredLogs.map(l => [
      new Date(l.createdAt).toLocaleString(),
      `"${(l.user?.name || 'System').replace(/"/g, '""')}"`,
      `"${(l.user?.email || '—').replace(/"/g, '""')}"`,
      l.user?.role || 'SYSTEM',
      l.action,
      l.entity,
      l.entityId || '—',
      `"${getHumanDescription(l).replace(/"/g, '""')}"`,
      l.ipAddress || '127.0.0.1'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `cinevault-activity-log-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="pb-5">
      {/* Top Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-2">
        <div>
          <div className="d-flex align-items-center gap-2">
            <h4 className="fw-bold text-dark mb-0">System Activity & Audit Log</h4>
            <span className="badge bg-slate-900 text-white font-monospace small px-2 py-1">
              Admin Audit Trail
            </span>
          </div>
          <p className="text-muted small mb-0 mt-1">
            Complete historical record of user activities, project modifications, equipment loans, vault movements, and administrative events.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1 shadow-sm px-3"
            onClick={loadLogs}
          >
            <i className="bi bi-arrow-clockwise"></i>
            <span>Refresh</span>
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm d-flex align-items-center gap-1 shadow-sm px-3 fw-semibold"
            onClick={handleExportCSV}
            disabled={filteredLogs.length === 0}
          >
            <i className="bi bi-download"></i>
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-3">
              <span className="text-muted small d-block">Total Recorded Events</span>
              <h3 className="fw-bold text-dark mb-0 mt-1">{filteredLogs.length}</h3>
              <span className="text-muted" style={{ fontSize: '0.72rem' }}>in current view</span>
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm h-100 border-start border-primary border-3">
            <div className="card-body p-3">
              <span className="text-muted small d-block">Loan & Vault Events</span>
              <h3 className="fw-bold text-primary mb-0 mt-1">
                {logs.filter(l => l.action.includes('REQUEST') || l.action.includes('CHECK')).length}
              </h3>
              <span className="text-muted" style={{ fontSize: '0.72rem' }}>requisitions & handovers</span>
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm h-100 border-start border-success border-3">
            <div className="card-body p-3">
              <span className="text-muted small d-block">Stock Changes Logged</span>
              <h3 className="fw-bold text-success mb-0 mt-1">
                {logs.filter(l => l.action.includes('STOCK') || l.action.includes('RESTOCK') || l.action.includes('REDUCE')).length}
              </h3>
              <span className="text-muted" style={{ fontSize: '0.72rem' }}>inventory adjustments</span>
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm h-100 border-start border-warning border-3">
            <div className="card-body p-3">
              <span className="text-muted small d-block">Project & Setup Actions</span>
              <h3 className="fw-bold text-warning mb-0 mt-1">
                {logs.filter(l => l.action.includes('PROJECT') || l.action.includes('SETTING')).length}
              </h3>
              <span className="text-muted" style={{ fontSize: '0.72rem' }}>administrative modifications</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-3">
          <form onSubmit={handleSearchSubmit} className="row g-2 align-items-center">
            <div className="col-md-4">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-white"><i className="bi bi-search text-muted"></i></span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search user, action, project, or keyword..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => { setSearchTerm(''); loadLogs(); }}
                  >
                    <i className="bi bi-x"></i>
                  </button>
                )}
              </div>
            </div>

            <div className="col-md-3">
              <select
                className="form-select form-select-sm"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                {ACTION_CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div className="col-md-2">
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

            <div className="col-md-3 d-flex align-items-center gap-1">
              <input
                type="date"
                className="form-control form-control-sm"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                title="From Date"
              />
              <span className="text-muted small">–</span>
              <input
                type="date"
                className="form-control form-control-sm"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                title="To Date"
              />
              <button type="submit" className="btn btn-primary btn-sm px-2">
                <i className="bi bi-funnel-fill"></i>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Activity Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary spinner-border-sm"></div>
              <span className="text-muted small ms-2">Loading system activity records...</span>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-journal-check fs-2 text-secondary d-block mb-1"></i>
              No activity logs match your filter criteria.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light text-muted small">
                  <tr>
                    <th style={{ width: '170px' }}>Timestamp</th>
                    <th>User / Actor</th>
                    <th>Action</th>
                    <th>Target Entity</th>
                    <th>Activity Summary</th>
                    <th>IP Address</th>
                    <th className="text-end" style={{ width: '80px' }}>Inspect</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map(log => {
                    const actorName = log.user?.name || 'System / Automated';
                    const actorRole = log.user?.role || 'SYSTEM';
                    const actorEmail = log.user?.email || '—';

                    return (
                      <tr key={log.id}>
                        <td className="small text-nowrap font-monospace text-secondary">
                          {formatDateTime(log.createdAt)}
                        </td>

                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div
                              className="rounded-circle bg-slate-800 text-white d-flex align-items-center justify-content-center fw-bold"
                              style={{ width: '32px', height: '32px', fontSize: '0.75rem', backgroundColor: '#1e293b' }}
                            >
                              {actorName.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="fw-bold text-dark small">{actorName}</div>
                              <div className="d-flex align-items-center gap-1">
                                <span className={`badge ${actorRole === 'ADMIN' ? 'bg-danger text-white' : actorRole === 'STOCK_CONTROLLER' ? 'bg-warning text-dark' : 'bg-primary text-white'}`} style={{ fontSize: '0.62rem', padding: '1px 5px' }}>
                                  {actorRole}
                                </span>
                                <span className="text-muted" style={{ fontSize: '0.7rem' }}>{actorEmail}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className={`badge ${getActionBadgeClass(log.action)} font-monospace`} style={{ fontSize: '0.72rem' }}>
                            {formatActionName(log.action)}
                          </span>
                        </td>

                        <td>
                          <div className="d-flex align-items-center gap-1">
                            <span className="badge bg-light text-dark border small">
                              {log.entity}
                            </span>
                            {log.entityId && (
                              <span className="font-monospace text-secondary small" style={{ fontSize: '0.72rem' }}>
                                #{log.entityId}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="small text-dark text-truncate" style={{ maxWidth: '300px' }} title={getHumanDescription(log)}>
                          {getHumanDescription(log)}
                        </td>

                        <td className="small font-monospace text-muted">
                          {log.ipAddress || '127.0.0.1'}
                        </td>

                        <td className="text-end">
                          <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm py-0 px-2"
                            style={{ fontSize: '0.72rem' }}
                            onClick={() => {
                              setSelectedLog(log);
                              setShowDetailModal(true);
                            }}
                            title="Inspect Raw JSON Metadata"
                          >
                            <i className="bi bi-code-slash me-1"></i> View
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

      {/* INSPECT LOG DETAIL MODAL */}
      {showDetailModal && selectedLog && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-slate-900 text-white" style={{ backgroundColor: '#0f172a' }}>
                <div className="d-flex align-items-center gap-2">
                  <span className={`badge ${getActionBadgeClass(selectedLog.action)}`}>
                    {selectedLog.action}
                  </span>
                  <h6 className="modal-title fw-bold text-white mb-0">Event Inspector #{selectedLog.id}</h6>
                </div>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowDetailModal(false)}></button>
              </div>

              <div className="modal-body p-4">
                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="text-muted small d-block">Timestamp</label>
                    <strong className="text-dark small font-monospace">{new Date(selectedLog.createdAt).toUTCString()}</strong>
                  </div>
                  <div className="col-md-6">
                    <label className="text-muted small d-block">Actor / User</label>
                    <strong className="text-dark small">{selectedLog.user?.name || 'System'} ({selectedLog.user?.role || 'SYSTEM'})</strong>
                  </div>
                  <div className="col-md-6">
                    <label className="text-muted small d-block">Target Entity & ID</label>
                    <strong className="text-dark small">{selectedLog.entity} {selectedLog.entityId ? `(#${selectedLog.entityId})` : ''}</strong>
                  </div>
                  <div className="col-md-6">
                    <label className="text-muted small d-block">Origin IP / Host</label>
                    <span className="font-monospace small text-secondary">{selectedLog.ipAddress || '127.0.0.1'}</span>
                  </div>
                </div>

                <div className="mb-2">
                  <label className="text-muted small fw-semibold">Metadata & Payload Details (JSON)</label>
                  <pre className="p-3 bg-dark text-light rounded font-monospace small" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                    {JSON.stringify(selectedLog.details || {}, null, 2)}
                  </pre>
                </div>
              </div>

              <div className="modal-footer bg-light px-4 py-3">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowDetailModal(false)}>
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

export default ActivityLog;