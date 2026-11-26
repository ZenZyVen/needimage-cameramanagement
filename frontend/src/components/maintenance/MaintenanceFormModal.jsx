import React, { useState, useEffect } from 'react';
import { getEquipment } from '../../services/equipmentService';
import { uploadDamageImage } from '../../services/maintenanceService';

const DAMAGE_CATEGORIES = [
  'Optics (Scratches, Fungus, Coating)',
  'Sensor (Dust, Dead Pixels, Shutter Fault)',
  'Cable & Port (HDMI, SDI, USB-C, XLR)',
  'Electronics & Motherboard',
  'Motor & Mechanical (Gimbal Drift, Focus Motor)',
  'Housing & Physical (Cracked Body, Mount)',
  'Audio & Microphone (Distortion, Capsule)',
  'Battery & Power (Swelling, Charging Fault)',
  'Calibration & Routine Maintenance',
  'General Servicing'
];

const MaintenanceFormModal = ({ show, onHide, onSubmit, equipmentItem = null }) => {
  const [equipmentList, setEquipmentList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [selectedEquipment, setSelectedEquipment] = useState(equipmentItem || null);

  const [formData, setFormData] = useState({
    equipmentId: '',
    issueTitle: '',
    description: '',
    severity: 'MEDIUM',
    damageCategory: 'Optics (Scratches, Fungus, Coating)',
    technician: '',
    vendor: '',
    cost: '',
    scheduledDate: '',
    notes: '',
    damageImageUrl: ''
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (show) {
      setErrorMsg('');
      setSearchTerm('');
      setCategoryFilter('ALL');
      const targetEq = equipmentItem || null;
      setSelectedEquipment(targetEq);
      setImagePreview('');

      setFormData({
        equipmentId: targetEq ? targetEq.id : '',
        issueTitle: '',
        description: '',
        severity: 'MEDIUM',
        damageCategory: 'Optics (Scratches, Fungus, Coating)',
        technician: '',
        vendor: '',
        cost: '',
        scheduledDate: '',
        notes: '',
        damageImageUrl: ''
      });

      if (!targetEq) {
        getEquipment({ limit: 150 })
          .then(res => {
            if (res.data?.data) setEquipmentList(res.data.data);
          })
          .catch(err => console.warn(err));
      }
    }
  }, [show, equipmentItem]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectEquipment = (eq) => {
    setSelectedEquipment(eq);
    setFormData(prev => ({ ...prev, equipmentId: eq.id }));
  };

  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);

    try {
      setUploadingImage(true);
      const res = await uploadDamageImage(file);
      if (res.data?.success && res.data.imageUrl) {
        setFormData(prev => ({ ...prev, damageImageUrl: res.data.imageUrl }));
      }
    } catch (err) {
      console.error('Image upload failed, falling back to data URL:', err);
      // Fallback to local base64
      setFormData(prev => ({ ...prev, damageImageUrl: reader.result }));
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.equipmentId) {
      setErrorMsg('Please select an equipment item to report.');
      return;
    }
    if (!formData.issueTitle.trim() || !formData.description.trim()) {
      setErrorMsg('Please enter an issue title and detailed problem description.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');
      await onSubmit(formData);
      onHide();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error creating maintenance ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter equipment list
  const filteredEquipment = equipmentList.filter(eq => {
    const matchesSearch = !searchTerm || 
      eq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eq.assetTag.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eq.brand?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || eq.category?.name === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Extract unique categories from loaded list
  const availableCategories = Array.from(new Set(equipmentList.map(eq => eq.category?.name).filter(Boolean)));

  if (!show) return null;

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)' }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content border-0 shadow-lg">
          {/* Header */}
          <div className="modal-header bg-slate-900 text-white" style={{ backgroundColor: '#0f172a' }}>
            <div className="d-flex align-items-center gap-2">
              <div className="p-2 rounded bg-warning-subtle text-warning d-flex align-items-center justify-content-center" style={{ width: 34, height: 34 }}>
                <i className="bi bi-tools"></i>
              </div>
              <h6 className="modal-title fw-bold text-white mb-0">Report Damage & Maintenance Ticket</h6>
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
            <div className="modal-body p-4" style={{ maxHeight: '74vh', overflowY: 'auto' }}>
              {errorMsg && (
                <div className="alert alert-danger py-2 px-3 small mb-3 d-flex align-items-center gap-2">
                  <i className="bi bi-exclamation-octagon-fill"></i>
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* SECTION 1: EQUIPMENT SELECTOR */}
              <div className="form-section-card">
                <div className="form-section-title d-flex justify-content-between align-items-center">
                  <span><i className="bi bi-camera text-primary me-1"></i> Select Equipment</span>
                  {selectedEquipment && !equipmentItem && (
                    <button
                      type="button"
                      className="btn btn-sm btn-link text-decoration-none p-0 text-primary"
                      onClick={() => setSelectedEquipment(null)}
                      style={{ fontSize: '0.75rem' }}
                    >
                      Change Equipment
                    </button>
                  )}
                </div>

                {selectedEquipment ? (
                  <div className="p-3 border rounded bg-white shadow-sm d-flex align-items-center gap-3">
                    {selectedEquipment.imageUrl ? (
                      <img
                        src={selectedEquipment.imageUrl}
                        alt={selectedEquipment.name}
                        className="rounded object-fit-cover border flex-shrink-0"
                        style={{ width: '60px', height: '60px' }}
                      />
                    ) : (
                      <div className="bg-light rounded border d-flex align-items-center justify-content-center text-muted flex-shrink-0" style={{ width: '60px', height: '60px' }}>
                        <i className="bi bi-camera fs-3"></i>
                      </div>
                    )}
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center gap-2">
                        <span className="badge bg-slate-900 text-white fw-bold">{selectedEquipment.assetTag}</span>
                        <strong className="text-dark fs-6">{selectedEquipment.name}</strong>
                      </div>
                      <div className="small text-muted mt-1">
                        <span>Brand/Model: {selectedEquipment.brand} {selectedEquipment.model}</span>
                        {selectedEquipment.serialNumber && <span className="ms-2 font-monospace">SN: {selectedEquipment.serialNumber}</span>}
                      </div>
                      <div className="small mt-1 d-flex gap-2 align-items-center">
                        <span className="badge bg-light text-secondary border">
                          Category: {selectedEquipment.category?.name || 'General'}
                        </span>
                        <span className="badge bg-light text-secondary border">
                          Condition: {selectedEquipment.condition || 'GOOD'}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    {/* Filter row */}
                    <div className="row g-2 mb-2">
                      <div className="col-md-7">
                        <div className="input-group input-group-sm">
                          <span className="input-group-text bg-white border-end-0">
                            <i className="bi bi-search text-muted"></i>
                          </span>
                          <input
                            type="text"
                            className="form-control border-start-0"
                            placeholder="Search by asset tag, name, or model..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-5">
                        <select
                          className="form-select form-select-sm"
                          value={categoryFilter}
                          onChange={(e) => setCategoryFilter(e.target.value)}
                        >
                          <option value="ALL">All Categories</option>
                          {availableCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Equipment list picker */}
                    <div className="border rounded bg-light p-2" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                      {filteredEquipment.length === 0 ? (
                        <div className="text-center py-3 text-muted small">No equipment found matching search criteria.</div>
                      ) : (
                        filteredEquipment.map(eq => (
                          <div
                            key={eq.id}
                            className="p-2 mb-1 bg-white rounded border d-flex align-items-center justify-content-between hover-shadow cursor-pointer"
                            onClick={() => handleSelectEquipment(eq)}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="d-flex align-items-center gap-2">
                              {eq.imageUrl ? (
                                <img
                                  src={eq.imageUrl}
                                  alt={eq.name}
                                  className="rounded object-fit-cover"
                                  style={{ width: '32px', height: '32px' }}
                                />
                              ) : (
                                <div className="bg-light rounded d-flex align-items-center justify-content-center text-muted" style={{ width: '32px', height: '32px' }}>
                                  <i className="bi bi-camera"></i>
                                </div>
                              )}
                              <div>
                                <span className="badge bg-slate-900 text-white me-1" style={{ fontSize: '0.68rem' }}>{eq.assetTag}</span>
                                <strong className="small text-dark">{eq.name}</strong>
                                <span className="text-muted small ms-2">{eq.category?.name}</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              className="btn btn-xs btn-outline-primary py-0 px-2"
                              style={{ fontSize: '0.72rem' }}
                            >
                              Select
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 2: DEFECT CATEGORY & SEVERITY */}
              <div className="form-section-card">
                <div className="form-section-title">
                  <i className="bi bi-exclamation-triangle text-warning me-1"></i> Damage Classification & Severity
                </div>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>
                      Damage / Maintenance Category
                    </label>
                    <select
                      className="form-select form-select-sm"
                      name="damageCategory"
                      value={formData.damageCategory}
                      onChange={handleChange}
                      required
                    >
                      {DAMAGE_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>
                      Priority / Severity Level
                    </label>
                    <select
                      className="form-select form-select-sm"
                      name="severity"
                      value={formData.severity}
                      onChange={handleChange}
                    >
                      <option value="LOW">Low (Minor Cosmetic / Scuff)</option>
                      <option value="MEDIUM">Medium (Degraded Performance / Loose)</option>
                      <option value="HIGH">High (Major Fault / Optical Scratch)</option>
                      <option value="CRITICAL">Critical (Inoperable / Quarantine)</option>
                    </select>
                  </div>

                  <div className="col-12">
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>
                      Issue Summary Title
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      name="issueTitle"
                      placeholder="Issue summary"
                      value={formData.issueTitle}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>
                      Detailed Problem Description
                    </label>
                    <textarea
                      className="form-control form-control-sm"
                      rows="3"
                      name="description"
                      placeholder="Detailed problem description"
                      value={formData.description}
                      onChange={handleChange}
                      required
                    ></textarea>
                  </div>
                </div>
              </div>

              {/* SECTION 3: DAMAGE PHOTO UPLOAD */}
              <div className="form-section-card">
                <div className="form-section-title">
                  <i className="bi bi-image text-primary me-1"></i> Damage Photo Evidence
                </div>
                <div className="row g-3 align-items-center">
                  <div className="col-md-8">
                    <label className="form-label small text-muted">
                      Upload photo of damage (JPEG, PNG, WebP)
                    </label>
                    <input
                      type="file"
                      className="form-control form-control-sm"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      disabled={uploadingImage}
                    />
                    {uploadingImage && (
                      <div className="small text-primary mt-1">
                        <span className="spinner-border spinner-border-sm me-1"></span> Uploading damage photo...
                      </div>
                    )}
                  </div>
                  <div className="col-md-4 text-center">
                    {(imagePreview || formData.damageImageUrl) ? (
                      <div className="position-relative d-inline-block">
                        <img
                          src={imagePreview || formData.damageImageUrl}
                          alt="Damage Evidence"
                          className="rounded border shadow-sm object-fit-cover"
                          style={{ width: '80px', height: '80px' }}
                        />
                        <button
                          type="button"
                          className="btn btn-sm btn-danger position-absolute top-0 end-0 p-0 rounded-circle d-flex align-items-center justify-content-center"
                          style={{ width: '20px', height: '20px', transform: 'translate(30%, -30%)' }}
                          onClick={() => {
                            setImagePreview('');
                            setFormData(prev => ({ ...prev, damageImageUrl: '' }));
                          }}
                        >
                          <i className="bi bi-x" style={{ fontSize: '0.75rem' }}></i>
                        </button>
                      </div>
                    ) : (
                      <div className="bg-light border rounded p-2 text-muted small" style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span>No photo attached</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION 4: TECHNICIAN & REPAIR COSTS */}
              <div className="form-section-card mb-0">
                <div className="form-section-title">
                  <i className="bi bi-wrench text-primary me-1"></i> Technician Assignment & Cost Estimation
                </div>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Assigned Technician</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      name="technician"
                      placeholder="Technician name"
                      value={formData.technician}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Authorized Vendor / Service Center</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      name="vendor"
                      placeholder="Vendor / service center"
                      value={formData.vendor}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Estimated Repair Cost ($ USD)</label>
                    <div className="input-group input-group-sm">
                      <span className="input-group-text">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="form-control"
                        name="cost"
                        placeholder="0.00"
                        value={formData.cost}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Target Completion Date</label>
                    <input
                      type="date"
                      className="form-control form-control-sm"
                      name="scheduledDate"
                      value={formData.scheduledDate}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Internal Tracking & Service Notes</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      name="notes"
                      placeholder="Tracking notes (optional)"
                      value={formData.notes}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer bg-light py-3 d-flex justify-content-end gap-2">
              <button type="button" className="btn btn-outline-secondary" onClick={onHide} disabled={submitting}>
                Cancel
              </button>
              <button type="submit" className="btn btn-warning text-dark fw-semibold" disabled={submitting || uploadingImage}>
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1"></span> Processing...
                  </>
                ) : (
                  <>
                    <i className="bi bi-tools me-1"></i> Register Ticket & Quarantine Gear
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceFormModal;