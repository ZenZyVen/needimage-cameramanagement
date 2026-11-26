import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getEquipment,
  getCategories,
  adjustStock
} from '../services/equipmentService';
import StatusBadge from '../components/common/StatusBadge';
import { formatCurrency } from '../utils/formatters';

const LowStockAlerts = () => {
  const { user, isAdmin, isStaff } = useAuth();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [severityFilter, setSeverityFilter] = useState('ALL'); // ALL, OUT_OF_STOCK, LOW_STOCK
  const [catFilter, setCatFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Restock Modal
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [selectedGear, setSelectedGear] = useState(null);
  const [restockQty, setRestockQty] = useState(1);
  const [restockReason, setRestockReason] = useState('PO-2026-RESTOCK');
  const [restockNotes, setRestockNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [alertMsg, setAlertMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadAlertGear();
  }, [severityFilter, catFilter, searchTerm]);

  const loadCategories = async () => {
    try {
      const res = await getCategories();
      if (res.data?.data) setCategories(res.data.data);
    } catch (e) {
      console.warn('Error loading categories:', e);
    }
  };

  const loadAlertGear = async () => {
    try {
      setLoading(true);
      const res = await getEquipment({ limit: 150 });
      if (res.data?.success) {
        let allGear = res.data.data || [];

        // Filter only items that are Low Stock (<= 2) or Out of Stock (0)
        let alertList = allGear.filter(g => {
          const avail = g.availableQuantity !== undefined ? g.availableQuantity : (g.status === 'AVAILABLE' ? g.quantity : 0);
          return avail <= 2;
        });

        // Filter by Severity
        if (severityFilter === 'OUT_OF_STOCK') {
          alertList = alertList.filter(g => (g.availableQuantity !== undefined ? g.availableQuantity : 0) === 0);
        } else if (severityFilter === 'LOW_STOCK') {
          alertList = alertList.filter(g => {
            const avail = g.availableQuantity !== undefined ? g.availableQuantity : 0;
            return avail > 0 && avail <= 2;
          });
        }

        // Filter by Category
        if (catFilter !== 'ALL') {
          alertList = alertList.filter(g => g.categoryId === catFilter);
        }

        // Search
        if (searchTerm.trim()) {
          const q = searchTerm.trim().toLowerCase();
          alertList = alertList.filter(g =>
            (g.name && g.name.toLowerCase().includes(q)) ||
            (g.assetTag && g.assetTag.toLowerCase().includes(q)) ||
            (g.brand && g.brand.toLowerCase().includes(q)) ||
            (g.model && g.model.toLowerCase().includes(q))
          );
        }

        // Sort: 0 units first (critical), then ascending by available units
        alertList.sort((a, b) => {
          const availA = a.availableQuantity !== undefined ? a.availableQuantity : 0;
          const availB = b.availableQuantity !== undefined ? b.availableQuantity : 0;
          return availA - availB;
        });

        setItems(alertList);
      }
    } catch (e) {
      console.warn('Error loading low stock gear:', e);
    } finally {
      setLoading(false);
    }
  };

  const openRestockModal = (gear) => {
    setSelectedGear(gear);
    setRestockQty(Math.max(1, (gear.quantity || 1) - (gear.availableQuantity || 0)));
    setRestockReason('RESTOCK_INTAKE');
    setRestockNotes('');
    setShowRestockModal(true);
  };

  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    if (!selectedGear) return;
    const qty = parseInt(restockQty, 10);
    if (isNaN(qty) || qty <= 0) return;

    try {
      setSubmitting(true);
      await adjustStock(selectedGear.id, {
        adjustment: qty,
        reason: restockReason || 'RESTOCK_PURCHASE',
        notes: restockNotes || `Restocked ${qty} units to resolve critical alert.`,
        type: 'RESTOCK'
      });
      setAlertMsg({
        type: 'success',
        text: `Restocked ${qty} unit(s) of ${selectedGear.assetTag} (${selectedGear.name}). Stock levels restored!`
      });
      setShowRestockModal(false);
      loadAlertGear();
    } catch (err) {
      setAlertMsg({ type: 'danger', text: err.response?.data?.message || 'Failed to restock.' });
    } finally {
      setSubmitting(false);
    }
  };

  // KPI Calculations
  const outOfStockCount = items.filter(g => (g.availableQuantity ?? 0) === 0).length;
  const lowStockCount = items.filter(g => (g.availableQuantity ?? 0) > 0).length;
  const totalValuationAtRisk = items.reduce((acc, g) => acc + ((g.purchasePrice || 0) * (g.quantity || 1)), 0);

  return (
    <div className="pb-5">
      {/* Page Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-2">
        <div className="d-flex align-items-center gap-2">
          <h4 className="fw-bold text-dark mb-0">Low-Stock Critical Alerts</h4>
          <span className="badge bg-danger text-white small px-2 py-1">
            {items.length} Attention Required
          </span>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1 shadow-sm px-3"
            onClick={loadAlertGear}
          >
            <i className="bi bi-arrow-clockwise"></i>
            <span>Refresh Alerts</span>
          </button>
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

      {/* KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm h-100 border-start border-danger border-3">
            <div className="kpi-card">
              <span className="kpi-label" title="Critical (Out of Stock)">Critical (Out of Stock)</span>
              <div className="kpi-value text-danger">{outOfStockCount}</div>
              <span className="kpi-sub">0 available in vault</span>
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm h-100 border-start border-warning border-3">
            <div className="kpi-card">
              <span className="kpi-label" title="Low Stock Warning">Low Stock Warning</span>
              <div className="kpi-value text-warning">{lowStockCount}</div>
              <span className="kpi-sub">1 to 2 units remaining</span>
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm h-100 border-start border-primary border-3">
            <div className="kpi-card">
              <span className="kpi-label" title="Total Attention Needed">Total Attention Needed</span>
              <div className="kpi-value text-primary">{items.length}</div>
              <span className="kpi-sub">catalog items flagged</span>
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm h-100 border-start border-secondary border-3">
            <div className="kpi-card">
              <span className="kpi-label" title="Flagged Asset Valuation">Flagged Asset Valuation</span>
              <div className="kpi-value text-dark">{formatCurrency(totalValuationAtRisk)}</div>
              <span className="kpi-sub">replacement value</span>
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
                  placeholder="Search equipment..."
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

            <div className="col-md-4">
              <select
                className="form-select form-select-sm"
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
              >
                <option value="ALL">All Alert Levels</option>
                <option value="OUT_OF_STOCK">Critical Out of Stock Only (0 Avail)</option>
                <option value="LOW_STOCK">Low Stock Warning Only (1-2 Avail)</option>
              </select>
            </div>

            <div className="col-md-3">
              <select
                className="form-select form-select-sm"
                value={catFilter}
                onChange={(e) => setCatFilter(e.target.value)}
              >
                <option value="ALL">All Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary spinner-border-sm"></div>
              <span className="text-muted small ms-2">Analyzing vault inventory levels...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-shield-check fs-2 text-success d-block mb-1"></i>
              <strong className="text-dark d-block">All Stock Levels Healthy</strong>
              <span className="small">No equipment models are currently out of stock or below threshold.</span>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light text-muted small">
                  <tr>
                    <th>Alert Severity</th>
                    <th style={{ width: '90px' }}>Asset Tag</th>
                    <th>Equipment & Model</th>
                    <th>Category</th>
                    <th className="text-center" style={{ width: '160px' }}>Vault Availability</th>
                    <th>Storage Shelf</th>
                    <th>Daily Rate</th>
                    <th>Status</th>
                    {isAdmin && <th className="text-end" style={{ width: '130px' }}>Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {items.map(gear => {
                    const total = gear.quantity || 1;
                    const avail = gear.availableQuantity !== undefined ? gear.availableQuantity : (gear.status === 'AVAILABLE' ? total : 0);
                    const isZero = avail === 0;
                    const percent = Math.min(100, Math.round((avail / total) * 100));

                    return (
                      <tr key={gear.id}>
                        <td>
                          {isZero ? (
                            <span className="badge bg-danger-subtle text-danger border border-danger-subtle d-inline-flex align-items-center gap-1 font-monospace" style={{ fontSize: '0.68rem' }}>
                              <i className="bi bi-exclamation-octagon-fill"></i> OUT OF STOCK
                            </span>
                          ) : (
                            <span className="badge bg-warning-subtle text-warning border border-warning-subtle d-inline-flex align-items-center gap-1 font-monospace" style={{ fontSize: '0.68rem' }}>
                              <i className="bi bi-exclamation-triangle-fill"></i> LOW STOCK
                            </span>
                          )}
                        </td>

                        <td>
                          <span className="badge bg-dark font-monospace" style={{ fontSize: '0.72rem' }}>
                            {gear.assetTag}
                          </span>
                        </td>

                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <img
                              src={gear.imageUrl || 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=80&auto=format&fit=crop&q=80'}
                              alt=""
                              referrerPolicy="no-referrer"
                              className="rounded border"
                              style={{ width: '38px', height: '38px', objectFit: 'cover' }}
                              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=80&auto=format&fit=crop&q=80'; }}
                            />
                            <div>
                              <div className="fw-bold text-dark small text-truncate" style={{ maxWidth: '240px' }} title={gear.name}>
                                {gear.name}
                              </div>
                              <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                                {gear.brand} {gear.model}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="small text-secondary">
                          {gear.category?.name || 'General'}
                        </td>

                        <td>
                          <div className="d-flex justify-content-between align-items-center small mb-1">
                            <strong className={isZero ? 'text-danger' : 'text-warning'}>
                              {avail} of {total} avail
                            </strong>
                            <span className="text-muted" style={{ fontSize: '0.7rem' }}>{percent}%</span>
                          </div>
                          <div className="progress" style={{ height: '5px' }}>
                            <div
                              className={`progress-bar ${isZero ? 'bg-danger' : 'bg-warning'}`}
                              role="progressbar"
                              style={{ width: `${percent}%` }}
                            ></div>
                          </div>
                        </td>

                        <td className="small font-monospace text-muted">
                          <i className="bi bi-geo-alt me-1 text-secondary"></i>
                          {gear.location || 'Vault Shelf A'}
                        </td>

                        <td className="small font-monospace text-dark">
                          {formatCurrency(gear.dailyRate || 100)}/day
                        </td>

                        <td>
                          <StatusBadge status={gear.status} />
                        </td>

                        {isAdmin && (
                          <td className="text-end">
                            <button
                              type="button"
                              className="btn btn-primary btn-sm py-1 px-2 d-inline-flex align-items-center gap-1 shadow-sm"
                              style={{ fontSize: '0.75rem' }}
                              onClick={() => openRestockModal(gear)}
                            >
                              <i className="bi bi-plus-lg"></i>
                              <span>Restock</span>
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

      {/* RESTOCK MODAL */}
      {showRestockModal && selectedGear && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-slate-900 text-white" style={{ backgroundColor: '#0f172a' }}>
                <div className="d-flex align-items-center gap-2">
                  <div className="p-2 rounded bg-primary-subtle text-primary d-flex align-items-center justify-content-center" style={{ width: 32, height: 32 }}>
                    <i className="bi bi-box-arrow-in-down"></i>
                  </div>
                  <h6 className="modal-title fw-bold text-white mb-0">Restock {selectedGear.assetTag} - {selectedGear.name}</h6>
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
                  <div className="p-2 border rounded bg-light mb-3 small d-flex justify-content-between align-items-center">
                    <div>
                      <span className="text-muted">Current Available: </span>
                      <strong className="text-danger">{selectedGear.availableQuantity ?? 0}</strong>
                    </div>
                    <div>
                      <span className="text-muted">Total Units: </span>
                      <strong>{selectedGear.quantity || 1}</strong>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Units to Add</label>
                    <input
                      type="number"
                      min="1"
                      className="form-control"
                      value={restockQty}
                      onChange={(e) => setRestockQty(e.target.value)}
                      required
                    />
                    <small className="text-muted">This will immediately resolve the alert and update available stock.</small>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Purchase Order / Delivery Reference</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="PO / reference number"
                      value={restockReason}
                      onChange={(e) => setRestockReason(e.target.value)}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Restock Notes</label>
                    <textarea
                      className="form-control form-control-sm"
                      rows="2"
                      placeholder="Restock notes (optional)"
                      value={restockNotes}
                      onChange={(e) => setRestockNotes(e.target.value)}
                    ></textarea>
                  </div>
                </div>

                <div className="modal-footer bg-light px-4 py-3">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowRestockModal(false)}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary px-4 fw-semibold"
                    disabled={submitting}
                  >
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

export default LowStockAlerts;