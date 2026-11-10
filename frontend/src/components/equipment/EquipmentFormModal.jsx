import React, { useState, useEffect } from 'react';
import { uploadEquipmentImage } from '../../services/equipmentService';

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
        location: '',
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

  const handleAddAccessory = () => {
    if (newAccessory.trim()) {
      setAccessories([...accessories, newAccessory.trim()]);
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
      setErrorMsg(err.response?.data?.message || 'Failed to upload image.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.assetTag || !formData.name || !formData.brand || !formData.serialNumber || !formData.categoryId) {
      setErrorMsg('Please fill in all required fields (Asset Tag, Name, Brand, Serial Number, Category).');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');
      const payload = {
        ...formData,
        accessories
      };
      await onSubmit(payload);
      onHide();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error saving equipment item.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!show) return null;

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)' }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content border-0 shadow">
          <div className="modal-header bg-slate-900 text-white" style={{ backgroundColor: '#1e293b' }}>
            <h6 className="modal-title fw-bold text-white mb-0">
              <i className={`bi ${isEdit ? 'bi-pencil-square' : 'bi-plus-circle'} me-2 text-primary`}></i>
              {isEdit ? 'Edit Equipment Item' : 'Register New Equipment Asset'}
            </h6>
            <button type="button" className="btn-close btn-close-white" onClick={onHide}></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
              {errorMsg && (
                <div className="alert alert-danger py-2 small mb-3">
                  <i className="bi bi-exclamation-circle me-1"></i> {errorMsg}
                </div>
              )}

              {/* Basic Identifiers */}
              <div className="row g-3 mb-3">
                <div className="col-md-4">
                  <label className="form-label small fw-semibold text-secondary">
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
                  <label className="form-label small fw-semibold text-secondary">
                    Serial Number <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    name="serialNumber"
                    placeholder="e.g. SN-FX3-99120"
                    value={formData.serialNumber}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-semibold text-secondary">
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
              </div>

              {/* Name & Model */}
              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label small fw-semibold text-secondary">
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
                  <label className="form-label small fw-semibold text-secondary">
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
                  <label className="form-label small fw-semibold text-secondary">
                    Model
                  </label>
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

              {/* Status, Condition, Location */}
              <div className="row g-3 mb-3">
                <div className="col-md-4">
                  <label className="form-label small fw-semibold text-secondary">Status</label>
                  <select
                    className="form-select"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="BORROWED">Borrowed</option>
                    <option value="UNDER_MAINTENANCE">Under Maintenance</option>
                    <option value="DAMAGED">Damaged</option>
                    <option value="RETIRED">Retired</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-semibold text-secondary">Condition</label>
                  <select
                    className="form-select"
                    name="condition"
                    value={formData.condition}
                    onChange={handleChange}
                  >
                    <option value="EXCELLENT">Excellent</option>
                    <option value="GOOD">Good</option>
                    <option value="FAIR">Fair</option>
                    <option value="POOR">Poor</option>
                    <option value="DAMAGED">Damaged</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-semibold text-secondary">Location / Vault Shelf</label>
                  <input
                    type="text"
                    className="form-control"
                    name="location"
                    placeholder="e.g. Shelf A-02 / Grip Room"
                    value={formData.location}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Financial & Daily Rate */}
              <div className="row g-3 mb-3">
                <div className="col-md-4">
                  <label className="form-label small fw-semibold text-secondary">Purchase Price ($)</label>
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
                <div className="col-md-4">
                  <label className="form-label small fw-semibold text-secondary">Estimated Daily Rate ($)</label>
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
                <div className="col-md-4">
                  <label className="form-label small fw-semibold text-secondary">Purchase Date</label>
                  <input
                    type="date"
                    className="form-control"
                    name="purchaseDate"
                    value={formData.purchaseDate}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Image URL & File Upload */}
              <div className="row g-3 mb-3">
                <div className="col-md-8">
                  <label className="form-label small fw-semibold text-secondary">Image URL</label>
                  <input
                    type="url"
                    className="form-control"
                    name="imageUrl"
                    placeholder="https://... or upload below"
                    value={formData.imageUrl}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-semibold text-secondary">Or Upload Photo</label>
                  <input
                    type="file"
                    className="form-control"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploadingImage}
                  />
                  {uploadingImage && <span className="small text-muted">Uploading...</span>}
                </div>
              </div>

              {/* Dynamic Accessories Checklist */}
              <div className="mb-3">
                <label className="form-label small fw-semibold text-secondary d-flex justify-content-between">
                  <span>Accessories & Case Checklist (Verified during Handover)</span>
                  <span className="text-muted fw-normal">{accessories.length} item(s)</span>
                </label>
                <div className="input-group mb-2">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. 2x Sony NP-FZ100 Batteries, Lens Hood, Pelican Case"
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
                    onClick={handleAddAccessory}
                  >
                    <i className="bi bi-plus-lg"></i> Add
                  </button>
                </div>

                <div className="p-2 border rounded bg-light" style={{ minHeight: '48px' }}>
                  {accessories.length === 0 ? (
                    <span className="small text-muted">No accessories added yet.</span>
                  ) : (
                    accessories.map((acc, index) => (
                      <span key={index} className="accessory-badge">
                        {acc}
                        <i
                          className="bi bi-x ms-1 text-danger"
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleRemoveAccessory(index)}
                        ></i>
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="form-label small fw-semibold text-secondary">Notes & Firmware Specs</label>
                <textarea
                  className="form-control"
                  rows="2"
                  name="notes"
                  placeholder="e.g. Firmware v5.0 installed. Sensor inspected Nov 2026."
                  value={formData.notes}
                  onChange={handleChange}
                ></textarea>
              </div>
            </div>

            <div className="modal-footer bg-light py-2">
              <button type="button" className="btn btn-sm btn-secondary" onClick={onHide} disabled={submitting}>
                Cancel
              </button>
              <button type="submit" className="btn btn-sm btn-primary" disabled={submitting}>
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1"></span> Saving...
                  </>
                ) : isEdit ? (
                  'Update Equipment'
                ) : (
                  'Create Equipment'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EquipmentFormModal;
