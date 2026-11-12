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
    quantity: 1,
    availableQuantity: 1,
    status: 'AVAILABLE',
    condition: 'EXCELLENT',
    purchaseDate: '',
    purchasePrice: '',
    dailyRate: '',
    imageUrl: '',
    notes: ''
  });

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
        quantity: equipment.quantity !== undefined ? equipment.quantity : 1,
        availableQuantity: equipment.availableQuantity !== undefined ? equipment.availableQuantity : 1,
        status: equipment.status || 'AVAILABLE',
        condition: equipment.condition || 'EXCELLENT',
        purchaseDate: equipment.purchaseDate ? equipment.purchaseDate.substring(0, 10) : '',
        purchasePrice: equipment.purchasePrice !== null && equipment.purchasePrice !== undefined ? equipment.purchasePrice : '',
        dailyRate: equipment.dailyRate !== null && equipment.dailyRate !== undefined ? equipment.dailyRate : '',
        imageUrl: equipment.imageUrl || '',
        notes: equipment.notes || ''
      });
    } else {
      setFormData({
        assetTag: '',
        name: '',
        brand: '',
        model: '',
        serialNumber: '',
        categoryId: categories[0]?.id || '',
        quantity: 1,
        availableQuantity: 1,
        status: 'AVAILABLE',
        condition: 'EXCELLENT',
        purchaseDate: new Date().toISOString().substring(0, 10),
        purchasePrice: '',
        dailyRate: '',
        imageUrl: '',
        notes: ''
      });
    }
    setErrorMsg('');
  }, [equipment, categories, show]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const next = { ...prev, [name]: value };
      // When quantity changes for a new item, synchronize availableQuantity
      if (!isEdit && name === 'quantity') {
        const qty = Math.max(1, parseInt(value, 10) || 1);
        next.quantity = qty;
        next.availableQuantity = qty;
      }
      return next;
    });
  };

  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
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
    if (!formData.assetTag.trim() || !formData.name.trim() || !formData.brand.trim() || !formData.serialNumber.trim()) {
      setErrorMsg('Asset Tag, Equipment Name, Brand, and Serial Number are required.');
      return;
    }

    if (!formData.categoryId) {
      setErrorMsg('Please select a category for this equipment item.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');
      await onSubmit({
        ...formData,
        assetTag: formData.assetTag.trim().toUpperCase(),
        serialNumber: formData.serialNumber.trim(),
        quantity: parseInt(formData.quantity, 10) || 1,
        availableQuantity: parseInt(formData.availableQuantity, 10) || 1,
        purchasePrice: formData.purchasePrice !== '' ? parseFloat(formData.purchasePrice) : null,
        dailyRate: formData.dailyRate !== '' ? parseFloat(formData.dailyRate) : null
      });
      onHide();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to save equipment.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!show) return null;

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)' }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '12px', overflow: 'hidden' }}>
          {/* Header */}
          <div className="modal-header bg-slate-900 text-white" style={{ backgroundColor: '#0f172a' }}>
            <div className="d-flex align-items-center gap-2">
              <div className="p-2 rounded bg-primary-subtle text-primary d-flex align-items-center justify-content-center" style={{ width: 34, height: 34 }}>
                <i className={`bi ${isEdit ? 'bi-pencil-square' : 'bi-box-seam'}`}></i>
              </div>
              <h6 className="modal-title fw-bold text-white mb-0">
                {isEdit ? `Edit Equipment: ${equipment.assetTag}` : 'Register Equipment in Stock Vault'}
              </h6>
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
                  <i className="bi bi-exclamation-triangle-fill"></i>
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Photo Upload Section */}
              <div className="p-3 border rounded bg-light mb-4">
                <div className="d-flex flex-column flex-sm-row align-items-sm-center gap-3">
                  <div
                    className="border rounded bg-white d-flex align-items-center justify-content-center overflow-hidden"
                    style={{ width: '110px', height: '110px', flexShrink: 0 }}
                  >
                    {formData.imageUrl ? (
                      <img
                        src={formData.imageUrl}
                        alt="Preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <i className="bi bi-camera text-muted fs-1"></i>
                    )}
                  </div>

                  <div className="flex-grow-1">
                    <label className="form-label small fw-semibold text-secondary mb-1">
                      Equipment Photo
                    </label>
                    <div className="d-flex flex-wrap gap-2 mb-2">
                      <label className="btn btn-sm btn-outline-primary mb-0 cursor-pointer">
                        <i className="bi bi-upload me-1"></i>
                        {uploadingImage ? 'Uploading...' : 'Upload Image File'}
                        <input
                          type="file"
                          accept="image/*"
                          className="d-none"
                          onChange={handleImageFileChange}
                          disabled={uploadingImage}
                        />
                      </label>
                      {formData.imageUrl && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <input
                      type="url"
                      className="form-control form-control-sm"
                      placeholder="Image URL: https://..."
                      name="imageUrl"
                      value={formData.imageUrl}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION: Identity & Categorization */}
              <div className="row g-3 mb-3">
                <div className="col-md-4">
                  <label className="form-label small fw-semibold text-secondary">
                    Asset Tag <span className="required-star">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control text-uppercase fw-bold"
                    name="assetTag"
                    placeholder="CAM-001"
                    value={formData.assetTag}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label small fw-semibold text-secondary">
                    Serial Number <span className="required-star">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control font-monospace"
                    name="serialNumber"
                    placeholder="SN-123456"
                    value={formData.serialNumber}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label small fw-semibold text-secondary">
                    Category <span className="required-star">*</span>
                  </label>
                  <select
                    className="form-select"
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleChange}
                    required
                  >
                    <option value="">-- Select Category --</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* SECTION: Gear Name & Specs */}
              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label small fw-semibold text-secondary">
                    Equipment Name <span className="required-star">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    placeholder="Equipment name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="col-md-3">
                  <label className="form-label small fw-semibold text-secondary">
                    Brand <span className="required-star">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    name="brand"
                    placeholder="Brand name"
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
                    placeholder="Model number"
                    value={formData.model}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* SECTION: Stock Quantities & Status */}
              <div className="p-3 border rounded bg-light mb-3">
                <h6 className="fw-bold text-secondary small text-uppercase mb-2">
                  <i className="bi bi-stack me-1 text-primary"></i> Stock Quantities & Status
                </h6>
                <div className="row g-3">
                  <div className="col-md-3">
                    <label className="form-label small fw-semibold text-secondary">
                      Total Quantity in Stock <span className="required-star">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="form-control fw-bold"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-3">
                    <label className="form-label small fw-semibold text-secondary">
                      Available to Borrow
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={formData.quantity}
                      className="form-control text-success fw-bold"
                      name="availableQuantity"
                      value={formData.availableQuantity}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-3">
                    <label className="form-label small fw-semibold text-secondary">Stock Status</label>
                    <select
                      className="form-select"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                    >
                      <option value="AVAILABLE">Available</option>
                      <option value="BORROWED">Borrowed</option>
                      <option value="IN_USE">In Use</option>
                      <option value="UNDER_MAINTENANCE">Under Maintenance</option>
                      <option value="DAMAGED">Damaged</option>
                      <option value="OUT_OF_STOCK">Out of Stock</option>
                      <option value="RETIRED">Retired</option>
                    </select>
                  </div>

                  <div className="col-md-3">
                    <label className="form-label small fw-semibold text-secondary">Condition</label>
                    <select
                      className="form-select"
                      name="condition"
                      value={formData.condition}
                      onChange={handleChange}
                    >
                      <option value="EXCELLENT">Excellent (Like New)</option>
                      <option value="GOOD">Good (Minor Wear)</option>
                      <option value="FAIR">Fair (Visible Scuffs)</option>
                      <option value="POOR">Poor (Needs Attention)</option>
                      <option value="DAMAGED">Damaged (Faulty)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION: Valuation & Pricing */}
              <div className="row g-3 mb-3">
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

                <div className="col-md-4">
                  <label className="form-label small fw-semibold text-secondary">Purchase Value ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-control"
                    placeholder="0.00"
                    name="purchasePrice"
                    value={formData.purchasePrice}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label small fw-semibold text-secondary">Daily Rental Rate ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-control"
                    placeholder="0.00"
                    name="dailyRate"
                    value={formData.dailyRate}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* SECTION: Vault Notes */}
              <div className="mb-0">
                <label className="form-label small fw-semibold text-secondary">Equipment Notes & Specifications</label>
                <textarea
                  className="form-control"
                  rows="2"
                  name="notes"
                  placeholder="Notes & specifications (optional)"
                  value={formData.notes}
                  onChange={handleChange}
                ></textarea>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="modal-footer bg-light px-4 py-3">
              <button type="button" className="btn btn-outline-secondary" onClick={onHide}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                <i className="bi bi-check-lg me-1"></i>
                {submitting ? 'Saving...' : (isEdit ? 'Update Equipment' : 'Register Equipment')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EquipmentFormModal;
