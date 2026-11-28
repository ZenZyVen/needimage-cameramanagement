import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getStockMovements,
  getEquipment,
  getCategories,
  adjustStock,
  deleteStockMovement
} from '../services/equipmentService';
import { triggerNotificationRefresh } from '../context/NotificationContext';
import { formatDateTime } from '../utils/formatters';

const MOVEMENT_TYPES = [
  { value: 'ALL', label: 'All Movement Types' },
  { value: 'INITIAL_STOCK', label: 'INITIAL_STOCK (New Equipment)' },
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
  const [categories, setCategories] = useState([]);
  const [restockCategory, setRestockCategory] = useState('ALL');
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [selectedGearId, setSelectedGearId] = useState('');
  const [restockQty, setRestockQty] = useState(1);
  const [restockRef, setRestockRef] = useState('PO-2026-RESTOCK');
  const [restockNotes, setRestockNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [alertMsg, setAlertMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    loadEquipmentOptions();
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const res = await getCategories();
      if (res.data?.success) {
        setCategories(res.data.data || []);
      }
    } catch (e) {
      console.warn('Error loading categories:', e);
    }
  };

  useEffect(() => {
    loadMovements();
  }, [typeFilter, searchTerm, startDate, endDate]);

  const loadEquipmentOptions = async () => {
    try {
      const res = await getEquipment({ limit: 200 });
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
      triggerNotificationRefresh();
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

  const handleDeleteMovement = async (m) => {
    if (window.confirm(`Delete stock movement record for ${m.assetTag} (${m.type})?`)) {
      try {
        await deleteStockMovement(m.id);
        setAlertMsg({ type: 'success', text: 'Stock movement record deleted.' });
        loadMovements();
      } catch (err) {
        setAlertMsg({ type: 'danger', text: err.response?.data?.message || 'Failed to delete stock movement.' });
      }
    }
  };

  // Metrics
  const totalCount = movements.length;
  const restockCount = movements.filter(m => m.type === 'RESTOCK' || m.type === 'STOCK_IN' || m.type === 'INITIAL_STOCK').length;
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
        <div className="col-6 col-md-4 col-lg">
          <div className="card border-0 shadow-sm h-100">
            <div className="kpi-card">
              <span className="kpi-label" title="Total Movements">Total Movements</span>
              <div className="kpi-value text-dark">{totalCount}</div>
              <span className="kpi-sub">logged transactions</span>
            </div>
          </div>
        </div>

        <div className="col-6 col-md-4 col-lg">
          <div className="card border-0 shadow-sm h-100 border-start border-success border-3">
            <div className="kpi-card">
              <span className="kpi-label" title="Restock Intakes">Restock Intakes</span>
              <div className="kpi-value text-success">{restockCount}</div>
              <span className="kpi-sub">stock additions</span>
            </div>
          </div>
        </div>

        <div className="col-6 col-md-4 col-lg">
          <div className="card border-0 shadow-sm h-100 border-start border-primary border-3">
            <div className="kpi-card">
              <span className="kpi-label" title="Check-Out Handovers">Check-Out Handovers</span>
              <div className="kpi-value text-primary">{checkoutsCount}</div>
              <span className="kpi-sub">dispatched on loan</span>
            </div>
          </div>
        </div>

        <div className="col-6 col-md-6 col-lg">
          <div className="card border-0 shadow-sm h-100 border-start border-info border-3">
            <div className="kpi-card">
              <span className="kpi-label" title="Check-In Returns">Check-In Returns</span>
              <div className="kpi-value text-info">{checkinsCount}</div>
              <span className="kpi-sub">returned & verified</span>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 col-lg">
          <div className="card border-0 shadow-sm h-100 border-start border-warning border-3">
            <div className="kpi-card">
              <span className="kpi-label" title="Quarantines">Quarantines</span>
              <div className="kpi-value text-warning">{maintenanceCount}</div>
              <span className="kpi-sub">service routing</span>
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
                  placeholder="Search movements..."
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
                    <th style={{ width: '170px' }}>Date & Staff</th>
                    <th style={{ minWidth: '220px' }}>Equipment Item</th>
                    <th style={{ width: '160px' }}>Movement & Delta</th>
                    <th style={{ width: '190px' }}>Progression & Ref</th>
                    <th>Notes & Details</th>
                    {isAdmin && <th className="text-end" style={{ width: '75px' }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {movements.map(m => {
                    const isPositive = m.quantityChanged > 0;
                    return (
                      <tr key={m.id}>
                        {/* 1. Date & Staff */}
                        <td>
                          <div className="font-monospace small text-dark fw-semibold">
                            {formatDateTime(m.createdAt)}
                          </div>
                          <div className="small text-muted d-flex align-items-center gap-1 mt-0">
                            <i className="bi bi-person text-primary" style={{ fontSize: '0.8rem' }}></i>
                            <span>{m.performedBy || 'Admin'}</span>
                          </div>
                        </td>

                        {/* 2. Equipment */}
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <span className="badge bg-dark font-monospace" style={{ fontSize: '0.72rem' }}>
                              {m.assetTag}
                            </span>
                            <span className="fw-semibold text-dark small">
                              {m.equipmentName}
                            </span>
                          </div>
                        </td>

                        {/* 3. Movement & Delta */}
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <span className={`badge ${
                              m.type === 'INITIAL_STOCK' || m.type === 'RESTOCK' || m.type === 'STOCK_IN' || m.type === 'CHECK_IN'
                                ? 'bg-success-subtle text-success border border-success-subtle'
                                : m.type === 'DAMAGED_WRITE_OFF' || m.type === 'STOCK_REDUCTION'
                                ? 'bg-danger-subtle text-danger border border-danger-subtle'
                                : m.type === 'CHECK_OUT'
                                ? 'bg-primary-subtle text-primary border border-primary-subtle'
                                : 'bg-warning-subtle text-warning border border-warning-subtle'
                            } small font-monospace`}>
                              {m.type}
                            </span>
                            <span className={`fw-bold small ${isPositive ? 'text-success' : 'text-danger'}`}>
                              {isPositive ? `+${m.quantityChanged}` : m.quantityChanged}
                            </span>
                          </div>
                        </td>

                        {/* 4. Stock Progression & Ref */}
                        <td>
                          <div className="small font-monospace">
                            <span className="text-muted">{m.previousAvailable}</span>
                            <i className="bi bi-arrow-right mx-1 text-secondary"></i>
                            <strong className="text-dark">{m.newAvailable}</strong>
                            <span className="text-muted ms-1" style={{ fontSize: '0.72rem' }}>
                              ({m.newTotal} tot)
                            </span>
                          </div>
                          {m.reference && (
                            <div className="small font-monospace text-secondary text-truncate" style={{ maxWidth: '180px' }} title={m.reference}>
                              <i className="bi bi-tag me-1 text-muted"></i>{m.reference}
                            </div>
                          )}
                        </td>

                        {/* 5. Notes & Details */}
                        <td>
                          <div className="small text-secondary" style={{ wordBreak: 'break-word' }}>
                            {m.notes || <span className="text-muted fst-italic">No additional notes</span>}
                          </div>
                        </td>

                        {isAdmin && (
                          <td className="text-end">
                            <button
                              type="button"
                              className="btn btn-light border btn-sm text-danger"
                              style={{ width: '28px', height: '28px', padding: 0 }}
                              title="Delete Movement Record"
                              onClick={() => handleDeleteMovement(m)}
                            >
                              <i className="bi bi-trash" style={{ fontSize: '0.75rem' }}></i>
                            </button>
                          </td>
                        )}
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
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setShowRestockModal(false)}
                  aria-label="Close"
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>

              <form onSubmit={handleRestockSubmit}>
                <div className="modal-body p-4">
                  {/* Category Selection Filter */}
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Filter Equipment by Category</label>
                    <select
                      className="form-select form-select-sm"
                      value={restockCategory}
                      onChange={(e) => {
                        const cat = e.target.value;
                        setRestockCategory(cat);
                        const filtered = cat === 'ALL'
                          ? equipmentList
                          : equipmentList.filter(item => item.categoryId === cat || item.category?.id === cat);
                        if (filtered.length > 0) {
                          setSelectedGearId(filtered[0].id);
                        } else {
                          setSelectedGearId('');
                        }
                      }}
                    >
                      <option value="ALL">All Categories ({equipmentList.length} items)</option>
                      {categories.map(c => {
                        const count = equipmentList.filter(item => item.categoryId === c.id || item.category?.id === c.id).length;
                        return (
                          <option key={c.id} value={c.id}>
                            {c.name} ({count} items)
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Select Gear Model</label>
                    <select
                      className="form-select form-select-sm"
                      value={selectedGearId}
                      onChange={(e) => setSelectedGearId(e.target.value)}
                      required
                    >
                      {(restockCategory === 'ALL'
                        ? equipmentList
                        : equipmentList.filter(item => item.categoryId === restockCategory || item.category?.id === restockCategory)
                      ).map(item => (
                        <option key={item.id} value={item.id}>
                          {item.assetTag} - {item.name} ({item.availableQuantity ?? item.quantity} avail / {item.quantity} total)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Quantity to Add</label>
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