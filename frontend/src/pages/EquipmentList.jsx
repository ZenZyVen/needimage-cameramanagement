import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getEquipment,
  getCategories,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  restoreEquipment,
  adjustStock,
  getStockDashboard
} from '../services/equipmentService';
import { createRequest } from '../services/requestService';
import { checkoutItems, checkinItems } from '../services/checkInOutService';

import EquipmentCard from '../components/equipment/EquipmentCard';
import EquipmentFormModal from '../components/equipment/EquipmentFormModal';
import EquipmentDetailModal from '../components/equipment/EquipmentDetailModal';
import CategoryModal from '../components/equipment/CategoryModal';
import QRModal from '../components/common/QRModal';
import QRScannerModal from '../components/common/QRScannerModal';
import RequestFormModal from '../components/requests/RequestFormModal';
import CheckoutModal from '../components/checkinout/CheckoutModal';
import CheckinModal from '../components/checkinout/CheckinModal';
import StatusBadge from '../components/common/StatusBadge';
import { formatCurrency, formatDate, formatDateTime } from '../utils/formatters';

const EquipmentList = () => {
  const { isStaff, isAdmin } = useAuth();
  const [searchParams] = useSearchParams();

  const [activeMainView, setActiveMainView] = useState('catalog'); // 'catalog' or 'stock-dashboard'
  const [equipmentList, setEquipmentList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'

  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'ALL');
  const [activeTabFilter, setActiveTabFilter] = useState(searchParams.get('status') || 'ALL'); // 'ALL', 'AVAILABLE', 'BORROWED', 'UNDER_MAINTENANCE', 'ARCHIVED'
  const [selectedCondition, setSelectedCondition] = useState(searchParams.get('condition') || 'ALL');

  // Sync URL query params when navigating from Dashboard or global search
  useEffect(() => {
    const qStatus = searchParams.get('status');
    const qCondition = searchParams.get('condition');
    const qSearch = searchParams.get('search');
    const qView = searchParams.get('view');
    if (qStatus) setActiveTabFilter(qStatus);
    if (qCondition) setSelectedCondition(qCondition);
    if (qSearch !== null) setSearch(qSearch);
    if (qView === 'stock-dashboard') setActiveMainView('stock-dashboard');
  }, [searchParams]);

  // Stock Dashboard Data
  const [dashboardTimeframe, setDashboardTimeframe] = useState('monthly');
  const [stockDashboardData, setStockDashboardData] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(false);

  // Modals state
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [viewingEquipment, setViewingEquipment] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrEquipment, setQrEquipment] = useState(null);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Stock Adjustment Modal
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustingEquipment, setAdjustingEquipment] = useState(null);
  const [adjustmentAmount, setAdjustmentAmount] = useState(1);
  const [adjustmentReason, setAdjustmentReason] = useState('Restock / New Purchase');
  const [adjustmentNotes, setAdjustmentNotes] = useState('');
  const [savingAdjustment, setSavingAdjustment] = useState(false);

  // Fast Workflow Modals (Checkout, Checkin, Request)
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestItem, setRequestItem] = useState(null);
  const [fastCheckoutItem, setFastCheckoutItem] = useState(null);
  const [showFastCheckout, setShowFastCheckout] = useState(false);
  const [fastCheckinItem, setFastCheckinItem] = useState(null);
  const [showFastCheckin, setShowFastCheckin] = useState(false);

  const [alertMsg, setAlertMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (activeMainView === 'catalog') {
      loadEquipment();
    } else {
      loadStockDashboard();
    }
  }, [search, selectedCategory, activeTabFilter, selectedCondition, activeMainView, dashboardTimeframe]);

  const loadCategories = async () => {
    try {
      const res = await getCategories();
      if (res.data?.success) {
        setCategories(res.data.data || []);
      }
    } catch (err) {
      console.warn('Could not load categories:', err);
    }
  };

  const loadEquipment = async () => {
    try {
      setLoading(true);
      const isArchived = activeTabFilter === 'ARCHIVED';
      const params = {
        search: search.trim() || undefined,
        categoryId: selectedCategory !== 'ALL' ? selectedCategory : undefined,
        status: (activeTabFilter !== 'ALL' && !isArchived) ? activeTabFilter : undefined,
        condition: selectedCondition !== 'ALL' ? selectedCondition : undefined,
        showDeleted: isArchived ? true : false,
        limit: 100
      };
      const res = await getEquipment(params);
      if (res.data?.success) {
        setEquipmentList(res.data.data || []);
      }
    } catch (err) {
      setAlertMsg({ type: 'danger', text: err.response?.data?.message || 'Error loading equipment catalog.' });
    } finally {
      setLoading(false);
    }
  };

  const loadStockDashboard = async () => {
    try {
      setLoadingDashboard(true);
      const res = await getStockDashboard({ timeframe: dashboardTimeframe });
      if (res.data?.success) {
        setStockDashboardData(res.data);
      }
    } catch (err) {
      console.warn('Could not load stock dashboard:', err);
    } finally {
      setLoadingDashboard(false);
    }
  };

  // Stock Metrics Calculations
  let totalStockUnits = 0;
  let availableStockUnits = 0;
  let borrowedStockUnits = 0;
  let maintenanceStockUnits = 0;
  let outOfStockCount = 0;
  let totalValuation = 0;

  equipmentList.forEach(item => {
    const qty = item.quantity || 1;
    const avail = item.availableQuantity !== undefined ? item.availableQuantity : (item.status === 'AVAILABLE' ? qty : 0);
    totalStockUnits += qty;
    availableStockUnits += avail;
    totalValuation += (item.purchasePrice || 0) * qty;

    if (avail === 0) outOfStockCount++;
    if (item.status === 'BORROWED' || item.status === 'IN_USE') borrowedStockUnits += Math.max(1, qty - avail);
    if (item.status === 'UNDER_MAINTENANCE' || item.status === 'DAMAGED') maintenanceStockUnits += Math.max(1, qty - avail);
  });

  const handleCreateOrUpdate = async (formData) => {
    if (editingEquipment) {
      await updateEquipment(editingEquipment.id, formData);
      setAlertMsg({ type: 'success', text: `Equipment ${formData.assetTag} updated successfully.` });
    } else {
      await createEquipment(formData);
      setAlertMsg({ type: 'success', text: `Equipment ${formData.assetTag} registered in stock vault.` });
    }
    loadEquipment();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Archive this equipment? It will be moved to the Archived/Deleted tab and can be restored anytime.')) {
      try {
        await deleteEquipment(id);
        setAlertMsg({ type: 'info', text: 'Equipment moved to archive.' });
        loadEquipment();
      } catch (err) {
        setAlertMsg({ type: 'danger', text: err.response?.data?.message || 'Cannot delete item.' });
      }
    }
  };

  const handleRestore = async (id) => {
    try {
      const res = await restoreEquipment(id);
      if (res.data?.success) {
        setAlertMsg({ type: 'success', text: res.data.message || 'Equipment restored to active inventory.' });
        loadEquipment();
      }
    } catch (err) {
      setAlertMsg({ type: 'danger', text: err.response?.data?.message || 'Error restoring equipment.' });
    }
  };

  const handleOpenAdjust = (eq) => {
    setAdjustingEquipment(eq);
    setAdjustmentAmount(1);
    setAdjustmentReason('Restock / New Purchase');
    setAdjustmentNotes('');
    setShowAdjustModal(true);
  };

  const handleSaveStockAdjustment = async (e) => {
    e.preventDefault();
    if (!adjustingEquipment) return;

    try {
      setSavingAdjustment(true);
      await adjustStock(adjustingEquipment.id, {
        adjustment: adjustmentAmount,
        reason: adjustmentReason,
        notes: adjustmentNotes
      });
      setShowAdjustModal(false);
      setAlertMsg({ type: 'success', text: `Stock adjusted for ${adjustingEquipment.assetTag}.` });
      loadEquipment();
      if (activeMainView === 'stock-dashboard') {
        loadStockDashboard();
      }
    } catch (err) {
      setAlertMsg({ type: 'danger', text: err.response?.data?.message || 'Failed to adjust stock.' });
    } finally {
      setSavingAdjustment(false);
    }
  };

  const handleFastCheckoutSubmit = async (payload) => {
    await checkoutItems(payload);
    setShowFastCheckout(false);
    setAlertMsg({ type: 'success', text: 'Handover complete. Stock automatically updated.' });
    loadEquipment();
  };

  const handleFastCheckinSubmit = async (payload) => {
    await checkinItems(payload);
    setShowFastCheckin(false);
    setAlertMsg({ type: 'success', text: 'Return complete. Stock automatically restored.' });
    loadEquipment();
  };

  const handleRequestSubmit = async (payload) => {
    await createRequest(payload);
    setShowRequestModal(false);
    setAlertMsg({ type: 'success', text: 'Borrow request submitted for review.' });
    loadEquipment();
  };

  return (
    <div>
      {/* Page Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-2">
        <div>
          <h4 className="fw-bold text-dark mb-0">Equipment Vault</h4>
        </div>

        <div className="d-flex flex-wrap align-items-center gap-2">
          {/* Main View Switcher */}
          <div className="btn-group btn-group-sm">
            <button
              type="button"
              className={`btn ${activeMainView === 'catalog' ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setActiveMainView('catalog')}
            >
              <i className="bi bi-grid me-1"></i> Stock Vault
            </button>
            <button
              type="button"
              className={`btn ${activeMainView === 'stock-dashboard' ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setActiveMainView('stock-dashboard')}
            >
              <i className="bi bi-speedometer2 me-1"></i> Stock Dashboard & History
            </button>
          </div>

          {isStaff && (
            <>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                onClick={() => setShowCategoryModal(true)}
              >
                <i className="bi bi-tags"></i>
                <span className="d-none d-sm-inline">Categories</span>
              </button>

              <button
                type="button"
                className="btn btn-sm btn-primary d-flex align-items-center gap-1 shadow-sm"
                onClick={() => {
                  setEditingEquipment(null);
                  setShowFormModal(true);
                }}
              >
                <i className="bi bi-plus-lg"></i>
                <span>Add Equipment</span>
              </button>
            </>
          )}
        </div>
      </div>

      {alertMsg.text && (
        <div className={`alert alert-${alertMsg.type} alert-dismissible fade show py-2 small mb-4`} role="alert">
          {alertMsg.text}
          <button type="button" className="btn-close py-2" onClick={() => setAlertMsg({ type: '', text: '' })}></button>
        </div>
      )}

      {/* KPI Stat Cards (Stock Overview - Balanced 6-Column Grid) */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-4 col-xl-2">
          <div className="card border-0 shadow-sm h-100">
            <div className="kpi-card text-center">
              <div className="kpi-label" title="Total Stock Units">Total Stock Units</div>
              <div className="kpi-value text-dark">{totalStockUnits}</div>
              <div className="kpi-sub">{equipmentList.length} unique models</div>
            </div>
          </div>
        </div>

        <div className="col-6 col-md-4 col-xl-2">
          <div className="card border-0 shadow-sm h-100">
            <div className="kpi-card text-center">
              <div className="kpi-label" title="Available in Vault">Available in Vault</div>
              <div className="kpi-value text-success">{availableStockUnits}</div>
              <div className="kpi-sub text-success">Ready for dispatch</div>
            </div>
          </div>
        </div>

        <div className="col-6 col-md-4 col-xl-2">
          <div className="card border-0 shadow-sm h-100">
            <div className="kpi-card text-center">
              <div className="kpi-label" title="Borrowed / In Use">Borrowed / In Use</div>
              <div className="kpi-value text-warning">{borrowedStockUnits}</div>
              <div className="kpi-sub">Active on production</div>
            </div>
          </div>
        </div>

        <div className="col-6 col-md-4 col-xl-2">
          <div className="card border-0 shadow-sm h-100">
            <div className="kpi-card text-center">
              <div className="kpi-label" title="In Maintenance">In Maintenance</div>
              <div className="kpi-value text-danger">{maintenanceStockUnits}</div>
              <div className="kpi-sub text-danger">Quarantined</div>
            </div>
          </div>
        </div>

        <div className="col-6 col-md-4 col-xl-2">
          <div className="card border-0 shadow-sm h-100">
            <div className="kpi-card text-center">
              <div className="kpi-label" title="Out of Stock">Out of Stock</div>
              <div className="kpi-value text-secondary">{outOfStockCount}</div>
              <div className="kpi-sub">0 available</div>
            </div>
          </div>
        </div>

        <div className="col-6 col-md-4 col-xl-2">
          <div className="card border-0 shadow-sm h-100">
            <div className="kpi-card text-center">
              <div className="kpi-label" title="Inventory Valuation">Inventory Valuation</div>
              <div className="kpi-value text-dark">{formatCurrency(totalValuation)}</div>
              <div className="kpi-sub">Total asset cost</div>
            </div>
          </div>
        </div>
      </div>

      {/* VIEW 1: CATALOG & INVENTORY VAULT */}
      {activeMainView === 'catalog' && (
        <>
          {/* Horizontal Media Production Categories Pills */}
          <div className="card mb-4 border-0 shadow-sm">
            <div className="card-body p-2 bg-light rounded">
              <div className="d-flex align-items-center gap-2 overflow-auto py-1" style={{ whiteSpace: 'nowrap' }}>
                <button
                  type="button"
                  className={`btn btn-sm ${selectedCategory === 'ALL' ? 'btn-primary' : 'btn-white bg-white border text-secondary'} rounded-pill px-3 d-inline-flex align-items-center gap-1 flex-shrink-0`}
                  style={{ height: '34px', minHeight: '34px' }}
                  onClick={() => setSelectedCategory('ALL')}
                >
                  <i className="bi bi-grid-fill"></i>
                  <span>All Categories</span>
                  <span className={`badge rounded-pill ms-1 ${selectedCategory === 'ALL' ? 'bg-white text-primary' : 'bg-light text-muted border'}`} style={{ fontSize: '0.65rem' }}>
                    {equipmentList.length}
                  </span>
                </button>

                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    className={`btn btn-sm ${selectedCategory === cat.id ? 'btn-primary' : 'btn-white bg-white border text-secondary'} rounded-pill px-3 d-inline-flex align-items-center gap-1 flex-shrink-0`}
                    style={{ height: '34px', minHeight: '34px' }}
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    <i className={`bi ${cat.icon || 'bi-camera'}`}></i>
                    <span>{cat.name}</span>
                    {cat._count?.equipment !== undefined && (
                      <span className={`badge rounded-pill ms-1 ${selectedCategory === cat.id ? 'bg-white text-primary' : 'bg-light text-muted border'}`} style={{ fontSize: '0.65rem' }}>
                        {cat._count.equipment}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Filter & Search Bar (Balanced Single-Row Alignment) */}
          <div className="card mb-4 border-0 shadow-sm">
            <div className="card-body p-3">
              <div className="row g-2 align-items-center">
                {/* Search */}
                <div className="col-12 col-lg-4">
                  <div className="input-group input-group-sm">
                    <span className="input-group-text bg-white border-end-0">
                      <i className="bi bi-search text-muted"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0"
                      placeholder="Search equipment..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                    {search && (
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setSearch('')}
                      >
                        <i className="bi bi-x"></i>
                      </button>
                    )}
                  </div>
                </div>

                {/* Stock Status Pills */}
                <div className="col-12 col-lg-5">
                  <div className="d-flex align-items-center gap-1 overflow-auto" style={{ whiteSpace: 'nowrap' }}>
                    {[
                      { key: 'ALL', label: 'All Stock' },
                      { key: 'AVAILABLE', label: 'Available' },
                      { key: 'BORROWED', label: 'Borrowed' },
                      { key: 'UNDER_MAINTENANCE', label: 'Maintenance' },
                      { key: 'ARCHIVED', label: 'Archived' }
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        className={`btn btn-sm px-2.5 flex-shrink-0 ${activeTabFilter === tab.key ? 'btn-dark' : 'btn-outline-secondary'}`}
                        style={{ fontSize: '0.76rem', height: '36px', minHeight: '36px' }}
                        onClick={() => setActiveTabFilter(tab.key)}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Condition Filter & View Toggle */}
                <div className="col-12 col-lg-3 d-flex justify-content-lg-end align-items-center gap-2">
                  <select
                    className="form-select form-select-sm flex-fill"
                    style={{ maxWidth: '175px', height: '36px' }}
                    value={selectedCondition}
                    onChange={(e) => setSelectedCondition(e.target.value)}
                  >
                    <option value="ALL">All Conditions</option>
                    <option value="EXCELLENT">Excellent</option>
                    <option value="GOOD">Good</option>
                    <option value="FAIR">Fair</option>
                    <option value="DAMAGED">Damaged</option>
                  </select>

                  <div className="btn-group btn-group-sm flex-shrink-0">
                    <button
                      type="button"
                      className={`btn ${viewMode === 'grid' ? 'btn-primary' : 'btn-outline-secondary'}`}
                      style={{ height: '36px', minHeight: '36px', width: '36px', padding: 0 }}
                      onClick={() => setViewMode('grid')}
                      title="Grid View"
                    >
                      <i className="bi bi-grid-3x3-gap"></i>
                    </button>
                    <button
                      type="button"
                      className={`btn ${viewMode === 'table' ? 'btn-primary' : 'btn-outline-secondary'}`}
                      style={{ height: '36px', minHeight: '36px', width: '36px', padding: 0 }}
                      onClick={() => setViewMode('table')}
                      title="Table View"
                    >
                      <i className="bi bi-list-ul"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Equipment Cards or Table */}
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
              <p className="text-muted small mt-2">Loading stock vault catalog...</p>
            </div>
          ) : equipmentList.length === 0 ? (
            <div className="card text-center p-5 border-0 shadow-sm">
              <div className="py-4">
                <div className="p-3 bg-light rounded-circle d-inline-block text-muted mb-3" style={{ width: 64, height: 64 }}>
                  <i className="bi bi-box-seam fs-2"></i>
                </div>
                <h5 className="fw-bold text-dark">No Equipment Items Found</h5>
                <p className="text-muted small mb-3">
                  {activeTabFilter === 'ARCHIVED'
                    ? 'There are currently no archived or deleted equipment items.'
                    : 'Try clearing your category or search filters, or register a new equipment item.'}
                </p>
                {isStaff && activeTabFilter !== 'ARCHIVED' && (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      setEditingEquipment(null);
                      setShowFormModal(true);
                    }}
                  >
                    <i className="bi bi-plus-lg me-1"></i> Register Equipment
                  </button>
                )}
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="row g-3">
              {equipmentList.map((eq) => (
                <div key={eq.id} className="col-12 col-sm-6 col-lg-4 col-xl-3">
                  <EquipmentCard
                    equipment={eq}
                    canManage={isStaff}
                    onView={(item) => {
                      setViewingEquipment(item);
                      setShowDetailModal(true);
                    }}
                    onShowQR={(item) => {
                      setQrEquipment(item);
                      setShowQRModal(true);
                    }}
                    onEdit={(item) => {
                      setEditingEquipment(item);
                      setShowFormModal(true);
                    }}
                    onDelete={handleDelete}
                    onRestore={handleRestore}
                    onAdjustStock={handleOpenAdjust}
                    onRequest={(item) => {
                      setRequestItem(item);
                      setShowRequestModal(true);
                    }}
                    onFastCheckout={(item) => {
                      setFastCheckoutItem(item);
                      setShowFastCheckout(true);
                    }}
                    onFastCheckin={(item) => {
                      setFastCheckinItem(item);
                      setShowFastCheckin(true);
                    }}
                  />
                </div>
              ))}
            </div>
          ) : (
            /* Table View */
            <div className="card border-0 shadow-sm">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0" style={{ fontSize: '9pt' }}>
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: '85px' }}>Asset Tag</th>
                      <th>Equipment & Model</th>
                      <th>Category</th>
                      <th>Serial Number</th>
                      <th>Stock Availability</th>
                      <th>Status</th>
                      <th>Condition</th>
                      <th className="text-end">Value</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {equipmentList.map((eq) => {
                      const q = eq.quantity || 1;
                      const a = eq.availableQuantity !== undefined ? eq.availableQuantity : (eq.status === 'AVAILABLE' ? q : 0);
                      const isArchived = Boolean(eq.isDeleted);

                      return (
                        <tr key={eq.id} className={isArchived ? 'opacity-75 bg-light' : ''}>
                          <td>
                            <span className="badge bg-slate-900 text-white font-monospace">
                              {eq.assetTag}
                            </span>
                          </td>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              {eq.imageUrl ? (
                                <img
                                  src={eq.imageUrl}
                                  alt=""
                                  referrerPolicy="no-referrer"
                                  className="rounded border bg-light flex-shrink-0"
                                  style={{ width: '36px', height: '36px', objectFit: 'contain' }}
                                  onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=100&auto=format&fit=crop&q=80'; }}
                                />
                              ) : (
                                <div
                                  className="rounded border bg-light d-flex align-items-center justify-content-center text-muted flex-shrink-0"
                                  style={{ width: '36px', height: '36px' }}
                                >
                                  <i className="bi bi-camera"></i>
                                </div>
                              )}
                              <div>
                                <span
                                  className="fw-bold text-dark cursor-pointer text-truncate d-block"
                                  style={{ maxWidth: '240px' }}
                                  onClick={() => {
                                    setViewingEquipment(eq);
                                    setShowDetailModal(true);
                                  }}
                                >
                                  {eq.name}
                                </span>
                                <small className="text-muted">{eq.brand} {eq.model}</small>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="badge bg-light text-secondary border">
                              {eq.category?.name || 'General'}
                            </span>
                          </td>
                          <td className="font-monospace text-muted">{eq.serialNumber}</td>
                          <td>
                            <span className={`badge ${a === 0 ? 'bg-danger-subtle text-danger' : a <= 2 ? 'bg-warning-subtle text-warning-emphasis' : 'bg-success-subtle text-success'} border`}>
                              {a}/{q} in stock
                            </span>
                          </td>
                          <td>
                            {isArchived ? (
                              <span className="badge bg-danger">ARCHIVED</span>
                            ) : (
                              <StatusBadge status={eq.status} />
                            )}
                          </td>
                          <td>
                            <span className="badge bg-light text-secondary border">{eq.condition}</span>
                          </td>
                          <td className="text-end fw-semibold text-dark">
                            {formatCurrency(eq.purchasePrice)}
                          </td>
                          <td className="text-end">
                            <div className="d-flex justify-content-end gap-1">
                              {isArchived ? (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-success py-1 px-2"
                                  onClick={() => handleRestore(eq.id)}
                                >
                                  <i className="bi bi-arrow-counterclockwise me-1"></i> Restore
                                </button>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-light border py-1 px-2"
                                    title="View Details"
                                    onClick={() => {
                                      setViewingEquipment(eq);
                                      setShowDetailModal(true);
                                    }}
                                  >
                                    <i className="bi bi-eye"></i>
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-light border py-1 px-2"
                                    title="QR Tag"
                                    onClick={() => {
                                      setQrEquipment(eq);
                                      setShowQRModal(true);
                                    }}
                                  >
                                    <i className="bi bi-qr-code"></i>
                                  </button>
                                  {isStaff && (
                                    <>
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-light border py-1 px-2 text-primary"
                                        title="Adjust Stock"
                                        onClick={() => handleOpenAdjust(eq)}
                                      >
                                        <i className="bi bi-plus-slash-minus"></i>
                                      </button>
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-light border py-1 px-2"
                                        title="Edit"
                                        onClick={() => {
                                          setEditingEquipment(eq);
                                          setShowFormModal(true);
                                        }}
                                      >
                                        <i className="bi bi-pencil"></i>
                                      </button>
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-light border py-1 px-2 text-danger"
                                        title="Archive"
                                        onClick={() => handleDelete(eq.id)}
                                      >
                                        <i className="bi bi-archive"></i>
                                      </button>
                                    </>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* VIEW 2: STOCK DASHBOARD & HISTORY */}
      {activeMainView === 'stock-dashboard' && (
        <div>
          {/* Timeframe Filter Bar */}
          <div className="card mb-4 border-0 shadow-sm">
            <div className="card-body p-3 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2">
              <div>
                <h6 className="fw-bold text-dark mb-0">Stock Movements & Inventory History</h6>
                <small className="text-muted">Interactive time-range reports showing additions, loans, returns, and damages.</small>
              </div>

              <div className="btn-group btn-group-sm">
                {['daily', 'weekly', 'monthly', 'yearly', 'all'].map((tf) => (
                  <button
                    key={tf}
                    type="button"
                    className={`btn text-capitalize ${dashboardTimeframe === tf ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => setDashboardTimeframe(tf)}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loadingDashboard ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
              <p className="text-muted small mt-2">Compiling stock movements & alerts...</p>
            </div>
          ) : (
            <div className="row g-4">
              {/* Low Stock Alerts */}
              <div className="col-lg-5">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body p-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div>
                        <h6 className="fw-bold text-dark mb-0">
                          <i className="bi bi-exclamation-triangle-fill text-warning me-2"></i>
                          Low-Stock Critical Alerts
                        </h6>
                        <small className="text-muted">Items with 2 or fewer units ready in vault</small>
                      </div>
                      <span className="badge bg-warning text-dark">
                        {stockDashboardData?.lowStockAlerts?.length || 0} items
                      </span>
                    </div>

                    {!stockDashboardData?.lowStockAlerts?.length ? (
                      <div className="text-center py-4 text-muted small">
                        <i className="bi bi-check-circle text-success fs-3 d-block mb-1"></i>
                        All equipment lines have sufficient stock reserves.
                      </div>
                    ) : (
                      <div className="table-responsive" style={{ maxHeight: '340px' }}>
                        <table className="table table-sm table-hover align-middle mb-0" style={{ fontSize: '8.5pt' }}>
                          <thead className="table-light">
                            <tr>
                              <th>Tag</th>
                              <th>Item Name</th>
                              <th>Available</th>
                              <th>Status</th>
                              <th className="text-end">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {stockDashboardData.lowStockAlerts.map((alert) => (
                              <tr key={alert.id}>
                                <td className="fw-bold font-monospace">{alert.assetTag}</td>
                                <td className="text-truncate fw-medium" style={{ maxWidth: '140px' }}>{alert.name}</td>
                                <td>
                                  <span className={`badge ${alert.availableQuantity === 0 ? 'bg-danger' : 'bg-warning text-dark'}`}>
                                    {alert.availableQuantity} left
                                  </span>
                                </td>
                                <td><StatusBadge status={alert.status} /></td>
                                <td className="text-end">
                                  {isStaff && (
                                    <button
                                      type="button"
                                      className="btn btn-xs btn-outline-primary py-0 px-2"
                                      onClick={() => handleOpenAdjust(alert)}
                                    >
                                      + Restock
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Stock Movement History Log */}
              <div className="col-lg-7">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body p-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div>
                        <h6 className="fw-bold text-dark mb-0">
                          <i className="bi bi-clock-history text-primary me-2"></i>
                          Stock Movements Log ({dashboardTimeframe})
                        </h6>
                        <small className="text-muted">Audit trail of quantities checked out, returned, or quarantined</small>
                      </div>
                    </div>

                    {!stockDashboardData?.recentMovements?.length ? (
                      <div className="text-center py-4 text-muted small">
                        No recorded movements during this timeframe.
                      </div>
                    ) : (
                      <div className="table-responsive" style={{ maxHeight: '340px' }}>
                        <table className="table table-sm table-hover align-middle mb-0" style={{ fontSize: '8.5pt' }}>
                          <thead className="table-light">
                            <tr>
                              <th>Type</th>
                              <th>Equipment</th>
                              <th>Change</th>
                              <th>Stock Balance</th>
                              <th>By</th>
                              <th>Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {stockDashboardData.recentMovements.map((mov) => (
                              <tr key={mov.id}>
                                <td>
                                  <span className={`badge ${
                                    mov.type === 'INITIAL_STOCK' || mov.type === 'CHECK_IN' || mov.type === 'RESTORE'
                                      ? 'bg-success'
                                      : mov.type === 'CHECK_OUT'
                                      ? 'bg-warning text-dark'
                                      : mov.type === 'DAMAGE_REPORT' || mov.type === 'MAINTENANCE'
                                      ? 'bg-danger'
                                      : 'bg-secondary'
                                  }`}>
                                    {mov.type}
                                  </span>
                                </td>
                                <td>
                                  <span className="fw-bold text-dark font-monospace me-1">{mov.assetTag}</span>
                                  <span className="small text-muted text-truncate d-inline-block" style={{ maxWidth: '160px' }}>
                                    {mov.equipmentName}
                                  </span>
                                </td>
                                <td className={`fw-bold ${mov.quantityChanged > 0 ? 'text-success' : 'text-danger'}`}>
                                  {mov.quantityChanged > 0 ? `+${mov.quantityChanged}` : mov.quantityChanged}
                                </td>
                                <td>
                                  <span className="badge bg-light text-dark border">
                                    {mov.newAvailable}/{mov.newTotal}
                                  </span>
                                </td>
                                <td className="small text-muted">{mov.performedBy || 'Staff'}</td>
                                <td className="text-nowrap">{formatDateTime(mov.createdAt)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {showAdjustModal && adjustingEquipment && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-slate-900 text-white" style={{ backgroundColor: '#0f172a' }}>
                <h6 className="modal-title fw-bold text-white mb-0">
                  Adjust Stock Quantity: {adjustingEquipment.assetTag}
                </h6>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setShowAdjustModal(false)}
                  aria-label="Close"
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>
              <form onSubmit={handleSaveStockAdjustment}>
                <div className="modal-body p-4">
                  <div className="p-3 border rounded bg-light mb-3">
                    <div className="fw-bold text-dark">{adjustingEquipment.name}</div>
                    <div className="small text-muted">
                      Current Stock: <strong className="text-dark">{adjustingEquipment.quantity || 1} total</strong> | Available: <strong className="text-success">{adjustingEquipment.availableQuantity !== undefined ? adjustingEquipment.availableQuantity : 1}</strong>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">
                      Quantity Adjustment (+ to add stock, - to write off)
                    </label>
                    <input
                      type="number"
                      className="form-control fw-bold"
                      value={adjustmentAmount}
                      onChange={(e) => setAdjustmentAmount(parseInt(e.target.value, 10) || 0)}
                      required
                    />
                    <div className="form-text small">Positive number to add, negative to deduct.</div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Reason for Adjustment</label>
                    <select
                      className="form-select"
                      value={adjustmentReason}
                      onChange={(e) => setAdjustmentReason(e.target.value)}
                    >
                      <option value="Restock / New Purchase">Restock / New Purchase</option>
                      <option value="Physical Vault Count Correction">Physical Vault Count Correction</option>
                      <option value="Damage / Write-Off">Damage / Write-Off</option>
                      <option value="Loss / Missing Gear">Loss / Missing Gear</option>
                      <option value="Transferred to Other Studio">Transferred to Other Studio</option>
                    </select>
                  </div>

                  <div className="mb-0">
                    <label className="form-label small fw-semibold text-secondary">Adjustment Notes</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="PO number or reason"
                      value={adjustmentNotes}
                      onChange={(e) => setAdjustmentNotes(e.target.value)}
                    />
                  </div>
                </div>

                <div className="modal-footer bg-light px-4 py-2">
                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setShowAdjustModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-sm btn-primary" disabled={savingAdjustment}>
                    {savingAdjustment ? 'Saving...' : 'Apply Stock Change'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Equipment Form Modal (Create / Edit) */}
      <EquipmentFormModal
        show={showFormModal}
        onHide={() => setShowFormModal(false)}
        onSubmit={handleCreateOrUpdate}
        equipment={editingEquipment}
        categories={categories}
      />

      {/* Equipment Detail Modal */}
      <EquipmentDetailModal
        show={showDetailModal}
        onHide={() => setShowDetailModal(false)}
        equipment={viewingEquipment}
        onShowQR={(eq) => {
          setShowDetailModal(false);
          setQrEquipment(eq);
          setShowQRModal(true);
        }}
      />

      {/* QR & Barcode Modal */}
      <QRModal
        show={showQRModal}
        onHide={() => setShowQRModal(false)}
        equipment={qrEquipment}
      />

      {/* Categories Manager Modal */}
      <CategoryModal
        show={showCategoryModal}
        onHide={() => setShowCategoryModal(false)}
        onCategoriesChanged={() => {
          loadCategories();
          loadEquipment();
        }}
      />

      {/* Fast Checkout Modal */}
      <CheckoutModal
        show={showFastCheckout}
        onHide={() => setShowFastCheckout(false)}
        onSubmit={handleFastCheckoutSubmit}
        initialItem={fastCheckoutItem}
      />

      {/* Fast Checkin Modal */}
      <CheckinModal
        show={showFastCheckin}
        onHide={() => setShowFastCheckin(false)}
        onSubmit={handleFastCheckinSubmit}
        initialItem={fastCheckinItem}
      />

      {/* Request Form Modal */}
      <RequestFormModal
        show={showRequestModal}
        onHide={() => setShowRequestModal(false)}
        onSubmit={handleRequestSubmit}
        initialEquipment={requestItem}
      />

      {/* Quick QR Scanner Modal */}
      <QRScannerModal
        show={showScannerModal}
        onHide={() => setShowScannerModal(false)}
      />
    </div>
  );
};

export default EquipmentList;
