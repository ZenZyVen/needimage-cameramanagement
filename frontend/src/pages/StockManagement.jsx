import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getEquipment,
  getCategories,
  adjustStock,
  getStockMovements,
  getStockDashboard
} from '../services/equipmentService';
import { triggerNotificationRefresh } from '../context/NotificationContext';
import StatusBadge from '../components/common/StatusBadge';
import { formatCurrency, formatDate, formatDateTime } from '../utils/formatters';

const DEDUCTION_REASONS = [
  { value: 'DAMAGED_WRITE_OFF', label: 'Damaged / Beyond Repair Write-off' },
  { value: 'LOST_IN_FIELD', label: 'Lost / Unrecoverable in Field' },
  { value: 'RETIRED_SALE', label: 'Decommissioned / Studio Asset Sale' },
  { value: 'AUDIT_DISCREPANCY', label: 'Physical Audit Discrepancy' }
];

const StockManagement = () => {
  const { user, isAdmin, isStaff } = useAuth();
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'history'

  // Data states
  const [equipmentList, setEquipmentList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [movements, setMovements] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters for inventory tab
  const [catFilter, setCatFilter] = useState('ALL');
  const [stockHealthFilter, setStockHealthFilter] = useState('ALL'); // ALL, AVAILABLE, LOW_STOCK, OUT_OF_STOCK
  const [searchTerm, setSearchTerm] = useState('');

  // Filters for history tab
  const [historyTypeFilter, setHistoryTypeFilter] = useState('ALL');
  const [historySearch, setHistorySearch] = useState('');
  const [historyStartDate, setHistoryStartDate] = useState('');
  const [historyEndDate, setHistoryEndDate] = useState('');

  // Restock Modal
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [selectedItemForAction, setSelectedItemForAction] = useState(null);
  const [actionModalCategory, setActionModalCategory] = useState('ALL');
  const [restockQty, setRestockQty] = useState(1);
  const [restockReason, setRestockReason] = useState('PO-2026-INSPECTION');
  const [restockNotes, setRestockNotes] = useState('');

  // Deduct Modal
  const [showDeductModal, setShowDeductModal] = useState(false);
  const [deductQty, setDeductQty] = useState(1);
  const [deductType, setDeductType] = useState('DAMAGED_WRITE_OFF');
  const [deductReason, setDeductReason] = useState('');
  const [deductNotes, setDeductNotes] = useState('');

  // Notifications
  const [alertMsg, setAlertMsg] = useState({ type: '', text: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCategories();
    loadDashboardSummary();
  }, []);

  useEffect(() => {
    if (activeTab === 'inventory') {
      loadInventory();
    } else {
      loadHistory();
    }
  }, [activeTab, catFilter, stockHealthFilter, searchTerm, historyTypeFilter, historySearch, historyStartDate, historyEndDate]);

  const loadCategories = async () => {
    try {
      const res = await getCategories();
      if (res.data?.data) setCategories(res.data.data);
    } catch (e) {
      console.warn('Error loading categories:', e);
    }
  };

  const loadDashboardSummary = async () => {
    try {
      const res = await getStockDashboard();
      if (res.data?.success) {
        setSummary(res.data.summary);
      }
    } catch (e) {
      console.warn('Error loading stock summary:', e);
    }
  };

  const loadInventory = async () => {
    try {
      setLoading(true);
      const params = {
        limit: 100,
        search: searchTerm.trim() || undefined,
        categoryId: catFilter !== 'ALL' ? catFilter : undefined
      };
      const res = await getEquipment(params);
      if (res.data?.success) {
        let items = res.data.data || [];
        if (stockHealthFilter === 'LOW_STOCK') {
          items = items.filter(i => (i.availableQuantity !== undefined ? i.availableQuantity : i.quantity) <= 2 && (i.availableQuantity !== undefined ? i.availableQuantity : i.quantity) > 0);
        } else if (stockHealthFilter === 'OUT_OF_STOCK') {
          items = items.filter(i => (i.availableQuantity !== undefined ? i.availableQuantity : i.quantity) === 0);
        } else if (stockHealthFilter === 'AVAILABLE') {
          items = items.filter(i => (i.availableQuantity !== undefined ? i.availableQuantity : i.quantity) > 0);
        }
        setEquipmentList(items);
      }
    } catch (e) {
      setAlertMsg({ type: 'danger', text: 'Failed to load equipment stock.' });
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      setLoading(true);
      const params = {
        type: historyTypeFilter !== 'ALL' ? historyTypeFilter : undefined,
        search: historySearch.trim() || undefined,
        startDate: historyStartDate || undefined,
        endDate: historyEndDate || undefined,
        limit: 150
      };
      const res = await getStockMovements(params);
      if (res.data?.success) {
        setMovements(res.data.data || []);
      }
    } catch (e) {
      setAlertMsg({ type: 'danger', text: 'Failed to load stock movements history.' });
    } finally {
      setLoading(false);
    }
  };

  // Open Restock Modal
  const openRestock = (item = null) => {
    const cat = item ? (item.categoryId || 'ALL') : 'ALL';
    setActionModalCategory(cat);
    setSelectedItemForAction(item || equipmentList[0] || null);
    setRestockQty(1);
    setRestockReason('RESTOCK_INTAKE');
    setRestockNotes('');
    setShowRestockModal(true);
  };

  // Open Deduct Modal
  const openDeduct = (item = null) => {
    const target = item || equipmentList[0] || null;
    const cat = target ? (target.categoryId || 'ALL') : 'ALL';
    setActionModalCategory(cat);
    setSelectedItemForAction(target);
    setDeductQty(1);
    setDeductType('DAMAGED_WRITE_OFF');
    setDeductReason('');
    setDeductNotes('');
    setShowDeductModal(true);
  };

  // Filter equipment list for modal by selected category
  const modalEquipmentOptions = equipmentList.filter(item => {
    if (actionModalCategory === 'ALL') return true;
    return item.categoryId === actionModalCategory;
  });

  // Handle Restock Submit
  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItemForAction) return;
    const qty = parseInt(restockQty, 10);
    if (isNaN(qty) || qty <= 0) {
      setAlertMsg({ type: 'warning', text: 'Please enter a valid positive quantity to restock.' });
      return;
    }

    try {
      setSubmitting(true);
      await adjustStock(selectedItemForAction.id, {
        adjustment: qty,
        reason: restockReason || 'PURCHASE_INTAKE',
        notes: restockNotes || `Restocked ${qty} physical units into vault.`,
        type: 'RESTOCK'
      });
      setAlertMsg({
        type: 'success',
        text: `Successfully added ${qty} unit(s) to ${selectedItemForAction.assetTag} (${selectedItemForAction.name}). Stock levels updated!`
      });
      triggerNotificationRefresh();
      setShowRestockModal(false);
      loadInventory();
      loadDashboardSummary();
      loadHistory();
    } catch (err) {
      setAlertMsg({ type: 'danger', text: err.response?.data?.message || 'Failed to restock equipment.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Deduct Submit
  const handleDeductSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItemForAction) return;
    const qty = parseInt(deductQty, 10);
    if (isNaN(qty) || qty <= 0) {
      setAlertMsg({ type: 'warning', text: 'Please enter a valid positive quantity to remove.' });
      return;
    }

    const currentAvail = selectedItemForAction.availableQuantity !== undefined
      ? selectedItemForAction.availableQuantity
      : (selectedItemForAction.quantity || 1);

    if (qty > currentAvail) {
      setAlertMsg({
        type: 'danger',
        text: `Cannot remove ${qty} unit(s). Only ${currentAvail} unit(s) are physically available in the vault.`
      });
      return;
    }

    try {
      setSubmitting(true);
      await adjustStock(selectedItemForAction.id, {
        adjustment: -qty,
        reason: deductReason || deductType,
        notes: deductNotes || `Stock deduction of ${qty} units: ${deductType}`,
        type: deductType
      });
      setAlertMsg({
        type: 'warning',
        text: `Successfully removed ${qty} unit(s) from ${selectedItemForAction.assetTag}. Inventory records and movement log updated.`
      });
      triggerNotificationRefresh();
      setShowDeductModal(false);
      loadInventory();
      loadDashboardSummary();
      loadHistory();
    } catch (err) {
      setAlertMsg({ type: 'danger', text: err.response?.data?.message || 'Failed to adjust stock.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Export CSV of Stock Ledger
  const handleExportCSV = () => {
    if (movements.length === 0) return;
    const headers = ['Date', 'Asset Tag', 'Equipment Name', 'Action Type', 'Qty Changed', 'Avail Before', 'Avail After', 'Total Before', 'Total After', 'Reference', 'Notes', 'Handled By'];
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
      `"${(m.performedBy || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `cinevault-stock-ledger-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="pb-5">
      {/* Top Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-2">
        <div>
          <h4 className="fw-bold text-dark mb-0">Stock Management</h4>
        </div>

        {isAdmin && (
          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1 shadow-sm px-3"
              onClick={() => openDeduct()}
            >
              <i className="bi bi-dash-circle"></i>
              <span>Deduct / Write-Off</span>
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm d-flex align-items-center gap-1 shadow-sm px-3 fw-semibold"
              onClick={() => openRestock()}
            >
              <i className="bi bi-plus-circle"></i>
              <span>Restock Equipment</span>
            </button>
          </div>
        )}
      </div>

      {alertMsg.text && (
        <div className={`alert alert-${alertMsg.type} alert-dismissible fade show py-2 small mb-4`} role="alert">
          <div className="d-flex align-items-center gap-2">
            <i className={`bi ${alertMsg.type === 'success' ? 'bi-check-circle-fill' : alertMsg.type === 'danger' ? 'bi-exclamation-octagon-fill' : 'bi-info-circle-fill'}`}></i>
            <span>{alertMsg.text}</span>
          </div>
          <button type="button" className="btn-close py-2" onClick={() => setAlertMsg({ type: '', text: '' })}></button>
        </div>
      )}

      {/* KPI Metric Summary Cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-2">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-3">
              <span className="text-muted small d-block">Total Equipment</span>
              <h4 className="fw-bold text-dark mb-0 mt-1">{summary?.totalEquipmentCount || equipmentList.length}</h4>
              <span className="text-muted" style={{ fontSize: '0.7rem' }}>catalog items</span>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-2">
          <div className="card border-0 shadow-sm h-100 border-start border-primary border-3">
            <div className="card-body p-3">
              <span className="text-muted small d-block">Total Stock Units</span>
              <h4 className="fw-bold text-primary mb-0 mt-1">{summary?.totalStockUnits || 0}</h4>
              <span className="text-muted" style={{ fontSize: '0.7rem' }}>physical units</span>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-2">
          <div className="card border-0 shadow-sm h-100 border-start border-success border-3">
            <div className="card-body p-3">
              <span className="text-muted small d-block">Available In Vault</span>
              <h4 className="fw-bold text-success mb-0 mt-1">{summary?.availableStockUnits || 0}</h4>
              <span className="text-muted" style={{ fontSize: '0.7rem' }}>ready for loan</span>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-2">
          <div className="card border-0 shadow-sm h-100 border-start border-info border-3">
            <div className="card-body p-3">
              <span className="text-muted small d-block">Checked Out On Set</span>
              <h4 className="fw-bold text-info mb-0 mt-1">{summary?.borrowedStockUnits || 0}</h4>
              <span className="text-muted" style={{ fontSize: '0.7rem' }}>active in field</span>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-2">
          <div className="card border-0 shadow-sm h-100 border-start border-warning border-3">
            <div className="card-body p-3">
              <span className="text-muted small d-block">In Maintenance</span>
              <h4 className="fw-bold text-warning mb-0 mt-1">{summary?.maintenanceStockUnits || 0}</h4>
              <span className="text-muted" style={{ fontSize: '0.7rem' }}>quarantined units</span>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-2">
          <div className="card border-0 shadow-sm h-100 border-start border-secondary border-3">
            <div className="card-body p-3">
              <span className="text-muted small d-block">Total Vault Value</span>
              <h5 className="fw-bold text-dark mb-0 mt-1">{formatCurrency(summary?.totalValuation || 0)}</h5>
              <span className="text-muted" style={{ fontSize: '0.7rem' }}>asset valuation</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-white border-bottom p-2 px-3">
          <ul className="nav nav-pills card-header-pills">
            <li className="nav-item">
              <button
                className={`nav-link py-2 px-3 ${activeTab === 'inventory' ? 'active fw-bold' : 'text-secondary'}`}
                onClick={() => setActiveTab('inventory')}
              >
                <i className="bi bi-boxes me-2"></i>
                Vault Stock Levels & Restock
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link py-2 px-3 ${activeTab === 'history' ? 'active fw-bold' : 'text-secondary'}`}
                onClick={() => setActiveTab('history')}
              >
                <i className="bi bi-clock-history me-2"></i>
                Complete Stock History & Ledger
                {movements.length > 0 && (
                  <span className="badge bg-secondary-subtle text-secondary ms-2 border" style={{ fontSize: '0.68rem' }}>
                    {movements.length}
                  </span>
                )}
              </button>
            </li>
          </ul>
        </div>

        {/* TAB 1: Vault Stock Levels */}
        {activeTab === 'inventory' && (
          <div className="card-body p-3">
            {/* Filter Bar */}
            <div className="row g-2 mb-3">
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
                  value={catFilter}
                  onChange={(e) => setCatFilter(e.target.value)}
                >
                  <option value="ALL">All Categories</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="col-md-3">
                <select
                  className="form-select form-select-sm"
                  value={stockHealthFilter}
                  onChange={(e) => setStockHealthFilter(e.target.value)}
                >
                  <option value="ALL">All Stock Health Levels</option>
                  <option value="AVAILABLE">In Stock & Available</option>
                  <option value="LOW_STOCK">Low Stock (2 units or less)</option>
                  <option value="OUT_OF_STOCK">Out of Stock (0 available)</option>
                </select>
              </div>
            </div>

            {/* Table */}
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary spinner-border-sm"></div>
                <span className="text-muted small ms-2">Loading stock levels...</span>
              </div>
            ) : equipmentList.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <i className="bi bi-inbox fs-2 text-secondary d-block mb-1"></i>
                No equipment matching your stock criteria.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light text-muted small">
                    <tr>
                      <th style={{ width: '90px' }}>Asset Tag</th>
                      <th>Equipment & Model</th>
                      <th>Category</th>
                      <th className="text-center">Total Stock</th>
                      <th className="text-center">Available</th>
                      <th className="text-center">On Loan</th>
                      <th className="text-center">Maintenance</th>
                      <th>Status</th>
                      {isAdmin && <th className="text-end" style={{ width: '180px' }}>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {equipmentList.map(eq => {
                      const total = eq.quantity || 1;
                      const avail = eq.availableQuantity !== undefined ? eq.availableQuantity : (eq.status === 'AVAILABLE' ? total : 0);
                      const onLoan = Math.max(0, total - avail);
                      const isLow = avail <= 2 && avail > 0;
                      const isOut = avail === 0;

                      return (
                        <tr key={eq.id}>
                          <td>
                            <span className="badge bg-dark font-monospace" style={{ fontSize: '0.72rem' }}>
                              {eq.assetTag}
                            </span>
                          </td>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <img
                                src={eq.imageUrl || 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=80&auto=format&fit=crop&q=80'}
                                alt=""
                                className="rounded border"
                                style={{ width: '38px', height: '38px', objectFit: 'cover' }}
                              />
                              <div>
                                <div className="fw-bold text-dark small">{eq.name}</div>
                                <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                                  {eq.brand} {eq.model} • SN: {eq.serialNumber || '—'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="small text-secondary">
                            {eq.category?.name || 'General'}
                          </td>
                          <td className="text-center fw-bold text-dark">
                            {total}
                          </td>
                          <td className="text-center">
                            <span className={`badge ${
                              isOut
                                ? 'bg-danger text-white'
                                : isLow
                                ? 'bg-warning text-dark'
                                : 'bg-success text-white'
                            } px-2 py-1`}>
                              {avail} units
                            </span>
                          </td>
                          <td className="text-center small text-muted">
                            {onLoan > 0 ? (
                              <span className="badge bg-info-subtle text-info border border-info-subtle">
                                {onLoan} loaned
                              </span>
                            ) : (
                              '0'
                            )}
                          </td>
                          <td className="text-center small text-muted">
                            {eq.status === 'UNDER_MAINTENANCE' ? (
                              <span className="badge bg-warning-subtle text-warning border">1 in shop</span>
                            ) : (
                              '0'
                            )}
                          </td>
                          <td>
                            <StatusBadge status={eq.status} />
                          </td>
                          {isAdmin && (
                            <td className="text-end">
                              <div className="btn-group btn-group-sm">
                                <button
                                  type="button"
                                  className="btn btn-outline-primary"
                                  title="Add units to stock"
                                  onClick={() => openRestock(eq)}
                                >
                                  <i className="bi bi-plus-lg me-1"></i> Restock
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-outline-danger"
                                  title="Remove or write-off stock"
                                  onClick={() => openDeduct(eq)}
                                  disabled={avail === 0}
                                >
                                  <i className="bi bi-dash-lg me-1"></i> Deduct
                                </button>
                              </div>
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
        )}

        {/* TAB 2: Complete Stock History & Ledger */}
        {activeTab === 'history' && (
          <div className="card-body p-3">
            {/* History Filter Bar */}
            <div className="row g-2 mb-3">
              <div className="col-md-4">
                <div className="input-group input-group-sm">
                  <span className="input-group-text bg-white"><i className="bi bi-search text-muted"></i></span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search ledger..."
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                  />
                  {historySearch && (
                    <button className="btn btn-outline-secondary" type="button" onClick={() => setHistorySearch('')}>
                      <i className="bi bi-x"></i>
                    </button>
                  )}
                </div>
              </div>

              <div className="col-md-3">
                <select
                  className="form-select form-select-sm"
                  value={historyTypeFilter}
                  onChange={(e) => setHistoryTypeFilter(e.target.value)}
                >
                  <option value="ALL">All Action Types</option>
                  <option value="RESTOCK">RESTOCK / Intake (+)</option>
                  <option value="STOCK_IN">STOCK_IN (+)</option>
                  <option value="STOCK_REDUCTION">STOCK_REDUCTION (-)</option>
                  <option value="DAMAGED_WRITE_OFF">DAMAGED_WRITE_OFF (-)</option>
                  <option value="CHECK_OUT">CHECK_OUT (Dispatched)</option>
                  <option value="CHECK_IN">CHECK_IN (Returned)</option>
                  <option value="MAINTENANCE">MAINTENANCE (Quarantined)</option>
                </select>
              </div>

              <div className="col-md-2">
                <input
                  type="date"
                  className="form-control form-control-sm"
                  value={historyStartDate}
                  onChange={(e) => setHistoryStartDate(e.target.value)}
                  title="Filter from date"
                />
              </div>

              <div className="col-md-2">
                <input
                  type="date"
                  className="form-control form-control-sm"
                  value={historyEndDate}
                  onChange={(e) => setHistoryEndDate(e.target.value)}
                  title="Filter to date"
                />
              </div>

              <div className="col-md-1 d-flex justify-content-end">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm w-100"
                  onClick={handleExportCSV}
                  title="Export Stock Ledger to CSV"
                  disabled={movements.length === 0}
                >
                  <i className="bi bi-download"></i> CSV
                </button>
              </div>
            </div>

            {/* History Table */}
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary spinner-border-sm"></div>
                <span className="text-muted small ms-2">Loading stock ledger records...</span>
              </div>
            ) : movements.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <i className="bi bi-journal-x fs-2 text-secondary d-block mb-1"></i>
                No stock movement records found for the selected timeframe.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light text-muted small">
                    <tr>
                      <th>Timestamp</th>
                      <th>Equipment Item</th>
                      <th>Action Type</th>
                      <th className="text-center">Quantity Change</th>
                      <th className="text-center">Vault Stock (Old → New)</th>
                      <th>Reference / PO</th>
                      <th>Notes / Description</th>
                      <th>Responsible Person</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movements.map((m) => {
                      const isPositive = m.quantityChanged > 0;
                      return (
                        <tr key={m.id}>
                          <td className="small text-nowrap font-monospace text-secondary">
                            {formatDateTime(m.createdAt)}
                          </td>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <span className="badge bg-dark font-monospace" style={{ fontSize: '0.68rem' }}>
                                {m.assetTag}
                              </span>
                              <span className="fw-semibold text-dark small text-truncate" style={{ maxWidth: '220px' }}>
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
                            } small`}>
                              {m.type}
                            </span>
                          </td>
                          <td className="text-center">
                            <span className={`fw-bold fs-6 ${isPositive ? 'text-success' : 'text-danger'}`}>
                              {isPositive ? `+${m.quantityChanged}` : m.quantityChanged}
                            </span>
                          </td>
                          <td className="text-center small font-monospace">
                            <span className="text-muted">{m.previousAvailable} avail</span>
                            <i className="bi bi-arrow-right mx-1 text-secondary"></i>
                            <span className="fw-bold text-dark">{m.newAvailable} avail</span>
                            <span className="text-muted ms-2" style={{ fontSize: '0.72rem' }}>
                              ({m.newTotal} total)
                            </span>
                          </td>
                          <td className="small font-monospace text-secondary">
                            {m.reference || '—'}
                          </td>
                          <td className="small text-muted text-truncate" style={{ maxWidth: '200px' }} title={m.notes}>
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
        )}
      </div>

      {/* RESTOCK MODAL */}
      {showRestockModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-slate-900 text-white" style={{ backgroundColor: '#0f172a' }}>
                <div className="d-flex align-items-center gap-2">
                  <div className="p-2 rounded bg-primary-subtle text-primary d-flex align-items-center justify-content-center" style={{ width: 32, height: 32 }}>
                    <i className="bi bi-box-arrow-in-down"></i>
                  </div>
                  <h6 className="modal-title fw-bold text-white mb-0">Restock Vault Inventory</h6>
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
                    <label className="form-label small fw-semibold text-secondary">
                      <i className="bi bi-tags-fill text-primary me-1"></i> 1. Select Equipment Category
                    </label>
                    <select
                      className="form-select form-select-sm"
                      value={actionModalCategory}
                      onChange={(e) => {
                        const catId = e.target.value;
                        setActionModalCategory(catId);
                        const matching = equipmentList.filter(i => catId === 'ALL' || i.categoryId === catId);
                        setSelectedItemForAction(matching.length > 0 ? matching[0] : null);
                      }}
                    >
                      <option value="ALL">All Categories ({equipmentList.length} total items)</option>
                      {categories.map(cat => {
                        const count = equipmentList.filter(i => i.categoryId === cat.id).length;
                        return (
                          <option key={cat.id} value={cat.id}>
                            {cat.name} ({count} items)
                          </option>
                        );
                      })}
                    </select>
                    <small className="text-muted">Displays only equipment belonging to the selected category.</small>
                  </div>

                  {/* Equipment Selector */}
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">
                      <i className="bi bi-camera-fill text-primary me-1"></i> 2. Choose Gear to Restock
                    </label>
                    <select
                      className="form-select form-select-sm"
                      value={selectedItemForAction?.id || ''}
                      onChange={(e) => {
                        const item = equipmentList.find(i => i.id === e.target.value);
                        setSelectedItemForAction(item || null);
                      }}
                      required
                      disabled={modalEquipmentOptions.length === 0}
                    >
                      {modalEquipmentOptions.length === 0 ? (
                        <option value="">No equipment registered in this category</option>
                      ) : (
                        modalEquipmentOptions.map(item => (
                          <option key={item.id} value={item.id}>
                            {item.assetTag} - {item.name} (Current: {item.availableQuantity || item.quantity} avail / {item.quantity} total)
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  {selectedItemForAction && (
                    <div className="p-2 border rounded bg-light mb-3 small d-flex justify-content-between align-items-center">
                      <div>
                        <span className="text-muted">Current Available: </span>
                        <strong className="text-success">{selectedItemForAction.availableQuantity ?? selectedItemForAction.quantity}</strong>
                      </div>
                      <div>
                        <span className="text-muted">Total Stock: </span>
                        <strong>{selectedItemForAction.quantity}</strong>
                      </div>
                      <div>
                        <span className="text-muted">Unit Cost: </span>
                        <strong>{formatCurrency(selectedItemForAction.purchasePrice || 0)}</strong>
                      </div>
                    </div>
                  )}

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
                    <small className="text-muted">Total stock and available stock will increase by this quantity.</small>
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
                    <label className="form-label small fw-semibold text-secondary">Log Notes / Intake Inspection</label>
                    <textarea
                      className="form-control form-control-sm"
                      rows="2"
                      placeholder="Intake notes (optional)"
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
                    {submitting ? 'Updating Stock...' : `Confirm Restock (+${restockQty})`}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* DEDUCT / WRITE-OFF MODAL */}
      {showDeductModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-slate-900 text-white" style={{ backgroundColor: '#0f172a' }}>
                <div className="d-flex align-items-center gap-2">
                  <div className="p-2 rounded bg-danger-subtle text-danger d-flex align-items-center justify-content-center" style={{ width: 32, height: 32 }}>
                    <i className="bi bi-box-arrow-up"></i>
                  </div>
                  <h6 className="modal-title fw-bold text-white mb-0">Deduct / Write-Off Stock</h6>
                </div>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setShowDeductModal(false)}
                  aria-label="Close"
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>

              <form onSubmit={handleDeductSubmit}>
                <div className="modal-body p-4">
                  {/* Category Selection Filter */}
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">
                      <i className="bi bi-tags-fill text-danger me-1"></i> 1. Select Equipment Category
                    </label>
                    <select
                      className="form-select form-select-sm"
                      value={actionModalCategory}
                      onChange={(e) => {
                        const catId = e.target.value;
                        setActionModalCategory(catId);
                        const matching = equipmentList.filter(i => catId === 'ALL' || i.categoryId === catId);
                        setSelectedItemForAction(matching.length > 0 ? matching[0] : null);
                      }}
                    >
                      <option value="ALL">All Categories ({equipmentList.length} total items)</option>
                      {categories.map(cat => {
                        const count = equipmentList.filter(i => i.categoryId === cat.id).length;
                        return (
                          <option key={cat.id} value={cat.id}>
                            {cat.name} ({count} items)
                          </option>
                        );
                      })}
                    </select>
                    <small className="text-muted">Displays only equipment belonging to the selected category.</small>
                  </div>

                  {/* Equipment Selector */}
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">
                      <i className="bi bi-camera-fill text-secondary me-1"></i> 2. Choose Gear to Deduct
                    </label>
                    <select
                      className="form-select form-select-sm"
                      value={selectedItemForAction?.id || ''}
                      onChange={(e) => {
                        const item = equipmentList.find(i => i.id === e.target.value);
                        setSelectedItemForAction(item || null);
                      }}
                      required
                      disabled={modalEquipmentOptions.length === 0}
                    >
                      {modalEquipmentOptions.length === 0 ? (
                        <option value="">No equipment registered in this category</option>
                      ) : (
                        modalEquipmentOptions.map(item => (
                          <option key={item.id} value={item.id}>
                            {item.assetTag} - {item.name} (Available: {item.availableQuantity || item.quantity} / {item.quantity} total)
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  {selectedItemForAction && (
                    <div className="p-2 border rounded bg-warning-subtle mb-3 small d-flex justify-content-between align-items-center">
                      <div>
                        <span className="text-muted">Available In Vault: </span>
                        <strong className="text-dark">{selectedItemForAction.availableQuantity ?? selectedItemForAction.quantity}</strong>
                      </div>
                      <div>
                        <span className="text-muted">Max Deductible: </span>
                        <strong className="text-danger">{selectedItemForAction.availableQuantity ?? selectedItemForAction.quantity} units</strong>
                      </div>
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Reason / Classification <span className="text-danger">*</span></label>
                    <select
                      className="form-select form-select-sm"
                      value={deductType}
                      onChange={(e) => setDeductType(e.target.value)}
                    >
                      {DEDUCTION_REASONS.map(r => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Quantity to Deduct <span className="text-danger">*</span></label>
                    <input
                      type="number"
                      min="1"
                      max={selectedItemForAction?.availableQuantity ?? selectedItemForAction?.quantity ?? 1}
                      className="form-control"
                      value={deductQty}
                      onChange={(e) => setDeductQty(e.target.value)}
                      required
                    />
                    <small className="text-muted">You cannot deduct more units than are physically present in the vault.</small>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Incident Reference / Ticket #</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Incident / ticket reference"
                      value={deductReason}
                      onChange={(e) => setDeductReason(e.target.value)}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Detailed Justification Notes</label>
                    <textarea
                      className="form-control form-control-sm"
                      rows="2"
                      placeholder="Write-off reason & authorization"
                      value={deductNotes}
                      onChange={(e) => setDeductNotes(e.target.value)}
                      required
                    ></textarea>
                  </div>
                </div>

                <div className="modal-footer bg-light px-4 py-3">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowDeductModal(false)}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-danger px-4 fw-semibold"
                    disabled={submitting}
                  >
                    {submitting ? 'Processing...' : `Confirm Write-Off (-${deductQty})`}
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

export default StockManagement;