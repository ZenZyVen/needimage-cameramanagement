import React, { useState, useEffect } from 'react';
import { getEquipment } from '../../services/equipmentService';

const MaintenanceFormModal = ({ show, onHide, onSubmit, equipmentItem = null }) => {
  const [equipmentList, setEquipmentList] = useState([]);
  const [formData, setFormData] = useState({
    equipmentId: '',
    issueTitle: '',
    description: '',
    severity: 'MEDIUM',
    vendor: '',
    cost: '',
    scheduledDate: '',
    notes: ''
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (show) {
      setErrorMsg('');
      setFormData({
        equipmentId: equipmentItem ? equipmentItem.id : '',
        issueTitle: '',
        description: '',
        severity: 'MEDIUM',
        vendor: '',
        cost: '',
        scheduledDate: '',
        notes: ''
      });

      if (!equipmentItem) {
        getEquipment({ limit: 100 })
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.equipmentId || !formData.issueTitle || !formData.description) {
      setErrorMsg('Please select equipment, enter issue title, and provide description.');
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

  if (!show) return null;

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)' }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content border-0 shadow-lg">
          <div className="modal-header bg-slate-900 text-white" style={{ backgroundColor: '#0f172a' }}>
            <div className="d-flex align-items-center gap-2">
              <div className="p-2 rounded bg-warning-subtle text-warning d-flex align-items-center justify-content-center" style={{ width: 34, height: 34 }}>
                <i className="bi bi-tools"></i>
              </div>
              <div>
                <h6 className="modal-title fw-bold text-white mb-0">Report Damage & Maintenance Ticket</h6>
                <p className="text-secondary small mb-0" style={{ fontSize: '0.72rem' }}>
                  Log defect, schedule calibration or vendor repair, and flag equipment status
                </p>
              </div>
            </div>
            <button type="button" className="btn-close btn-close-white" onClick={onHide}></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4" style={{ maxHeight: '74vh', overflowY: 'auto' }}>
              {errorMsg && (
                <div className="alert alert-danger py-2 px-3 small mb-3 d-flex align-items-center gap-2">
                  <i className="bi bi-exclamation-octagon-fill"></i>
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* SECTION 1: EQUIPMENT */}
              <div className="form-section-card">
                <div className="form-section-title">
                  <i className="bi bi-camera text-primary"></i> 1. Target Equipment Unit
                </div>
                {equipmentItem ? (
                  <div className="p-3 border rounded bg-white d-flex align-items-center justify-content-between">
                    <div>
                      <span className="badge bg-dark px-2 py-1 me-2" style={{ fontSize: '0.72rem' }}>
                        {equipmentItem.assetTag}
                      </span>
                      <strong className="text-dark fs-6">{equipmentItem.name}</strong>
                      <div className="small text-muted mt-1 font-monospace">Serial #: {equipmentItem.serialNumber}</div>
                    </div>
                    <span className="badge bg-secondary-subtle text-secondary">
                      {equipmentItem.location || 'Vault'}
                    </span>
                  </div>
                ) : (
                  <div>
                    <label className="form-label">
                      Select Equipment From Vault <span className="required-star">*</span>
                    </label>
                    <select
                      className="form-select"
                      name="equipmentId"
                      value={formData.equipmentId}
                      onChange={handleChange}
                      required
                    >
                      <option value="">-- Choose Equipment Item --</option>
                      {equipmentList.map(eq => (
                        <option key={eq.id} value={eq.id}>
                          {eq.assetTag} - {eq.brand} {eq.name} (S/N: {eq.serialNumber})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* SECTION 2: ISSUE & SEVERITY */}
              <div className="form-section-card">
                <div className="form-section-title">
                  <i className="bi bi-exclamation-triangle text-warning"></i> 2. Defect Diagnostics & Severity
                </div>
                <div className="row g-3">
                  <div className="col-md-8">
                    <label className="form-label">
                      Issue Summary Title <span className="required-star">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="issueTitle"
                      placeholder="e.g. Scratched Front Element / Loose 12G-SDI Output Port"
                      value={formData.issueTitle}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Severity Level</label>
                    <select
                      className="form-select"
                      name="severity"
                      value={formData.severity}
                      onChange={handleChange}
                    >
                      <option value="LOW">Low (Minor Cosmetic / Scuff)</option>
                      <option value="MEDIUM">Medium (Degraded Performance)</option>
                      <option value="HIGH">High (Major Fault / Safety)</option>
                      <option value="CRITICAL">Critical (Fully Inoperable)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 3: DESCRIPTION */}
              <div className="form-section-card">
                <div className="form-section-title">
                  <i className="bi bi-file-earmark-text text-primary"></i> 3. Detailed Fault Description
                </div>
                <label className="form-label">
                  Observed Malfunction & Damage Details <span className="required-star">*</span>
                </label>
                <textarea
                  className="form-control"
                  rows="3"
                  name="description"
                  placeholder="Detail the failure condition, impact drop specifics, optical test results, or crew handover report..."
                  value={formData.description}
                  onChange={handleChange}
                  required
                ></textarea>
              </div>

              {/* SECTION 4: REPAIR LOGISTICS */}
              <div className="form-section-card mb-0">
                <div className="form-section-title">
                  <i className="bi bi-wrench text-primary"></i> 4. Repair Vendor & Estimates
                </div>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Assigned Service Center / Vendor</label>
                    <input
                      type="text"
                      className="form-control"
                      name="vendor"
                      placeholder="e.g. Sony Factory Pro Support / In-House Lab"
                      value={formData.vendor}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Estimated Repair Cost ($ USD)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      name="cost"
                      placeholder="0.00"
                      value={formData.cost}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label">RMA / Courier Tracking & Notes</label>
                    <input
                      type="text"
                      className="form-control"
                      name="notes"
                      placeholder="e.g. RMA #98214, shipped via FedEx Overnight with insurance"
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
              <button type="submit" className="btn btn-warning text-dark fw-semibold" disabled={submitting}>
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1"></span> Processing...
                  </>
                ) : (
                  <>
                    <i className="bi bi-tools me-1"></i> Register Service Ticket
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
