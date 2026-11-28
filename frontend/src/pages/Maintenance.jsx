import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getMaintenanceTickets,
  createMaintenanceTicket,
  updateMaintenanceTicket,
  resolveMaintenanceTicket,
  deleteMaintenanceTicket
} from '../services/maintenanceService';
import MaintenanceFormModal from '../components/maintenance/MaintenanceFormModal';
import MaintenanceResolveModal from '../components/maintenance/MaintenanceResolveModal';
import StatusBadge from '../components/common/StatusBadge';
import { formatCurrency, formatDate } from '../utils/formatters';

const STATUS_PROGRESS = [
  { value: 'REPORTED', label: 'Reported', color: 'secondary' },
  { value: 'IN_INSPECTION', label: 'In Inspection', color: 'info' },
  { value: 'AWAITING_PARTS', label: 'Awaiting Parts', color: 'warning' },
  { value: 'IN_REPAIR', label: 'In Repair', color: 'primary' },
  { value: 'SENT_TO_VENDOR', label: 'Vendor Service', color: 'primary' },
  { value: 'RESOLVED', label: 'Repaired & Restored', color: 'success' },
  { value: 'WRITTEN_OFF', label: 'Decommissioned', color: 'dark' }
];

const Maintenance = () => {
  const { isAdmin } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'resolved' | 'history'

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolvingTicket, setResolvingTicket] = useState(null);
  const [viewTicket, setViewTicket] = useState(null);

  const [alertMsg, setAlertMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    loadTickets();
  }, [statusFilter, severityFilter]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const params = {
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        severity: severityFilter !== 'ALL' ? severityFilter : undefined
      };
      const res = await getMaintenanceTickets(params);
      if (res.data?.success) {
        setTickets(res.data.data || []);
      }
    } catch (err) {
      setAlertMsg({ type: 'danger', text: err.response?.data?.message || 'Error loading maintenance tickets.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (payload) => {
    await createMaintenanceTicket(payload);
    setAlertMsg({ type: 'success', text: 'Damage ticket logged and equipment isolated from available stock.' });
    loadTickets();
  };

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      await updateMaintenanceTicket(ticketId, { status: newStatus });
      setAlertMsg({ type: 'success', text: `Ticket progress updated to ${newStatus.replace('_', ' ')}.` });
      loadTickets();
    } catch (err) {
      setAlertMsg({ type: 'danger', text: err.response?.data?.message || 'Failed to update ticket status.' });
    }
  };

  const handleResolve = async (id, payload) => {
    await resolveMaintenanceTicket(id, payload);
    setAlertMsg({ type: 'success', text: 'Ticket marked as resolved and equipment stock restored.' });
    loadTickets();
  };

  const handleDeleteTicket = async (t) => {
    if (window.confirm(`Delete maintenance ticket ${t.ticketNumber}? If it was active, equipment availability will be restored.`)) {
      try {
        await deleteMaintenanceTicket(t.id);
        setAlertMsg({ type: 'success', text: `Maintenance ticket ${t.ticketNumber} deleted.` });
        loadTickets();
      } catch (err) {
        setAlertMsg({ type: 'danger', text: err.response?.data?.message || 'Failed to delete ticket.' });
      }
    }
  };

  // Filtered tickets
  const filteredTickets = tickets.filter(t => {
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch = !term ||
      t.ticketNumber?.toLowerCase().includes(term) ||
      t.issueTitle?.toLowerCase().includes(term) ||
      t.equipment?.name?.toLowerCase().includes(term) ||
      t.equipment?.assetTag?.toLowerCase().includes(term) ||
      t.technician?.toLowerCase().includes(term) ||
      t.damageCategory?.toLowerCase().includes(term);

    if (activeTab === 'active') {
      const isOngoing = ['REPORTED', 'IN_INSPECTION', 'AWAITING_PARTS', 'IN_REPAIR', 'SENT_TO_VENDOR'].includes(t.status);
      return matchesSearch && isOngoing;
    }
    if (activeTab === 'resolved') {
      const isDone = ['RESOLVED', 'WRITTEN_OFF', 'DECOMMISSIONED'].includes(t.status);
      return matchesSearch && isDone;
    }
    // 'history' shows all
    return matchesSearch;
  });

  const totalCost = tickets.reduce((sum, t) => sum + (t.cost || 0), 0);
  const activeCount = tickets.filter(t => ['REPORTED', 'IN_INSPECTION', 'AWAITING_PARTS', 'IN_REPAIR', 'SENT_TO_VENDOR'].includes(t.status)).length;
  const resolvedCount = tickets.filter(t => t.status === 'RESOLVED').length;
  const decommissionedCount = tickets.filter(t => ['WRITTEN_OFF', 'DECOMMISSIONED'].includes(t.status)).length;

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-2">
        <div>
          <h4 className="fw-bold text-dark mb-0">Maintenance & Repairs</h4>
        </div>

        <button
          type="button"
          className="btn btn-sm btn-warning text-dark fw-semibold d-flex align-items-center gap-1 shadow-sm"
          onClick={() => setShowCreateModal(true)}
        >
          <i className="bi bi-tools"></i>
          <span>Report Damage / Create Ticket</span>
        </button>
      </div>

      {alertMsg.text && (
        <div className={`alert alert-${alertMsg.type} alert-dismissible fade show py-2 small mb-3 shadow-sm`} role="alert">
          {alertMsg.text}
          <button type="button" className="btn-close py-2" onClick={() => setAlertMsg({ type: '', text: '' })}></button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="kpi-card">
              <span className="kpi-label" title="Active Service Tickets">Active Service Tickets</span>
              <div className="kpi-value text-danger">{activeCount}</div>
              <span className="kpi-sub">Quarantined or in repair</span>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="kpi-card">
              <span className="kpi-label" title="Resolved & Repaired">Resolved & Repaired</span>
              <div className="kpi-value text-success">{resolvedCount}</div>
              <span className="kpi-sub">Restored to available stock</span>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="kpi-card">
              <span className="kpi-label" title="Decommissioned">Decommissioned</span>
              <div className="kpi-value text-secondary">{decommissionedCount}</div>
              <span className="kpi-sub">Permanently written off</span>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="kpi-card">
              <span className="kpi-label" title="Total Repair Expenditure">Total Repair Expenditure</span>
              <div className="kpi-value text-dark">{formatCurrency(totalCost)}</div>
              <span className="kpi-sub">Recorded parts & labor</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs & Filter toolbar */}
      <div className="card mb-4 border-0 shadow-sm">
        <div className="card-header bg-white border-bottom-0 pb-0 pt-3">
          <ul className="nav nav-tabs card-header-tabs">
            <li className="nav-item">
              <button
                className={`nav-link fw-semibold small ${activeTab === 'active' ? 'active text-primary' : 'text-muted'}`}
                onClick={() => setActiveTab('active')}
              >
                <i className="bi bi-clock-history me-1"></i> Active Repairs ({activeCount})
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link fw-semibold small ${activeTab === 'resolved' ? 'active text-success' : 'text-muted'}`}
                onClick={() => setActiveTab('resolved')}
              >
                <i className="bi bi-check-circle me-1"></i> Completed & Restored ({resolvedCount})
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link fw-semibold small ${activeTab === 'history' ? 'active text-dark' : 'text-muted'}`}
                onClick={() => setActiveTab('history')}
              >
                <i className="bi bi-journal-text me-1"></i> Full Maintenance History ({tickets.length})
              </button>
            </li>
          </ul>
        </div>
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
                  placeholder="Search tickets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={() => setSearchTerm('')}
                  >
                    <i className="bi bi-x"></i>
                  </button>
                )}
              </div>
            </div>

            <div className="col-md-3">
              <select
                className="form-select form-select-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Ticket Statuses</option>
                <option value="REPORTED">Reported</option>
                <option value="IN_INSPECTION">In Inspection</option>
                <option value="AWAITING_PARTS">Awaiting Parts</option>
                <option value="IN_REPAIR">In Repair</option>
                <option value="SENT_TO_VENDOR">Sent to Vendor</option>
                <option value="RESOLVED">Resolved</option>
                <option value="WRITTEN_OFF">Written Off</option>
              </select>
            </div>

            <div className="col-md-3">
              <select
                className="form-select form-select-sm"
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
              >
                <option value="ALL">All Severity Levels</option>
                <option value="LOW">Low (Cosmetic/Scuff)</option>
                <option value="MEDIUM">Medium (Degraded)</option>
                <option value="HIGH">High (Major Fault)</option>
                <option value="CRITICAL">Critical (Quarantined)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tickets Table */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="text-muted small mt-2">Loading maintenance tickets...</p>
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="card text-center py-5 border-0 shadow-sm">
          <div className="card-body">
            <i className="bi bi-shield-check fs-1 text-success d-block mb-2"></i>
            <h6 className="fw-bold text-dark">No maintenance tickets found</h6>
            <p className="text-muted small mb-3">
              {activeTab === 'active'
                ? 'All equipment is currently operational and in rotation.'
                : 'No records match the current filter criteria.'}
            </p>
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              Report New Damage Ticket
            </button>
          </div>
        </div>
      ) : (
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table table-custom align-middle mb-0">
              <thead>
                <tr>
                  <th>Ticket Code</th>
                  <th>Equipment Item</th>
                  <th>Category & Issue Details</th>
                  <th>Severity</th>
                  <th>Technician / Vendor</th>
                  <th>Repair Cost</th>
                  <th>Progress Stage</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map(t => (
                  <tr key={t.id}>
                    <td>
                      <span className="fw-bold text-dark">{t.ticketNumber}</span>
                      <div className="small text-muted" style={{ fontSize: '0.72rem' }}>{formatDate(t.createdAt)}</div>
                      {t.damageImageUrl && (
                        <span className="badge bg-light text-primary border mt-1" style={{ fontSize: '0.65rem' }}>
                          <i className="bi bi-paperclip me-1"></i>Photo Attached
                        </span>
                      )}
                    </td>

                    <td>
                      <div className="d-flex align-items-center gap-2">
                        {t.equipment?.imageUrl ? (
                          <img
                            src={t.equipment.imageUrl}
                            alt={t.equipment.name}
                            className="rounded object-fit-cover flex-shrink-0"
                            style={{ width: '36px', height: '36px' }}
                          />
                        ) : (
                          <div className="bg-light rounded d-flex align-items-center justify-content-center text-muted flex-shrink-0" style={{ width: '36px', height: '36px' }}>
                            <i className="bi bi-camera"></i>
                          </div>
                        )}
                        <div>
                          <span className="fw-bold text-dark d-block">{t.equipment?.assetTag}</span>
                          <span className="small text-muted text-truncate d-block" style={{ maxWidth: '140px' }}>
                            {t.equipment?.name}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td style={{ maxWidth: '240px' }}>
                      <div className="badge bg-secondary-subtle text-secondary mb-1" style={{ fontSize: '0.7rem' }}>
                        {t.damageCategory || 'General Servicing'}
                      </div>
                      <strong className="text-dark d-block text-truncate" title={t.issueTitle}>
                        {t.issueTitle}
                      </strong>
                      <span className="small text-muted text-truncate d-block" title={t.description} style={{ fontSize: '0.75rem' }}>
                        {t.description}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`badge ${
                          t.severity === 'CRITICAL'
                            ? 'bg-danger'
                            : t.severity === 'HIGH'
                            ? 'bg-warning text-dark'
                            : 'bg-secondary'
                        }`}
                        style={{ fontSize: '0.72rem' }}
                      >
                        {t.severity}
                      </span>
                    </td>

                    <td>
                      <div className="fw-semibold text-dark small">{t.technician || t.vendor || 'Vault Tech'}</div>
                      <div className="small text-muted" style={{ fontSize: '0.72rem' }}>
                        {t.vendor ? `Vendor: ${t.vendor}` : 'Internal Staff'}
                      </div>
                    </td>

                    <td className="fw-semibold text-dark">{formatCurrency(t.cost)}</td>

                    <td>
                      {['RESOLVED', 'WRITTEN_OFF'].includes(t.status) ? (
                        <StatusBadge status={t.status} />
                      ) : (
                        <div className="d-flex align-items-center gap-1">
                          <select
                            className="form-select form-select-sm"
                            value={t.status}
                            onChange={(e) => handleStatusChange(t.id, e.target.value)}
                            style={{ fontSize: '0.75rem', width: 'auto' }}
                          >
                            <option value="REPORTED">Reported</option>
                            <option value="IN_INSPECTION">In Inspection</option>
                            <option value="AWAITING_PARTS">Awaiting Parts</option>
                            <option value="IN_REPAIR">In Repair</option>
                            <option value="SENT_TO_VENDOR">Sent to Vendor</option>
                          </select>
                        </div>
                      )}
                    </td>

                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        <button
                          type="button"
                          className="btn btn-light border"
                          title="View Details"
                          onClick={() => setViewTicket(t)}
                        >
                          <i className="bi bi-eye text-primary"></i>
                        </button>
                        {!['RESOLVED', 'WRITTEN_OFF'].includes(t.status) && (
                          <button
                            type="button"
                            className="btn btn-outline-success"
                            title="Mark Repaired & Restore Stock"
                            onClick={() => {
                              setResolvingTicket(t);
                              setShowResolveModal(true);
                            }}
                          >
                            <i className="bi bi-check2-circle me-1"></i> Resolve
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            type="button"
                            className="btn btn-outline-danger"
                            title="Delete Ticket"
                            onClick={() => handleDeleteTicket(t)}
                          >
                            <i className="bi bi-trash"></i>
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

      {/* Detail Modal */}
      {viewTicket && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-slate-900 text-white" style={{ backgroundColor: '#0f172a' }}>
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-tools text-warning fs-5"></i>
                  <h6 className="modal-title fw-bold text-white mb-0">Ticket Details: {viewTicket.ticketNumber}</h6>
                </div>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setViewTicket(null)}
                  aria-label="Close"
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>
              <div className="modal-body p-4">
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="p-3 border rounded bg-light">
                      <span className="small text-muted fw-semibold d-block text-uppercase" style={{ fontSize: '0.7rem' }}>Equipment Item</span>
                      <strong className="fs-6 text-dark">{viewTicket.equipment?.name}</strong>
                      <div className="small text-muted mt-1">Asset Tag: <span className="badge bg-slate-900 text-white">{viewTicket.equipment?.assetTag}</span></div>
                      <div className="small text-muted">Brand & Model: {viewTicket.equipment?.brand} {viewTicket.equipment?.model}</div>
                      {viewTicket.equipment?.imageUrl && (
                        <img
                          src={viewTicket.equipment.imageUrl}
                          alt={viewTicket.equipment.name}
                          className="rounded border mt-2 object-fit-cover"
                          style={{ width: '100%', height: '120px' }}
                        />
                      )}
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="p-3 border rounded bg-light h-100">
                      <span className="small text-muted fw-semibold d-block text-uppercase" style={{ fontSize: '0.7rem' }}>Diagnostics & Logistics</span>
                      <div className="mt-2"><strong>Category:</strong> {viewTicket.damageCategory || 'General Maintenance'}</div>
                      <div className="mt-1"><strong>Severity:</strong> <span className="badge bg-warning text-dark">{viewTicket.severity}</span></div>
                      <div className="mt-1"><strong>Current Stage:</strong> <StatusBadge status={viewTicket.status} /></div>
                      <div className="mt-1"><strong>Assigned Technician:</strong> {viewTicket.technician || 'Vault Tech'}</div>
                      <div className="mt-1"><strong>Authorized Vendor:</strong> {viewTicket.vendor || 'Internal Vault'}</div>
                      <div className="mt-1"><strong>Recorded Cost:</strong> {formatCurrency(viewTicket.cost)}</div>
                      <div className="mt-1"><strong>Target Date:</strong> {formatDate(viewTicket.scheduledDate)}</div>
                    </div>
                  </div>

                  <div className="col-12">
                    <div className="p-3 border rounded">
                      <strong className="d-block mb-1 text-dark">Issue Summary: {viewTicket.issueTitle}</strong>
                      <p className="small text-muted mb-0">{viewTicket.description}</p>
                      {viewTicket.resolutionNotes && (
                        <div className="mt-2 p-2 bg-success-subtle rounded text-success small">
                          <strong>Resolution Notes:</strong> {viewTicket.resolutionNotes}
                        </div>
                      )}
                    </div>
                  </div>

                  {viewTicket.damageImageUrl && (
                    <div className="col-12">
                      <strong className="d-block mb-2 text-dark">Damage Photo Evidence:</strong>
                      <img
                        src={viewTicket.damageImageUrl}
                        alt="Damage Evidence"
                        className="rounded border shadow-sm"
                        style={{ maxHeight: '240px', objectFit: 'contain' }}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer bg-light py-2">
                <button type="button" className="btn btn-sm btn-secondary" onClick={() => setViewTicket(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Ticket Modal */}
      <MaintenanceFormModal
        show={showCreateModal}
        onHide={() => setShowCreateModal(false)}
        onSubmit={handleCreate}
      />

      {/* Resolve Ticket Modal */}
      <MaintenanceResolveModal
        show={showResolveModal}
        onHide={() => setShowResolveModal(false)}
        ticket={resolvingTicket}
        onResolve={handleResolve}
      />
    </div>
  );
};

export default Maintenance;