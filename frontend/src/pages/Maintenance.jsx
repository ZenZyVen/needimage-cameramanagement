import React, { useState, useEffect } from 'react';
import {
  getMaintenanceTickets,
  createMaintenanceTicket,
  resolveMaintenanceTicket
} from '../services/maintenanceService';
import MaintenanceFormModal from '../components/maintenance/MaintenanceFormModal';
import MaintenanceResolveModal from '../components/maintenance/MaintenanceResolveModal';
import StatusBadge from '../components/common/StatusBadge';
import { formatCurrency, formatDate } from '../utils/formatters';

const Maintenance = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolvingTicket, setResolvingTicket] = useState(null);

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
    setAlertMsg({ type: 'success', text: 'Damage / maintenance ticket created. Equipment status updated to UNDER_MAINTENANCE.' });
    loadTickets();
  };

  const handleResolve = async (id, payload) => {
    await resolveMaintenanceTicket(id, payload);
    setAlertMsg({ type: 'success', text: 'Ticket marked as resolved and equipment returned to available inventory.' });
    loadTickets();
  };

  const totalCost = tickets.reduce((sum, t) => sum + (t.cost || 0), 0);
  const activeCount = tickets.filter(t => ['REPORTED', 'IN_INSPECTION', 'SENT_TO_VENDOR', 'IN_REPAIR'].includes(t.status)).length;

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-2">
        <div>
          <h4 className="fw-bold text-dark mb-1">Equipment Maintenance & Damage Reports</h4>
          <p className="text-muted small mb-0">
            Track damaged lenses, sensor cleaning, warranty claims, service costs, and technician work orders.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-sm btn-warning text-dark fw-semibold d-flex align-items-center gap-1"
          onClick={() => setShowCreateModal(true)}
        >
          <i className="bi bi-tools"></i>
          <span>Report Damage / Ticket</span>
        </button>
      </div>

      {alertMsg.text && (
        <div className={`alert alert-${alertMsg.type} alert-dismissible fade show py-2 small mb-3`} role="alert">
          {alertMsg.text}
          <button type="button" className="btn-close py-2" onClick={() => setAlertMsg({ type: '', text: '' })}></button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-sm-4">
          <div className="card p-3">
            <span className="small text-muted fw-semibold">Active Service Tickets</span>
            <div className="fs-3 fw-bold text-danger mt-1">{activeCount}</div>
            <span className="small text-muted">Currently undergoing inspection or repair</span>
          </div>
        </div>
        <div className="col-sm-4">
          <div className="card p-3">
            <span className="small text-muted fw-semibold">Resolved / Repaired</span>
            <div className="fs-3 fw-bold text-success mt-1">
              {tickets.filter(t => t.status === 'RESOLVED').length}
            </div>
            <span className="small text-muted">Returned to active vault rotation</span>
          </div>
        </div>
        <div className="col-sm-4">
          <div className="card p-3">
            <span className="small text-muted fw-semibold">Total Service Expenditure</span>
            <div className="fs-3 fw-bold text-dark mt-1">{formatCurrency(totalCost)}</div>
            <span className="small text-muted">Recorded repair costs</span>
          </div>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="card mb-4 border-0 shadow-sm">
        <div className="card-body p-3">
          <div className="row g-2 align-items-center">
            <div className="col-md-6">
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Ticket Statuses</option>
                <option value="REPORTED">Reported (Pending Inspection)</option>
                <option value="IN_INSPECTION">In Inspection</option>
                <option value="SENT_TO_VENDOR">Sent to Vendor / Manufacturer</option>
                <option value="IN_REPAIR">In Active Repair</option>
                <option value="RESOLVED">Resolved / Completed</option>
                <option value="WRITTEN_OFF">Written Off (Decommissioned)</option>
              </select>
            </div>

            <div className="col-md-6">
              <select
                className="form-select"
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
              >
                <option value="ALL">All Severity Levels</option>
                <option value="LOW">Low (Cosmetic/Scuff)</option>
                <option value="MEDIUM">Medium (Minor Issue)</option>
                <option value="HIGH">High (Degraded Performance)</option>
                <option value="CRITICAL">Critical (Non-functional)</option>
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
      ) : tickets.length === 0 ? (
        <div className="card text-center py-5">
          <div className="card-body">
            <i className="bi bi-shield-check fs-1 text-success d-block mb-2"></i>
            <h6 className="fw-bold text-dark">No maintenance tickets found</h6>
            <p className="text-muted small">
              All inventory equipment is in healthy operating condition.
            </p>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="table-responsive">
            <table className="table table-custom">
              <thead>
                <tr>
                  <th>Ticket #</th>
                  <th>Equipment Item</th>
                  <th>Issue Title & Description</th>
                  <th>Severity</th>
                  <th>Service Vendor</th>
                  <th>Cost</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(t => (
                  <tr key={t.id}>
                    <td>
                      <span className="fw-bold text-dark">{t.ticketNumber}</span>
                      <div className="small text-muted">{formatDate(t.createdAt)}</div>
                    </td>
                    <td>
                      <div className="fw-semibold text-dark">{t.equipment?.assetTag}</div>
                      <div className="small text-muted">{t.equipment?.name}</div>
                    </td>
                    <td style={{ maxWidth: '280px' }}>
                      <strong className="text-dark d-block">{t.issueTitle}</strong>
                      <span className="small text-muted text-truncate d-block" title={t.description}>
                        {t.description}
                      </span>
                      {t.resolutionNotes && (
                        <div className="small text-success mt-1">
                          <i className="bi bi-check2 me-1"></i> Resolution: {t.resolutionNotes}
                        </div>
                      )}
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
                      >
                        {t.severity}
                      </span>
                    </td>
                    <td>{t.vendor || 'In-House Vault'}</td>
                    <td className="fw-semibold text-dark">{formatCurrency(t.cost)}</td>
                    <td>
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="text-end">
                      {['REPORTED', 'IN_INSPECTION', 'SENT_TO_VENDOR', 'IN_REPAIR'].includes(t.status) && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-success"
                          onClick={() => {
                            setResolvingTicket(t);
                            setShowResolveModal(true);
                          }}
                        >
                          <i className="bi bi-check-circle me-1"></i> Mark Resolved
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
