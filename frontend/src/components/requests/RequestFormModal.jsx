import React, { useState, useEffect } from 'react';
import { getEquipment, getCategories } from '../../services/equipmentService';
import { getProjects } from '../../services/projectService';
import StatusBadge from '../common/StatusBadge';

const RequestFormModal = ({ show, onHide, onSubmit, initialEquipment = null }) => {
  const [projects, setProjects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [availableGear, setAvailableGear] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedGear, setSelectedGear] = useState({}); // { [id]: quantity }
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingGear, setLoadingGear] = useState(false);

  const [formData, setFormData] = useState({
    projectId: '',
    projectName: '',
    startDate: '',
    endDate: '',
    purpose: '',
    destination: '',
    notes: ''
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (show) {
      const tomorrow = new Date(Date.now() + 86400000).toISOString().substring(0, 10);
      const fourDays = new Date(Date.now() + 5 * 86400000).toISOString().substring(0, 10);

      setFormData({
        projectId: '',
        projectName: '',
        startDate: tomorrow,
        endDate: fourDays,
        purpose: '',
        destination: '',
        notes: ''
      });

      if (initialEquipment && initialEquipment.id) {
        setSelectedGear({ [initialEquipment.id]: 1 });
      } else {
        setSelectedGear({});
      }

      setErrorMsg('');

      Promise.all([
        getProjects(),
        getCategories(),
        getEquipment({ status: 'AVAILABLE', limit: 100 })
      ])
        .then(([projRes, catRes, gearRes]) => {
          if (projRes.data?.data) setProjects(projRes.data.data);
          if (catRes.data?.data) setCategories(catRes.data.data);
          if (gearRes.data?.data) setAvailableGear(gearRes.data.data);
        })
        .catch(err => console.warn('Error loading form options:', err));
    }
  }, [show, initialEquipment]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleToggleGear = (gear) => {
    setSelectedGear(prev => {
      const copy = { ...prev };
      if (copy[gear.id]) {
        delete copy[gear.id];
      } else {
        copy[gear.id] = 1;
      }
      return copy;
    });
  };

  const handleItemQuantityChange = (gearId, maxAvail, qty) => {
    const val = Math.max(1, Math.min(maxAvail, parseInt(qty, 10) || 1));
    setSelectedGear(prev => ({ ...prev, [gearId]: val }));
  };

  const filteredGear = availableGear.filter(g => {
    if (selectedCategory !== 'ALL' && g.categoryId !== selectedCategory) return false;
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      g.name.toLowerCase().includes(q) ||
      g.assetTag.toLowerCase().includes(q) ||
      g.brand.toLowerCase().includes(q) ||
      (g.model && g.model.toLowerCase().includes(q))
    );
  });

  const selectedCount = Object.keys(selectedGear).length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.startDate || !formData.endDate || !formData.purpose.trim()) {
      setErrorMsg('Start date, end date, and shoot purpose are required.');
      return;
    }

    if (selectedCount === 0) {
      setErrorMsg('Please select at least one piece of equipment for this request.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');

      const equipmentPayload = Object.entries(selectedGear).map(([id, quantity]) => ({
        id,
        equipmentId: id,
        quantity
      }));

      const payload = {
        ...formData,
        equipmentIds: equipmentPayload
      };

      await onSubmit(payload);
      onHide();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to submit borrow request.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!show) return null;

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)' }}>
      <div className="modal-dialog modal-dialog-centered modal-xl">
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '12px', overflow: 'hidden' }}>
          {/* Header */}
          <div className="modal-header bg-slate-900 text-white" style={{ backgroundColor: '#0f172a' }}>
            <div className="d-flex align-items-center gap-2">
              <div className="p-2 rounded bg-primary-subtle text-primary d-flex align-items-center justify-content-center" style={{ width: 34, height: 34 }}>
                <i className="bi bi-calendar2-plus"></i>
              </div>
              <h6 className="modal-title fw-bold text-white mb-0">Equipment Borrowing Requisition</h6>
            </div>
            <button
              type="button"
              className="modal-close-btn"
              onClick={onHide}
              aria-label="Close"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4" style={{ maxHeight: '76vh', overflowY: 'auto' }}>
              {errorMsg && (
                <div className="alert alert-danger py-2 px-3 small mb-3 d-flex align-items-center gap-2">
                  <i className="bi bi-exclamation-octagon-fill"></i>
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* SECTION 1: Production Project & Schedule */}
              <div className="p-3 border rounded bg-light mb-3">
                <h6 className="fw-bold text-secondary small text-uppercase mb-2">
                  <i className="bi bi-calendar-event text-primary me-1"></i> 1. Production Project & Schedule
                </h6>
                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label small fw-semibold text-secondary">Registered Project</label>
                    <select
                      className="form-select form-select-sm"
                      name="projectId"
                      value={formData.projectId}
                      onChange={(e) => {
                        const sel = projects.find(p => p.id === e.target.value);
                        setFormData(prev => ({
                          ...prev,
                          projectId: e.target.value,
                          projectName: sel ? sel.title : prev.projectName
                        }));
                      }}
                    >
                      <option value="">-- Choose Existing Project or Enter Below --</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.projectCode} - {p.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-4">
                    <label className="form-label small fw-semibold text-secondary">Project / Shoot Name</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      name="projectName"
                      placeholder="Shoot name"
                      value={formData.projectName}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-2">
                    <label className="form-label small fw-semibold text-secondary">
                      Required From <span className="required-star">*</span>
                    </label>
                    <input
                      type="date"
                      className="form-control form-control-sm"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-2">
                    <label className="form-label small fw-semibold text-secondary">
                      Return By <span className="required-star">*</span>
                    </label>
                    <input
                      type="date"
                      className="form-control form-control-sm"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: Purpose & Location */}
              <div className="p-3 border rounded bg-light mb-3">
                <h6 className="fw-bold text-secondary small text-uppercase mb-2">
                  <i className="bi bi-geo-alt text-primary me-1"></i> 2. Shoot Purpose & Location
                </h6>
                <div className="row g-3">
                  <div className="col-md-7">
                    <label className="form-label small fw-semibold text-secondary">
                      Shoot Purpose & Scope <span className="required-star">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      name="purpose"
                      placeholder="Shoot purpose & details"
                      value={formData.purpose}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-md-5">
                    <label className="form-label small fw-semibold text-secondary">Location / Studio Stage</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      name="destination"
                      placeholder="Shooting location"
                      value={formData.destination}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: Equipment Selector with Categories & Photos */}
              <div className="p-3 border rounded bg-white mb-2">
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-3">
                  <div>
                    <h6 className="fw-bold text-dark mb-0">
                      <i className="bi bi-camera text-primary me-1"></i> 3. Select Equipment & Quantities
                    </h6>
                    <small className="text-muted">Choose gear from the stock vault and specify quantities requested.</small>
                  </div>
                  <span className="badge bg-primary fs-6">
                    {selectedCount} item(s) selected
                  </span>
                </div>

                {/* Category Filter Navigation Pills & Search */}
                <div className="mb-3">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <div className="input-group input-group-sm flex-grow-1">
                      <span className="input-group-text bg-white"><i className="bi bi-search text-muted"></i></span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search equipment..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      {searchTerm && (
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => setSearchTerm('')}
                        >
                          <i className="bi bi-x-lg"></i>
                        </button>
                      )}
                    </div>

                    <div style={{ minWidth: '180px' }}>
                      <select
                        className="form-select form-select-sm"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                      >
                        <option value="ALL">All Categories ({availableGear.length})</option>
                        {categories.map(cat => {
                          const catCount = availableGear.filter(g => g.categoryId === cat.id).length;
                          return (
                            <option key={cat.id} value={cat.id}>
                              {cat.name} ({catCount})
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>

                  {/* Horizontal Scrollable Category Pills */}
                  <div
                    className="d-flex align-items-center gap-1 overflow-auto pb-1"
                    style={{ whiteSpace: 'nowrap', scrollbarWidth: 'thin' }}
                  >
                    <button
                      type="button"
                      className={`btn btn-sm py-1 px-2 rounded-pill text-nowrap d-flex align-items-center gap-1 ${
                        selectedCategory === 'ALL'
                          ? 'btn-dark fw-bold text-white shadow-sm'
                          : 'btn-outline-secondary bg-white text-secondary'
                      }`}
                      style={{ fontSize: '0.74rem' }}
                      onClick={() => setSelectedCategory('ALL')}
                    >
                      <i className="bi bi-grid-fill"></i>
                      <span>All Categories</span>
                      <span className={`badge rounded-pill ms-1 ${selectedCategory === 'ALL' ? 'bg-primary text-white' : 'bg-light text-dark border'}`}>
                        {availableGear.length}
                      </span>
                    </button>

                    {categories.map(cat => {
                      const count = availableGear.filter(g => g.categoryId === cat.id).length;
                      const isSelected = selectedCategory === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          className={`btn btn-sm py-1 px-2 rounded-pill text-nowrap d-flex align-items-center gap-1 ${
                            isSelected
                              ? 'btn-primary fw-bold text-white shadow-sm'
                              : 'btn-outline-secondary bg-white text-secondary'
                          }`}
                          style={{ fontSize: '0.74rem' }}
                          onClick={() => setSelectedCategory(cat.id)}
                        >
                          <i className={`bi ${cat.icon || 'bi-box'}`}></i>
                          <span>{cat.name}</span>
                          <span className={`badge rounded-pill ms-1 ${isSelected ? 'bg-white text-primary' : 'bg-light text-dark border'}`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Filter info banner */}
                <div className="d-flex align-items-center justify-content-between small text-muted px-1 mb-2">
                  <span>
                    Showing <strong className="text-dark">{filteredGear.length}</strong> available item(s) 
                    {selectedCategory !== 'ALL' && (
                      <> in <strong className="text-primary">{categories.find(c => c.id === selectedCategory)?.name || 'Selected Category'}</strong></>
                    )}
                    {searchTerm && <> matching &quot;{searchTerm}&quot;</>}
                  </span>
                  {selectedCategory !== 'ALL' && (
                    <button
                      type="button"
                      className="btn btn-link btn-sm p-0 text-decoration-none"
                      style={{ fontSize: '0.75rem' }}
                      onClick={() => setSelectedCategory('ALL')}
                    >
                      Clear category filter
                    </button>
                  )}
                </div>

                {/* Equipment Cards Grid */}
                <div className="row g-2" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                  {filteredGear.length === 0 ? (
                    <div className="col-12 text-center py-4 text-muted small">
                      <i className="bi bi-inbox fs-3 d-block text-secondary mb-1"></i>
                      No matching available equipment found in this category.
                    </div>
                  ) : (
                    filteredGear.map((gear) => {
                      const isSelected = Boolean(selectedGear[gear.id]);
                      const maxAvail = gear.availableQuantity !== undefined ? gear.availableQuantity : (gear.quantity || 1);
                      const currentQty = selectedGear[gear.id] || 1;

                      return (
                        <div key={gear.id} className="col-12 col-md-6 col-lg-4">
                          <div
                            className={`p-2 border rounded d-flex align-items-center gap-2 cursor-pointer transition ${isSelected ? 'border-primary bg-primary-subtle shadow-sm' : 'bg-light'}`}
                            onClick={() => handleToggleGear(gear)}
                          >
                            <img
                              src={gear.imageUrl || 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=100&auto=format&fit=crop&q=80'}
                              alt=""
                              className="rounded border"
                              style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                            />

                            <div className="flex-grow-1 overflow-hidden">
                              <div className="d-flex align-items-center gap-1">
                                <span className="badge bg-dark font-monospace" style={{ fontSize: '0.65rem' }}>
                                  {gear.assetTag}
                                </span>
                                <span className="badge bg-success-subtle text-success border" style={{ fontSize: '0.65rem' }}>
                                  {maxAvail} avail
                                </span>
                              </div>
                              <div className="fw-bold text-dark small text-truncate" title={gear.name}>
                                {gear.name}
                              </div>
                              <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                                {gear.brand} {gear.model}
                              </div>
                            </div>

                            {/* Quantity Selector if selected */}
                            {isSelected && (
                              <div
                                className="d-flex align-items-center gap-1 ms-auto"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <label className="small text-muted" style={{ fontSize: '0.68rem' }}>Qty:</label>
                                <input
                                  type="number"
                                  min="1"
                                  max={maxAvail}
                                  className="form-control form-control-sm text-center fw-bold"
                                  style={{ width: '52px', height: '28px', padding: '2px' }}
                                  value={currentQty}
                                  onChange={(e) => handleItemQuantityChange(gear.id, maxAvail, e.target.value)}
                                />
                              </div>
                            )}

                            <input
                              type="checkbox"
                              className="form-check-input ms-1"
                              checked={isSelected}
                              onChange={() => {}}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Selected Bundle Tray */}
                {selectedCount > 0 && (
                  <div className="mt-3 p-3 bg-light border rounded">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <div className="fw-bold text-dark small">
                        <i className="bi bi-basket-fill text-primary me-1"></i>
                        Selected Equipment Bundle ({selectedCount} asset types)
                      </div>
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm py-0 px-2"
                        style={{ fontSize: '0.72rem' }}
                        onClick={() => setSelectedGear({})}
                      >
                        Clear All
                      </button>
                    </div>

                    <div className="d-flex flex-wrap gap-2">
                      {Object.entries(selectedGear).map(([id, qty]) => {
                        const gear = availableGear.find(g => g.id === id);
                        if (!gear) return null;
                        const maxAvail = gear.availableQuantity !== undefined ? gear.availableQuantity : (gear.quantity || 1);
                        return (
                          <div
                            key={id}
                            className="p-1 px-2 bg-white border rounded shadow-sm d-flex align-items-center gap-2"
                            style={{ fontSize: '0.75rem' }}
                          >
                            <span className="badge bg-dark font-monospace" style={{ fontSize: '0.62rem' }}>
                              {gear.assetTag}
                            </span>
                            <span className="fw-semibold text-truncate" style={{ maxWidth: '140px' }} title={gear.name}>
                              {gear.name}
                            </span>
                            <div className="d-flex align-items-center gap-1 border-start ps-2">
                              <span className="text-muted" style={{ fontSize: '0.68rem' }}>x</span>
                              <input
                                type="number"
                                min="1"
                                max={maxAvail}
                                className="form-control form-control-sm text-center fw-bold p-0"
                                style={{ width: '40px', height: '22px' }}
                                value={qty}
                                onChange={(e) => handleItemQuantityChange(id, maxAvail, e.target.value)}
                              />
                              <button
                                type="button"
                                className="btn btn-link btn-sm text-danger p-0 ms-1"
                                onClick={() => handleToggleGear(gear)}
                                title="Remove item"
                              >
                                <i className="bi bi-x-circle-fill"></i>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="modal-footer bg-light px-4 py-3">
              <button type="button" className="btn btn-outline-secondary" onClick={onHide}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary px-4 fw-semibold"
                disabled={submitting || selectedCount === 0}
              >
                {submitting ? 'Submitting Requisition...' : `Submit Borrow Request (${selectedCount} items)`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RequestFormModal;
