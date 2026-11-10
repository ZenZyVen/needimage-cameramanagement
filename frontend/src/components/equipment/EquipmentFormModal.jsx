import React, { useState, useEffect } from 'react';
import { uploadEquipmentImage } from '../../services/equipmentService';

const COMMON_ACCESSORIES_SUGGESTIONS = [
  '2x Batteries',
  'Dual Charger',
  'Body Cap',
  'Lens Front Cap',
  'Rear Cap',
  'Lens Hood',
  'Pelican Hard Case',
  'HDMI Cable Clamp',
  'AC Power Supply',
  'Top XLR Handle',
  'CFexpress 512GB Card'
];

const EquipmentFormModal = ({ show, onHide, onSubmit, equipment = null, categories = [] }) => {
  const isEdit = Boolean(equipment);

  const [formData, setFormData] = useState({
    assetTag: '',
    name: '',
    brand: '',
    model: '',
    serialNumber: '',
    categoryId: '',
    status: 'AVAILABLE',
    condition: 'EXCELLENT',
    purchaseDate: '',
    purchasePrice: '',
    dailyRate: '',
    location: '',
    imageUrl: '',
    notes: ''
  });

  const [accessories, setAccessories] = useState([]);
  const [newAccessory, setNewAccessory] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (equipment) {
      setFormData({
        assetTag: equipment.assetTag || '',
        name: equipment.name || '',
        brand: equipment.brand || '',
        model: equipment.model || '',
        serialNumber: equipment.serialNumber || '',
        categoryId: equipment.categoryId || (categories[0]?.id || ''),
        status: equipment.status || 'AVAILABLE',
        condition: equipment.condition || 'EXCELLENT',
        purchaseDate: equipment.purchaseDate ? equipment.purchaseDate.substring(0, 10) : '',
        purchasePrice: equipment.purchasePrice !== null ? equipment.purchasePrice : '',
        dailyRate: equipment.dailyRate !== null ? equipment.dailyRate : '',
        location: equipment.location || '',
        imageUrl: equipment.imageUrl || '',
        notes: equipment.notes || ''
      });
      setAccessories(Array.isArray(equipment.accessories) ? equipment.accessories : []);
    } else {
      setFormData({
        assetTag: '',
        name: '',
        brand: '',
        model: '',
        serialNumber: '',
        categoryId: categories[0]?.id || '',
        status: 'AVAILABLE',
        condition: 'EXCELLENT',
        purchaseDate: '',
        purchasePrice: '',
        dailyRate: '',
        location: 'Vault Locker A-01',
        imageUrl: '',
        notes: ''
      });
      setAccessories([]);
    }
    setErrorMsg('');
  }, [equipment, categories, show]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddAccessory = (accToAdd) => {
    const val = (accToAdd || newAccessory).trim();
    if (val && !accessories.includes(val)) {
      setAccessories([...accessories, val]);
      setNewAccessory('');
    }
  };

  const handleRemoveAccessory = (index) => {
    setAccessories(accessories.filter((_, idx) => idx !== index));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploadingImage(true);
      setErrorMsg('');
      const res = await uploadEquipmentImage(file);
      if (res.data?.success) {
        setFormData(prev => ({ ...prev, imageUrl: res.data.imageUrl }));
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to upload photo.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.assetTag || !formData.name || !formData.brand || !formData.serialNumber || !formData.categoryId) {
      setErrorMsg('Please fill out all required fields marked with an asterisk (*).');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');
      await onSubmit({ ...formData, accessories });
      onHide();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to save equipment.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!show) return null;

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)' }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content border-0 shadow">
          {/* Header */}
          <div className="modal-header bg-slate-900 text-white" style={{ backgroundColor: '#0f172a' }}>
            <div className="d-flex align-items-center gap-2">
              <i className={`bi ${isEdit ? 'bi-pencil-square' : 'bi-plus-circle'} text-primary fs-5`}></i>
              <h6 className="modal-title fw-bold text-white mb-0">
                {isEdit ? `Edit Equipment: ${formData.assetTag}` : 'Register New Inventory Asset'}
              </h6>
            </div>
            <button type="button" className="btn-close btn-close-white" onClick={onHide}></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4" style={{ maxHeight: '74vh', overflowY: 'auto' }}>
              {errorMsg && (
                <div className="alert alert-danger py-2 small mb-3">
                  <i className="bi bi-exclamation-circle me-1"></i> {errorMsg}
                </div>
              )}

              {/* 1. Basic Information Section */}
              <div className="form-section-card">
                <div className="form-section-title">
                  <i className="bi bi-tag-fill text-primary"></i> 1. Asset Identity & Classification
                </div>

                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label">
                      Asset Tag <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="assetTag"
                      placeholder="e.g. CAM-005"
                      value={formData.assetTag}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">
                      Serial Number <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="serialNumber"
                      placeholder="e.g. SN-882194"
                      value={formData.serialNumber}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">
                      Category <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      name="categoryId"
                      value={formData.categoryId}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      Item Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="name"
                      placeholder="e.g. Sony FX3 Full-Frame Cinema Camera"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-3">
                    <label className="form-label">
                      Brand <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="brand"
                      placeholder="e.g. Sony"
                      value={formData.brand}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-3">
                    <label className="form-label">Model</label>
                    <input
                      type="text"
                      className="form-control"
                      name="model"
                      placeholder="e.g. ILME-FX3"
                      value={formData.model}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {/* 2. Vault Status & Financials */}
              <div className="form-section-card">
                <div className="form-section-title">
                  <i className="bi bi-geo-alt-fill text-primary"></i> 2. Vault Location, Status & Valuation
                </div>

                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label">Vault Status</label>
                    <select
                      className="form-select"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                    >
                      <option value="AVAILABLE">Available (In Vault)</option>
                      <option value="BORROWED">Borrowed (On Shoot)</option>
                      <option value="UNDER_MAINTENANCE">Under Maintenance</option>
                      <option value="DAMAGED">Damaged / Defective</option>
                      <option value="RETIRED">Retired / Decommissioned</option>
                    </select>
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">Physical Condition</label>
                    <select
                      className="form-select"
                      name="condition"
                      value={formData.condition}
                      onChange={handleChange}
                    >
                      <option value="EXCELLENT">Excellent (Like New)</option>
                      <option value="GOOD">Good (Normal Wear)</option>
                      <option value="FAIR">Fair (Minor Scuffs)</option>
                      <option value="POOR">Poor (Needs Inspection)</option>
                      <option value="DAMAGED">Damaged / Non-functional</option>
                    </select>
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">Storage Shelf / Locker</label>
                    <input
                      type="text"
                      className="form-control"
                      name="location"
                      placeholder="e.g. Shelf A-02 / Grip Bay"
                      value={formData.location}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">Purchase Price ($)</label>
                    <div className="input-group">
                      <span className="input-group-text">$</span>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        name="purchasePrice"
                        placeholder="0.00"
                        value={formData.purchasePrice}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">Daily Rental Rate ($)</label>
                    <div className="input-group">
                      <span className="input-group-text">$</span>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        name="dailyRate"
                        placeholder="0.00"
                        value={formData.dailyRate}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">Purchase Date</label>
                    <input
                      type="date"
                      className="form-control"
                      name="purchaseDate"
                      value={formData.purchaseDate}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {/* 3. Included Accessories Checklist (The Interactive Tag Builder) */}
              <div className="form-section-card">
                <div className="form-section-title">
                  <i className="bi bi-box-fill text-primary"></i> 3. Kit Accessories Checklist ({accessories.length})
                </div>

                <div className="input-group mb-2">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Type accessory name (e.g. 2x Sony NP-FZ100 Batteries)..."
                    value={newAccessory}
                    onChange={(e) => setNewAccessory(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddAccessory();
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => handleAddAccessory()}
                  >
                    <i className="bi bi-plus-lg"></i> Add
                  </button>
                </div>

                {/* Quick Add Suggestions Chips */}
                <div className="mb-2">
                  <span className="text-muted small me-2" style={{ fontSize: '0.72rem' }}>Quick add:</span>
                  <div className="d-inline-flex flex-wrap gap-1">
                    {COMMON_ACCESSORIES_SUGGESTIONS.map((sug, idx) => (
                      <span
                        key={idx}
                        className="badge bg-white text-secondary border accessory-badge-clickable"
                        style={{ fontSize: '0.7rem' }}
                        onClick={() => handleAddAccessory(sug)}
                      >
                        + {sug}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Current Active Accessories Tags */}
                <div className="p-2 border rounded bg-white" style={{ minHeight: '44px' }}>
                  {accessories.length === 0 ? (
                    <span className="small text-muted" style={{ fontSize: '0.78rem' }}>
                      No accessories added. Standard body/item only.
                    </span>
                  ) : (
                    accessories.map((acc, index) => (
                      <span key={index} className="accessory-badge">
                        <i className="bi bi-check2 text-success me-1"></i>
                        {acc}
                        <i
                          className="bi bi-x ms-1 text-danger"
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleRemoveAccessory(index)}
                          title="Remove item"
                        ></i>
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* 4. Equipment Photo & Vault Notes */}
              <div className="form-section-card mb-0">
                <div className="form-section-title">
                  <i className="bi bi-image-fill text-primary"></i> 4. Equipment Image & Maintenance Notes
                </div>

                <div className="row g-3">
                  <div className="col-md-8">
                    <label className="form-label">Image URL</label>
                    <input
                      type="url"
                      className="form-control"
                      name="imageUrl"
                      placeholder="https://... or upload photo on right"
                      value={formData.imageUrl}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">Or Upload File</label>
                    <input
                      type="file"
                      className="form-control"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={uploadingImage}
                    />
                    {uploadingImage && <span className="small text-muted">Uploading...</span>}
                  </div>

                  <div className="col-12">
                    <label className="form-label">Vault Notes / Technical Specifications</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      name="notes"
                      placeholder="Firmware versions, calibrated accessories, sensor inspection date..."
                      value={formData.notes}
                      onChange={handleChange}
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-sm btn-secondary" onClick={onHide} disabled={submitting}>
                Cancel
              </button>
              <button type="submit" className="btn btn-sm btn-primary" disabled={submitting}>
                {submitting ? 'Saving...' : isEdit ? 'Update Asset' : 'Save & Register Gear'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EquipmentFormModal;
