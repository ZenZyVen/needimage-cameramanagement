import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getEquipment,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  getCategories
} from '../services/equipmentService';
import { triggerNotificationRefresh } from '../context/NotificationContext';
import { formatCurrency } from '../utils/formatters';
import StatusBadge from '../components/common/StatusBadge';

const CONDITIONS = ['EXCELLENT', 'GOOD', 'FAIR', 'MAINTENANCE', 'DAMAGED'];
const STATUSES = ['AVAILABLE', 'BORROWED', 'MAINTENANCE', 'DAMAGED', 'OUT_OF_STOCK'];

const ProductManagement = () => {
  const { user, isAdmin, isStaff } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [conditionFilter, setConditionFilter] = useState('ALL');

  // Modals
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [priceProduct, setPriceProduct] = useState(null);
  const [quickPrice, setQuickPrice] = useState({ purchasePrice: '', dailyRate: '' });

  // Notifications
  const [alertMsg, setAlertMsg] = useState({ type: '', text: '' });
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    assetTag: '',
    categoryId: '',
    brand: '',
    model: '',
    serialNumber: '',
    purchasePrice: '',
    dailyRate: '',
    quantity: 1,
    availableQuantity: 1,
    condition: 'EXCELLENT',
    status: 'AVAILABLE',
    imageUrl: '',
    notes: ''
  });

  useEffect(() => {
    loadCategories();
    loadProducts();
  }, []);

  const loadCategories = async () => {
    try {
      const res = await getCategories();
      if (res.data?.data) {
        setCategories(res.data.data);
      }
    } catch (e) {
      console.warn('Error loading categories:', e);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await getEquipment({ limit: 300 });
      if (res.data?.data) {
        setProducts(res.data.data);
      }
    } catch (err) {
      setAlertMsg({ type: 'danger', text: 'Failed to load product catalog.' });
    } finally {
      setLoading(false);
    }
  };

  // Open Create Modal
  const openCreateModal = () => {
    const nextTag = `CV-${Math.floor(1000 + Math.random() * 9000)}`;
    setEditingProduct(null);
    setFormData({
      name: '',
      assetTag: nextTag,
      categoryId: categories[0]?.id || '',
      brand: '',
      model: '',
      serialNumber: '',
      purchasePrice: '',
      dailyRate: '',
      quantity: 1,
      availableQuantity: 1,
      condition: 'EXCELLENT',
      status: 'AVAILABLE',
      imageUrl: '',
      notes: ''
    });
    setShowProductModal(true);
  };

  // Open Edit Modal
  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      assetTag: product.assetTag || '',
      categoryId: product.categoryId || categories[0]?.id || '',
      brand: product.brand || '',
      model: product.model || '',
      serialNumber: product.serialNumber || '',
      purchasePrice: product.purchasePrice !== null && product.purchasePrice !== undefined ? product.purchasePrice : '',
      dailyRate: product.dailyRate !== null && product.dailyRate !== undefined ? product.dailyRate : '',
      quantity: product.quantity || 1,
      availableQuantity: product.availableQuantity !== undefined ? product.availableQuantity : (product.quantity || 1),
      condition: product.condition || 'EXCELLENT',
      status: product.status || 'AVAILABLE',
      imageUrl: product.imageUrl || '',
      notes: product.notes || ''
    });
    setShowProductModal(true);
  };

  // Open Quick Price Modal
  const openPriceModal = (product) => {
    setPriceProduct(product);
    setQuickPrice({
      purchasePrice: product.purchasePrice !== null && product.purchasePrice !== undefined ? product.purchasePrice : '',
      dailyRate: product.dailyRate !== null && product.dailyRate !== undefined ? product.dailyRate : ''
    });
    setShowPriceModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Submit Create or Edit Product
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.assetTag.trim() || !formData.categoryId) {
      setAlertMsg({ type: 'warning', text: 'Product name, asset tag, and category are required.' });
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: formData.name.trim(),
        assetTag: formData.assetTag.trim().toUpperCase(),
        categoryId: formData.categoryId,
        brand: formData.brand.trim() || undefined,
        model: formData.model.trim() || undefined,
        serialNumber: formData.serialNumber.trim() || undefined,
        purchasePrice: formData.purchasePrice !== '' ? parseFloat(formData.purchasePrice) : null,
        dailyRate: formData.dailyRate !== '' ? parseFloat(formData.dailyRate) : null,
        quantity: parseInt(formData.quantity, 10) || 1,
        availableQuantity: parseInt(formData.availableQuantity, 10) || parseInt(formData.quantity, 10) || 1,
        condition: formData.condition,
        status: formData.status,
        imageUrl: formData.imageUrl.trim() || null,
        notes: formData.notes.trim() || null
      };

      if (editingProduct) {
        await updateEquipment(editingProduct.id, payload);
        setAlertMsg({ type: 'success', text: `Product "${payload.name}" updated successfully.` });
      } else {
        await createEquipment(payload);
        setAlertMsg({ type: 'success', text: `Product "${payload.name}" registered successfully.` });
      }

      setShowProductModal(false);
      triggerNotificationRefresh();
      loadProducts();
    } catch (err) {
      setAlertMsg({ type: 'danger', text: err.response?.data?.message || 'Error saving product details.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Quick Price Update Submit
  const handlePriceSubmit = async (e) => {
    e.preventDefault();
    if (!priceProduct) return;

    try {
      setSubmitting(true);
      const payload = {
        purchasePrice: quickPrice.purchasePrice !== '' ? parseFloat(quickPrice.purchasePrice) : null,
        dailyRate: quickPrice.dailyRate !== '' ? parseFloat(quickPrice.dailyRate) : null
      };

      await updateEquipment(priceProduct.id, payload);
      setAlertMsg({
        type: 'success',
        text: `Pricing updated for ${priceProduct.assetTag} (${priceProduct.name}). New unit price: ${formatCurrency(payload.purchasePrice)}.`
      });
      setShowPriceModal(false);
      triggerNotificationRefresh();
      loadProducts();
    } catch (err) {
      setAlertMsg({ type: 'danger', text: err.response?.data?.message || 'Error updating price.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Product
  const handleDeleteProduct = async (product) => {
    if (!window.confirm(`Are you sure you want to delete product "${product.name}" (${product.assetTag})?`)) {
      return;
    }

    try {
      await deleteEquipment(product.id);
      setAlertMsg({ type: 'success', text: `Product "${product.name}" removed from active catalog.` });
      triggerNotificationRefresh();
      loadProducts();
    } catch (err) {
      setAlertMsg({ type: 'danger', text: err.response?.data?.message || 'Error deleting product.' });
    }
  };

  // Filtered Products
  const filteredProducts = products.filter(p => {
    if (categoryFilter !== 'ALL' && p.categoryId !== categoryFilter) return false;
    if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
    if (conditionFilter !== 'ALL' && p.condition !== conditionFilter) return false;

    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    const name = (p.name || '').toLowerCase();
    const tag = (p.assetTag || '').toLowerCase();
    const brand = (p.brand || '').toLowerCase();
    const model = (p.model || '').toLowerCase();
    const serial = (p.serialNumber || '').toLowerCase();

    return name.includes(q) || tag.includes(q) || brand.includes(q) || model.includes(q) || serial.includes(q);
  });

  // KPI Calculations
  const totalUnits = products.reduce((acc, p) => acc + (p.quantity || 1), 0);
  const totalValuation = products.reduce((acc, p) => acc + ((p.purchasePrice || 0) * (p.quantity || 1)), 0);
  const totalAvailable = products.reduce((acc, p) => acc + (p.availableQuantity !== undefined ? p.availableQuantity : (p.quantity || 1)), 0);

  // CSV Export
  const handleExportCSV = () => {
    if (filteredProducts.length === 0) return;
    const headers = ['Asset Tag', 'Product Name', 'Category', 'Brand', 'Model', 'Serial Number', 'Purchase Price', 'Daily Rate', 'Total Qty', 'Avail Qty', 'Condition', 'Status'];
    const rows = filteredProducts.map(p => [
      p.assetTag,
      `"${(p.name || '').replace(/"/g, '""')}"`,
      `"${(p.category?.name || 'General').replace(/"/g, '""')}"`,
      `"${(p.brand || '').replace(/"/g, '""')}"`,
      `"${(p.model || '').replace(/"/g, '""')}"`,
      `"${(p.serialNumber || '').replace(/"/g, '""')}"`,
      p.purchasePrice || 0,
      p.dailyRate || 0,
      p.quantity || 1,
      p.availableQuantity ?? p.quantity ?? 1,
      p.condition || 'EXCELLENT',
      p.status || 'AVAILABLE'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Product_Catalog_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="pb-5">
      {/* Top Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-2">
        <div>
          <h4 className="fw-bold text-dark mb-0">Product Management</h4>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1 shadow-sm px-3"
            onClick={loadProducts}
          >
            <i className="bi bi-arrow-clockwise"></i>
            <span>Refresh</span>
          </button>

          <button
            type="button"
            className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1 shadow-sm px-3"
            onClick={handleExportCSV}
            disabled={filteredProducts.length === 0}
          >
            <i className="bi bi-download"></i>
            <span>Export CSV</span>
          </button>

          {isAdmin && (
            <button
              type="button"
              className="btn btn-primary btn-sm d-flex align-items-center gap-1 shadow-sm px-3 fw-semibold"
              onClick={openCreateModal}
            >
              <i className="bi bi-plus-lg"></i>
              <span>Add Product</span>
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

      {/* KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-3">
              <span className="text-muted small fw-semibold text-uppercase">Total Catalog Products</span>
              <div className="fs-4 fw-bold text-dark mt-1">{products.length}</div>
              <small className="text-secondary">{categories.length} production categories</small>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-3">
              <span className="text-muted small fw-semibold text-uppercase">Inventory Units</span>
              <div className="fs-4 fw-bold text-primary mt-1">{totalUnits}</div>
              <small className="text-secondary">{totalAvailable} units currently ready in vault</small>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-3">
              <span className="text-muted small fw-semibold text-uppercase">Total Asset Valuation</span>
              <div className="fs-4 fw-bold text-success mt-1">{formatCurrency(totalValuation)}</div>
              <small className="text-secondary">Combined gear replacement value</small>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-3">
              <span className="text-muted small fw-semibold text-uppercase">Filtered Count</span>
              <div className="fs-4 fw-bold text-dark mt-1">{filteredProducts.length}</div>
              <small className="text-secondary">Matching active filters</small>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-3">
          <div className="row g-2 align-items-center">
            {/* Search */}
            <div className="col-md-4">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-white"><i className="bi bi-search text-muted"></i></span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search product name, brand, model, tag, or serial..."
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

            {/* Category Filter */}
            <div className="col-md-3">
              <select
                className="form-select form-select-sm"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="ALL">All Categories ({products.length})</option>
                {categories.map(cat => {
                  const count = products.filter(p => p.categoryId === cat.id).length;
                  return (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} ({count})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Status Filter */}
            <div className="col-md-2">
              <select
                className="form-select form-select-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Statuses</option>
                {STATUSES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Condition Filter */}
            <div className="col-md-3">
              <select
                className="form-select form-select-sm"
                value={conditionFilter}
                onChange={(e) => setConditionFilter(e.target.value)}
              >
                <option value="ALL">All Physical Conditions</option>
                {CONDITIONS.map(c => (
                  <option key={c} value={c}>Condition: {c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary spinner-border-sm"></div>
              <span className="text-muted small ms-2">Loading product catalog...</span>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-inbox fs-2 text-secondary d-block mb-1"></i>
              No products found matching your search criteria.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light text-muted small">
                  <tr>
                    <th style={{ width: '80px' }}>Item</th>
                    <th style={{ minWidth: '200px' }}>Product & Specifications</th>
                    <th>Category</th>
                    <th style={{ width: '150px' }}>Pricing & Valuation</th>
                    <th className="text-center" style={{ width: '110px' }}>Inventory</th>
                    <th style={{ width: '130px' }}>Condition & Status</th>
                    <th className="text-end" style={{ width: '150px' }}>Admin Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(product => {
                    const avail = product.availableQuantity !== undefined ? product.availableQuantity : product.quantity;
                    const isOutOfStock = avail <= 0;

                    return (
                      <tr key={product.id}>
                        {/* Photo */}
                        <td>
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="rounded border"
                              style={{ width: '46px', height: '46px', objectFit: 'cover' }}
                            />
                          ) : (
                            <div
                              className="rounded bg-light border d-flex align-items-center justify-content-center text-muted"
                              style={{ width: '46px', height: '46px' }}
                            >
                              <i className="bi bi-camera fs-5"></i>
                            </div>
                          )}
                        </td>

                        {/* Product info */}
                        <td>
                          <div className="d-flex align-items-center gap-1 mb-1">
                            <span className="badge bg-slate-900 text-white font-monospace" style={{ fontSize: '0.7rem' }}>
                              {product.assetTag}
                            </span>
                            {product.brand && (
                              <span className="badge bg-light text-dark border" style={{ fontSize: '0.68rem' }}>
                                {product.brand}
                              </span>
                            )}
                          </div>
                          <div className="fw-bold text-dark small">{product.name}</div>
                          <div className="text-muted font-monospace" style={{ fontSize: '0.72rem' }}>
                            Model: {product.model || 'Standard'} {product.serialNumber ? `• S/N: ${product.serialNumber}` : ''}
                          </div>
                        </td>

                        {/* Category */}
                        <td>
                          <span className="badge bg-primary-subtle text-primary border border-primary-subtle" style={{ fontSize: '0.72rem' }}>
                            {product.category?.name || 'General Gear'}
                          </span>
                        </td>

                        {/* Pricing */}
                        <td>
                          <div className="d-flex align-items-center gap-1">
                            <span className="fw-bold text-dark small">{formatCurrency(product.purchasePrice || 0)}</span>
                            {isAdmin && (
                              <button
                                type="button"
                                className="btn btn-link btn-sm p-0 text-primary ms-1"
                                onClick={() => openPriceModal(product)}
                                title="Change product price"
                              >
                                <i className="bi bi-pencil-square" style={{ fontSize: '0.78rem' }}></i>
                              </button>
                            )}
                          </div>
                          <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                            Rate: {product.dailyRate ? `${formatCurrency(product.dailyRate)}/day` : 'N/A'}
                          </div>
                        </td>

                        {/* Inventory Units */}
                        <td className="text-center">
                          <div className={`fw-bold small ${isOutOfStock ? 'text-danger' : 'text-success'}`}>
                            {avail} avail
                          </div>
                          <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                            of {product.quantity} total
                          </div>
                        </td>

                        {/* Condition & Status */}
                        <td>
                          <div>
                            <StatusBadge status={product.status} />
                          </div>
                          <div className="mt-1">
                            <span className="badge bg-light text-secondary border" style={{ fontSize: '0.65rem' }}>
                              {product.condition || 'EXCELLENT'}
                            </span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="text-end">
                          <div className="btn-group btn-group-sm">
                            <button
                              type="button"
                              className="btn btn-outline-secondary"
                              onClick={() => openEditModal(product)}
                              title="Edit all product information"
                            >
                              <i className="bi bi-pencil me-1"></i> Edit
                            </button>

                            {isAdmin && (
                              <button
                                type="button"
                                className="btn btn-outline-danger"
                                onClick={() => handleDeleteProduct(product)}
                                title="Delete product"
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            )}
                          </div>
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

      {/* CREATE & EDIT PRODUCT MODAL */}
      {showProductModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-slate-900 text-white" style={{ backgroundColor: '#0f172a' }}>
                <div className="d-flex align-items-center gap-2">
                  <div className="p-2 rounded bg-primary-subtle text-primary d-flex align-items-center justify-content-center" style={{ width: 32, height: 32 }}>
                    <i className={`bi ${editingProduct ? 'bi-pencil-square' : 'bi-plus-lg'}`}></i>
                  </div>
                  <h6 className="modal-title fw-bold text-white mb-0">
                    {editingProduct ? `Edit Product: ${editingProduct.name}` : 'Register New Product'}
                  </h6>
                </div>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setShowProductModal(false)}
                  aria-label="Close"
                  title="Close modal"
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>

              <form onSubmit={handleProductSubmit}>
                <div className="modal-body p-4" style={{ maxHeight: '74vh', overflowY: 'auto' }}>
                  {/* SECTION 1: IDENTITY */}
                  <div className="p-3 border rounded bg-light mb-3">
                    <h6 className="fw-bold text-secondary small text-uppercase mb-3">
                      <i className="bi bi-tag-fill text-primary me-1"></i> 1. Product Identity
                    </h6>
                    <div className="row g-3">
                      <div className="col-md-7">
                        <label className="form-label small fw-semibold text-secondary">
                          Product / Equipment Name <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          name="name"
                          placeholder="e.g. Sony FX6 Cinema Camera"
                          value={formData.name}
                          onChange={handleFormChange}
                          required
                        />
                      </div>

                      <div className="col-md-5">
                        <label className="form-label small fw-semibold text-secondary">
                          Asset Barcode / Tag <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control form-control-sm font-monospace text-uppercase"
                          name="assetTag"
                          placeholder="e.g. CAM-001"
                          value={formData.assetTag}
                          onChange={handleFormChange}
                          required
                        />
                      </div>

                      <div className="col-md-4">
                        <label className="form-label small fw-semibold text-secondary">
                          Category <span className="text-danger">*</span>
                        </label>
                        <select
                          className="form-select form-select-sm"
                          name="categoryId"
                          value={formData.categoryId}
                          onChange={handleFormChange}
                          required
                        >
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="col-md-4">
                        <label className="form-label small fw-semibold text-secondary">Brand / Manufacturer</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          name="brand"
                          placeholder="e.g. Sony, ARRI, RED"
                          value={formData.brand}
                          onChange={handleFormChange}
                        />
                      </div>

                      <div className="col-md-4">
                        <label className="form-label small fw-semibold text-secondary">Model</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          name="model"
                          placeholder="e.g. ILME-FX6V"
                          value={formData.model}
                          onChange={handleFormChange}
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-secondary">Serial Number</label>
                        <input
                          type="text"
                          className="form-control form-control-sm font-monospace"
                          name="serialNumber"
                          placeholder="e.g. SN-982410-X"
                          value={formData.serialNumber}
                          onChange={handleFormChange}
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-secondary">Image URL</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          name="imageUrl"
                          placeholder="https://... or leave empty"
                          value={formData.imageUrl}
                          onChange={handleFormChange}
                        />
                      </div>
                    </div>
                  </div>

                  {/* SECTION 2: PRICING & VALUATION (Allows changing prices) */}
                  <div className="p-3 border rounded bg-white mb-3">
                    <h6 className="fw-bold text-dark small text-uppercase mb-3">
                      <i className="bi bi-cash-coin text-success me-1"></i> 2. Pricing & Valuation
                    </h6>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-secondary">
                          Unit Purchase Price / Replacement Cost ($) <span className="text-danger">*</span>
                        </label>
                        <div className="input-group input-group-sm">
                          <span className="input-group-text">$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            className="form-control"
                            name="purchasePrice"
                            placeholder="0.00"
                            value={formData.purchasePrice}
                            onChange={handleFormChange}
                            required
                          />
                        </div>
                        <small className="text-muted">Total inventory valuation updates based on this price.</small>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-secondary">
                          Daily Rental Rate ($)
                        </label>
                        <div className="input-group input-group-sm">
                          <span className="input-group-text">$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            className="form-control"
                            name="dailyRate"
                            placeholder="0.00"
                            value={formData.dailyRate}
                            onChange={handleFormChange}
                          />
                        </div>
                        <small className="text-muted">Standard daily loan / rental billing rate.</small>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 3: INVENTORY & STATUS */}
                  <div className="p-3 border rounded bg-light mb-3">
                    <h6 className="fw-bold text-secondary small text-uppercase mb-3">
                      <i className="bi bi-boxes text-primary me-1"></i> 3. Stock Quantities & Condition
                    </h6>
                    <div className="row g-3">
                      <div className="col-md-3">
                        <label className="form-label small fw-semibold text-secondary">
                          Total Quantity <span className="text-danger">*</span>
                        </label>
                        <input
                          type="number"
                          min="1"
                          className="form-control form-control-sm"
                          name="quantity"
                          value={formData.quantity}
                          onChange={handleFormChange}
                          required
                        />
                      </div>

                      <div className="col-md-3">
                        <label className="form-label small fw-semibold text-secondary">
                          Available Units in Vault
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={formData.quantity}
                          className="form-control form-control-sm"
                          name="availableQuantity"
                          value={formData.availableQuantity}
                          onChange={handleFormChange}
                        />
                      </div>

                      <div className="col-md-3">
                        <label className="form-label small fw-semibold text-secondary">Physical Condition</label>
                        <select
                          className="form-select form-select-sm"
                          name="condition"
                          value={formData.condition}
                          onChange={handleFormChange}
                        >
                          {CONDITIONS.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      <div className="col-md-3">
                        <label className="form-label small fw-semibold text-secondary">Vault Status</label>
                        <select
                          className="form-select form-select-sm"
                          name="status"
                          value={formData.status}
                          onChange={handleFormChange}
                        >
                          {STATUSES.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>

                      <div className="col-12">
                        <label className="form-label small fw-semibold text-secondary">Technical Description / Notes</label>
                        <textarea
                          className="form-control form-control-sm"
                          rows="3"
                          name="notes"
                          placeholder="Include sensor format, mount type, accessories included, etc."
                          value={formData.notes}
                          onChange={handleFormChange}
                        ></textarea>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-light py-2 px-3 border-top d-flex justify-content-end gap-2">
                  <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setShowProductModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm px-4 fw-semibold" disabled={submitting}>
                    {submitting ? 'Saving...' : (editingProduct ? 'Save Product Changes' : 'Register Product')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* QUICK PRICE EDIT MODAL */}
      {showPriceModal && priceProduct && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-slate-900 text-white" style={{ backgroundColor: '#0f172a' }}>
                <div className="d-flex align-items-center gap-2">
                  <div className="p-2 rounded bg-success-subtle text-success d-flex align-items-center justify-content-center" style={{ width: 32, height: 32 }}>
                    <i className="bi bi-cash-coin"></i>
                  </div>
                  <h6 className="modal-title fw-bold text-white mb-0">Update Pricing: {priceProduct.name} ({priceProduct.assetTag})</h6>
                </div>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setShowPriceModal(false)}
                  aria-label="Close"
                  title="Close modal"
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>

              <form onSubmit={handlePriceSubmit}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">
                      Unit Purchase Price / Replacement Value ($) <span className="text-danger">*</span>
                    </label>
                    <div className="input-group">
                      <span className="input-group-text">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="form-control"
                        value={quickPrice.purchasePrice}
                        onChange={(e) => setQuickPrice(prev => ({ ...prev, purchasePrice: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">
                      Daily Rental Rate ($)
                    </label>
                    <div className="input-group">
                      <span className="input-group-text">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="form-control"
                        value={quickPrice.dailyRate}
                        onChange={(e) => setQuickPrice(prev => ({ ...prev, dailyRate: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-light py-2 px-3 border-top d-flex justify-content-end gap-2">
                  <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setShowPriceModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-success btn-sm px-4 fw-semibold" disabled={submitting}>
                    {submitting ? 'Updating...' : 'Save Price'}
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

export default ProductManagement;
