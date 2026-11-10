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
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow">
          <div className="modal-header bg-slate-900 text-white" style={{ backgroundColor: '#1e293b' }}>
            <h6 className="modal-title fw-bold text-white mb-0">
              <i className="bi bi-tools me-2 text-warning"></i>
              Report Damage & Create Maintenance Ticket
            </h6>
            <button type="button" className="btn-close btn-close-white" onClick={onHide}></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4">
              {errorMsg && (
                <div className="alert alert-danger py-2 small mb-3">
                  <i className="bi bi-exclamation-circle me-1"></i> {errorMsg}
                </div>
              )}

              {/* Equipment select */}
              <div className="mb-3">
                <label className="form-label small fw-semibold text-secondary">
                  Equipment Item <span className="text-danger">*</span>
                </label>
                {equipmentItem ? (
                  <div className="p-2 border rounded bg-light fw-bold text-dark small">
                    {equipmentItem.assetTag} - {equipmentItem.name} ({equipmentItem.serialNumber})
                  </div>
                ) : (
                  <select
                    className="form-select"
                    name="equipmentId"
                    value={formData.equipmentId}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Equipment</option>
                    {equipmentList.map(eq => (
                      <option key={eq.id} value={eq.id}>
                        {eq.assetTag} - {eq.name} ({eq.serialNumber})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Title & Severity */}
              <div className="row g-3 mb-3">
                <div className="col-8">
                  <label className="form-label small fw-semibold text-secondary">
                    Issue Title <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    name="issueTitle"
                    placeholder="e.g. Scratched Front Element / Loose Port"
                    value={formData.issueTitle}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-4">
                  <label className="form-label small fw-semibold text-secondary">Severity</label>
                  <select
                    className="form-select"
                    name="severity"
                    value={formData.severity}
                    onChange={handleChange}
                  >
                    <option value="LOW">Low (Cosmetic)</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High (Degraded)</option>
                    <option value="CRITICAL">Critical (Inoperable)</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="mb-3">
                <label className="form-label small fw-semibold text-secondary">
                  Issue Description & Observed Defect <span className="text-danger">*</span>
                </label>
                <textarea
                  className="form-control"
                  rows="3"
                  name="description"
                  placeholder="Detail the malfunction, drop damage, or optical defects..."
                  value={formData.description}
                  onChange={handleChange}
                  required
                ></textarea>
              </div>

              {/* Vendor & Cost */}
              <div className="row g-3 mb-3">
                <div className="col-6">
                  <label className="form-label small fw-semibold text-secondary">Service Center / Vendor</label>
                  <input
                    type="text"
                    className="form-control"
                    name="vendor"
                    placeholder="e.g. Sony Authorized Service"
                    value={formData.vendor}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-6">
                  <label className="form-label small fw-semibold text-secondary">Estimated Repair Cost ($)</label>
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
              </div>

              <div>
                <label className="form-label small fw-semibold text-secondary">Service Notes</label>
                <input
                  type="text"
                  className="form-control"
                  name="notes"
                  placeholder="RMA number, courier tracking, warranty status..."
                  value={formData.notes}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="modal-footer bg-light py-2">
              <button type="button" className="btn btn-sm btn-secondary" onClick={onHide} disabled={submitting}>
                Cancel
              </button>
              <button type="submit" className="btn btn-sm btn-warning text-dark fw-semibold" disabled={submitting}>
                {submitting ? 'Creating Ticket...' : 'Submit Maintenance Ticket'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceFormModal;
