import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getStockMovements,
  getEquipment,
  adjustStock
} from '../services/equipmentService';
import { formatDateTime } from '../utils/formatters';

const MOVEMENT_TYPES = [
  { value: 'ALL', label: 'All Movement Types' },
  { value: 'RESTOCK', label: 'RESTOCK / Intake (+)' },
  { value: 'STOCK_IN', label: 'STOCK_IN (+)' },
  { value: 'CHECK_OUT', label: 'CHECK_OUT (Handover / Loan)' },
  { value: 'CHECK_IN', label: 'CHECK_IN (Returned to Vault)' },
  { value: 'MAINTENANCE', label: 'MAINTENANCE (Quarantined)' },
  { value: 'STOCK_REDUCTION', label: 'STOCK_REDUCTION / Write-off (-)' },
  { value: 'DAMAGED_WRITE_OFF', label: 'DAMAGED_WRITE_OFF (-)' },
  { value: 'ADJUSTMENT', label: 'MANUAL_ADJUSTMENT' }
];

const StockMovements = () => {
  const { user, isAdmin, isStaff } = useAuth();
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Quick Restock Modal
  const [equipmentList, setEquipmentList] = useState([]);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [selectedGearId, setSelectedGearId] = useState('');
  const [restockQty, setRestockQty] = useState(1);
  const [restockRef, setRestockRef] = useState('PO-2026-RESTOCK');
  const [restockNotes, setRestockNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [alertMsg, setAlertMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    loadEquipmentOptions();
  }, []);

  useEffect(() => {
    loadMovements();
  }, [typeFilter, searchTerm, startDate, endDate]);

  const loadEquipmentOptions = async () => {
    try {
      const res = await getEquipment({ limit: 100 });
      if (res.data?.success) {
        setEquipmentList(res.data.data || []);
      }
    } catch (e) {
      console.warn('Error loading equipment:', e);
    }
  };

  const loadMovements = async () => {
    try {
      setLoading(true);
      const params = {
        type: typeFilter !== 'ALL' ? typeFilter : undefined,
        search: searchTerm.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        limit: 200
      };
      const res = await getStockMovements(params);
      if (res.data?.success) {
        setMovements(res.data.data || []);
      }
    } catch (e) {
      console.warn('Error loading movements:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    if (!selectedGearId) return;
    const qty = parseInt(restockQty, 10);
    if (isNaN(qty) || qty <= 0) return;

    try {
      setSubmitting(true);
      await adjustStock(selectedGearId, {
        adjustment: qty,
        reason: restockRef || 'RESTOCK_SHIPMENT',
        notes: restockNotes || `Restocked ${qty} units via movements ledger.`,
        type: 'RESTOCK'
      });
      setAlertMsg({ type: 'success', text: `Stock successfully added (+${qty}). Movement ledger updated!` });
      setShowRestockModal(false);
      loadMovements();
    } catch (err) {
      setAlertMsg({ type: 'danger', text: err.response?.data?.message || 'Failed to record restock.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    if (movements.length === 0) return;
    const headers = ['Timestamp', 'Asset Tag', 'Equipment Name', 'Movement Type', 'Quantity Changed', 'Avail Before', 'Avail After', 'Total Before', 'Total After', 'Reference', 'Notes', 'Staff'];
    const rows = movements.map(m => [
      new Date(m.createdAt).toLocaleString(),
      m.assetTag,
      `"${(m.equipmentName || '').replace(/"/g, '""')}"`,
      m.type,
      m.quantityChanged,
      m.previousAvailable,
      m.newAvailable,
      m.previousTotal,
      m.newTotal,
      `"${(m.reference || '').replace(/"/g, '""')}"`,
      `"${(m.notes || '').replace(/"/g, '""')}"`,
      `"${(m.performedBy || 'System').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `cinevault-stock-movements-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Metrics
  const totalCount = movements.length;
  const restockCount = movements.filter(m => m.type === 'RESTOCK' || m.type === 'STOCK_IN').length;
  const checkoutsCount = movements.filter(m => m.type === 'CHECK_OUT').length;
  const checkinsCount = movements.filter(m => m.type === 'CHECK_IN').length;
  const maintenanceCount = movements.filter(m => m.type === 'MAINTENANCE').length;

  return (
    <div className="pb-5">
      {/* Page Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-2">
        <div className="d-flex align-items-center gap-2">
          <h4 className="fw-bold text-dark mb-0">Stock Movements Log</h4>
          <span className="badge bg-slate-900 text-white font-monospace small px-2 py-1">
            Audit Trail
          </span>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1 shadow-sm px-3"
            onClick={loadMovements}
          >
            <i className="bi bi-arrow-clockwise"></i>
            <span>Refresh</span>
          </button>
          <button
            type="button"
            className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1 shadow-sm px-3"
            onClick={handleExportCSV}
            disabled={movements.length === 0}
          >
            <i className="bi bi-download"></i>
            <span>Export CSV</span>
          </button>
          {isAdmin && (
            <button
              type="button"
              className="btn btn-primary btn-sm d-flex align-items-center gap-1 shadow-sm px-3 fw-semibold"
              onClick={() => {
                setSelectedGearId(equipmentList[0]?.id || '');
                setRestockQty(1);
                setRestockRef('PO-2026-INTAKE');
                setRestockNotes('');
                setShowRestockModal(true);
              }}
            >
              <i className="bi bi-plus-circle"></i>
              <span>New Restock</span>
            </button>
          )}
        </div>
      </div>

      {alertMsg.text && (
        <div className={`alert alert-${alertMsg.type} alert-dismissible fade show py-2 small mb-4`} role="alert">
          <div className="d-flex align-items-center gap-2">
            <i className={`bi ${alertMsg.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-octagon-fill'}`}></i>
            <span>{alertMsg.text}</span>
          </div>
          <button type="button" className="btn-close py-2" onClick={() => setAlertMsg({ type: '', text: '' })}></button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-4 col-lg-2">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-3">
              <span className="text-muted small d-block">Total Movements</span>
              <h3 className="fw-bold text-dark mb-0 mt-1">{totalCount}</h3>
              <span className="text-muted" style={{ fontSize: '0.72rem' }}>logged transactions</span>
            </div>
          </div>
        </div>

        <div className="col-6 col-md-4 col-lg-2">
          <div className="card border-0 shadow-sm h-100 border-start border-success border-3">
            <div className="card-body p-3">
              <span className="text-muted small d-block">Restock Intakes</span>
              <h3 className="fw-bold text-success mb-0 mt-1">{restockCount}</h3>
              <span className="text-muted" style={{ fontSize: '0.72rem' }}>stock additions</span>
            </div>
          </div>
        </div>

        <div className="col-6 col-md-4 col-lg-3">
          <div className="card border-0 shadow-sm h-100 border-start border-primary border-3">
            <div className="card-body p-3">
              <span className="text-muted small d-block">Check-Out Handovers</span>
              <h3 className="fw-bold text-primary mb-0 mt-1">{checkoutsCount}</h3>
              <span className="text-muted" style={{ fontSize: '0.72rem' }}>dispatched on loan</span>
            </div>
          </div>
        </div>

        <div className="col-6 col-md-4 col-lg-3">
          <div className="card border-0 shadow-sm h-100 border-start border-info border-3">
            <div className="card-body p-3">
              <span className="text-muted small d-block">Check-In Returns</span>
              <h3 className="fw-bold text-info mb-0 mt-1">{checkinsCount}</h3>
              <span className="text-muted" style={{ fontSize: '0.72rem' }}>returned & verified</span>
            </div>
          </div>
        </div>

        <div className="col-6 col-md-4 col-lg-2">
          <div className="card border-0 shadow-sm h-100 border-start border-warning border-3">
            <div className="card-body p-3">
              <span className="text-muted small d-block">Quarantines</span>
              <h3 className="fw-bold text-warning mb-0 mt-1">{maintenanceCount}</h3>
              <span className="text-muted" style={{ fontSize: '0.72rem' }}>service routing</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-3">
          <div className="row g-2 align-items-center">
            <div className="col-md-5">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-white"><i className="bi bi-search text-muted"></i></span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search gear name, asset tag, reference, notes, or staff..."
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

            <div className="col-md-3">
              <select
                className="form-select form-select-sm"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                {MOVEMENT_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div className="col-md-4 d-flex align-items-center gap-1">
              <input
                type="date"
                className="form-control form-control-sm"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                title="Filter Start Date"
              />
              <span className="text-muted small">–</span>
              <input
                type="date"
                className="form-control form-control-sm"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                title="Filter End Date"
              />
              {(startDate || endDate) && (
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => { setStartDate(''); setEndDate(''); }}
                  title="Clear dates"
                >
                  <i className="bi bi-x"></i>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Movements Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary spinner-border-sm"></div>
              <span className="text-muted small ms-2">Loading stock movement ledger...</span>
            </div>
          ) : movements.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-journal-x fs-2 text-secondary d-block mb-1"></i>
              No stock movement records match the current filter.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light text-muted small">
                  <tr>
                    <th style={{ width: '160px' }}>Timestamp</th>
                    <th>Equipment Item</th>
                    <th>Movement Type</th>
                    <th className="text-center">Quantity Delta</th>
                    <th className="text-center">Stock Progression</th>
                    <th>Reference / Order</th>
                    <th>Description / Notes</th>
                    <th>Responsible Staff</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map(m => {
                    const isPositive = m.quantityChanged > 0;
                    return (
                      <tr key={m.id}>
                        <td className="small text-nowrap font-monospace text-secondary">
                          {formatDateTime(m.createdAt)}
                        </td>

                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <span className="badge bg-dark font-monospace" style={{ fontSize: '0.7rem' }}>
                              {m.assetTag}
                            </span>
                            <span className="fw-semibold text-dark small text-truncate" style={{ maxWidth: '200px' }}>
                              {m.equipmentName}
                            </span>
                          </div>
                        </td>

                        <td>
                          <span className={`badge ${
                            m.type === 'RESTOCK' || m.type === 'STOCK_IN' || m.type === 'CHECK_IN'
                              ? 'bg-success-subtle text-success border border-success-subtle'
                              : m.type === 'DAMAGED_WRITE_OFF' || m.type === 'STOCK_REDUCTION'
                              ? 'bg-danger-subtle text-danger border border-danger-subtle'
                              : m.type === 'CHECK_OUT'
                              ? 'bg-primary-subtle text-primary border border-primary-subtle'
                              : 'bg-warning-subtle text-warning border border-warning-subtle'
                          } small font-monospace`}>
                            {m.type}
                          </span>
                        </td>

                        <td className="text-center">
                          <span className={`fw-bold fs-6 ${isPositive ? 'text-success' : 'text-danger'}`}>
                            {isPositive ? `+${m.quantityChanged}` : m.quantityChanged}
                          </span>
                        </td>

                        <td className="text-center small font-monospace">
                          <span className="text-muted">{m.previousAvailable}</span>
                          <i className="bi bi-arrow-right mx-1 text-secondary"></i>
                          <strong className="text-dark">{m.newAvailable} avail</strong>
                          <span className="text-muted ms-1" style={{ fontSize: '0.7rem' }}>
                            ({m.newTotal} total)
                          </span>
                        </td>

                        <td className="small font-monospace text-secondary">
                          {m.reference || '—'}
                        </td>

                        <td className="small text-muted text-truncate" style={{ maxWidth: '240px' }} title={m.notes}>
                          {m.notes || '—'}
                        </td>

                        <td className="small fw-semibold text-dark">
                          <i className="bi bi-person me-1 text-primary"></i>
                          {m.performedBy || 'System Admin'}
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

      {/* QUICK RESTOCK MODAL */}
      {showRestockModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-slate-900 text-white" style={{ backgroundColor: '#0f172a' }}>
                <div className="d-flex align-items-center gap-2">
                  <div className="p-2 rounded bg-primary-subtle text-primary d-flex align-items-center justify-content-center" style={{ width: 32, height: 32 }}>
                    <i className="bi bi-box-arrow-in-down"></i>
                  </div>
                  <h6 className="modal-title fw-bold text-white mb-0">Restock Equipment</h6>
                </div>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowRestockModal(false)}></button>
              </div>

              <form onSubmit={handleRestockSubmit}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Select Gear Model</label>
                    <select
                      className="form-select form-select-sm"
                      value={selectedGearId}
                      onChange={(e) => setSelectedGearId(e.target.value)}
                      required
                    >
                      {equipmentList.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.assetTag} - {item.name} ({item.availableQuantity || item.quantity} avail / {item.quantity} total)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Quantity to Add <span className="text-danger">*</span></label>
                    <input
                      type="number"
                      min="1"
                      className="form-control"
                      value={restockQty}
                      onChange={(e) => setRestockQty(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Purchase Order / Delivery Reference</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={restockRef}
                      onChange={(e) => setRestockRef(e.target.value)}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Intake Notes</label>
                    <textarea
                      className="form-control form-control-sm"
                      rows="2"
                      value={restockNotes}
                      onChange={(e) => setRestockNotes(e.target.value)}
                    ></textarea>
                  </div>
                </div>

                <div className="modal-footer bg-light px-4 py-3">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowRestockModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary px-4 fw-semibold" disabled={submitting}>
                    {submitting ? 'Updating...' : `Confirm Restock (+${restockQty})`}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockMovements;