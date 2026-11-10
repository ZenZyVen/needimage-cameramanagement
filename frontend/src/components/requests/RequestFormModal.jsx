import React, { useState, useEffect } from 'react';
import { getEquipment } from '../../services/equipmentService';
import { getProjects } from '../../services/projectService';
import StatusBadge from '../common/StatusBadge';

const RequestFormModal = ({ show, onHide, onSubmit, initialEquipment = null }) => {
  const [projects, setProjects] = useState([]);
  const [availableGear, setAvailableGear] = useState([]);
  const [selectedGearIds, setSelectedGearIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingGear, setLoadingGear] = useState(false);

  const [formData, setFormData] = useState({
    projectId: '',
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
      // Set default dates: tomorrow to +4 days
      const tomorrow = new Date(Date.now() + 86400000).toISOString().substring(0, 10);
      const fourDays = new Date(Date.now() + 5 * 86400000).toISOString().substring(0, 10);

      setFormData({
        projectId: '',
        startDate: tomorrow,
        endDate: fourDays,
        purpose: '',
        destination: '',
        notes: ''
      });

      if (initialEquipment && initialEquipment.id) {
        setSelectedGearIds([initialEquipment.id]);
      } else {
        setSelectedGearIds([]);
      }

      setErrorMsg('');

      // Fetch projects & available gear
      Promise.all([
        getProjects({ status: 'IN_PRODUCTION' }),
        getProjects({ status: 'PLANNING' }),
        getEquipment({ status: 'AVAILABLE', limit: 100 })
      ])
        .then(([inProdRes, planRes, gearRes]) => {
          const combinedProjects = [
            ...(inProdRes.data?.data || []),
            ...(planRes.data?.data || [])
          ];
          setProjects(combinedProjects);
          if (gearRes.data?.data) {
            setAvailableGear(gearRes.data.data);
          }
        })
        .catch(err => console.warn('Error loading form options:', err));
    }
  }, [show, initialEquipment]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleSelectGear = (gearId) => {
    setSelectedGearIds(prev =>
      prev.includes(gearId) ? prev.filter(id => id !== gearId) : [...prev, gearId]
    );
  };

  const filteredGear = availableGear.filter(g => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      g.name.toLowerCase().includes(q) ||
      g.assetTag.toLowerCase().includes(q) ||
      g.brand.toLowerCase().includes(q)
    );
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.startDate || !formData.endDate || !formData.purpose) {
      setErrorMsg('Start date, end date, and shoot purpose are required.');
      return;
    }

    if (selectedGearIds.length === 0) {
      setErrorMsg('Please select at least one piece of equipment for this request.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');
      const payload = {
        ...formData,
        equipmentIds: selectedGearIds
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
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content border-0 shadow-lg">
          <div className="modal-header bg-slate-900 text-white" style={{ backgroundColor: '#0f172a' }}>
            <div className="d-flex align-items-center gap-2">
              <div className="p-2 rounded bg-primary-subtle text-primary d-flex align-items-center justify-content-center" style={{ width: 34, height: 34 }}>
                <i className="bi bi-calendar2-plus"></i>
              </div>
              <div>
                <h6 className="modal-title fw-bold text-white mb-0">Equipment Borrowing Requisition</h6>
                <p className="text-secondary small mb-0" style={{ fontSize: '0.72rem' }}>Request camera, lighting, and sound gear from the vault</p>
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

              {/* SECTION 1: PROJECT & DATES */}
              <div className="form-section-card">
                <div className="form-section-title">
                  <i className="bi bi-calendar-event text-primary"></i> 1. Production Project & Schedule
                </div>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Associated Production Project</label>
                    <select
                      className="form-select"
                      name="projectId"
                      value={formData.projectId}
                      onChange={handleChange}
                    >
                      <option value="">None / Standalone Production</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.projectCode} - {p.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">
                      Required From <span className="required-star">*</span>
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">
                      Return By <span className="required-star">*</span>
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: PURPOSE & LOCATION */}
              <div className="form-section-card">
                <div className="form-section-title">
                  <i className="bi bi-geo-alt text-primary"></i> 2. Shoot Purpose & Destination
                </div>
                <div className="row g-3">
                  <div className="col-md-7">
                    <label className="form-label">
                      Purpose of Loan / Scene Details <span className="required-star">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="purpose"
                      placeholder="e.g. Commercial location exterior shots, scene 4-9"
                      value={formData.purpose}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-md-5">
                    <label className="form-label">Shooting Destination / Location</label>
                    <input
                      type="text"
                      className="form-control"
                      name="destination"
                      placeholder="e.g. Vancouver Soundstage 4 / Outdoor Set"
                      value={formData.destination}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: EQUIPMENT SELECTION */}
              <div className="form-section-card">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div className="form-section-title mb-0">
                    <i className="bi bi-camera-reels text-primary"></i> 3. Select Gear Items ({selectedGearIds.length} Selected)
                  </div>
                  <div className="input-group input-group-sm" style={{ maxWidth: '240px' }}>
                    <span className="input-group-text bg-white border-end-0">
                      <i className="bi bi-search text-muted"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0"
                      placeholder="Search vault gear..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                {/* Selected gear chips tray */}
                {selectedGearIds.length > 0 && (
                  <div className="p-2 mb-2 bg-white border rounded d-flex flex-wrap gap-1 align-items-center">
                    <span className="small text-muted fw-semibold me-1" style={{ fontSize: '0.72rem' }}>Chosen:</span>
                    {selectedGearIds.map(id => {
                      const item = availableGear.find(g => g.id === id);
                      if (!item) return null;
                      return (
                        <span key={id} className="badge bg-primary-subtle text-primary border border-primary-subtle d-inline-flex align-items-center gap-1 py-1 px-2">
                          <strong>{item.assetTag}</strong> {item.name}
                          <button
                            type="button"
                            className="btn-close btn-close-dark ms-1"
                            style={{ width: '8px', height: '8px' }}
                            onClick={() => toggleSelectGear(id)}
                          ></button>
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Scrollable Gear Checklist */}
                <div
                  className="bg-white border rounded p-2"
                  style={{ maxHeight: '210px', overflowY: 'auto' }}
                >
                  {filteredGear.length === 0 ? (
                    <div className="text-center py-4 text-muted small">
                      <i className="bi bi-inbox fs-3 d-block text-secondary mb-1"></i>
                      No matching available equipment found in the vault.
                    </div>
                  ) : (
                    filteredGear.map(gear => {
                      const isSelected = selectedGearIds.includes(gear.id);
                      return (
                        <div
                          key={gear.id}
                          className={`d-flex align-items-center justify-content-between p-2 mb-1 rounded border ${
                            isSelected ? 'bg-primary-subtle border-primary' : 'bg-light border-light-subtle'
                          }`}
                          style={{ cursor: 'pointer', transition: 'background-color 0.15s ease' }}
                          onClick={() => toggleSelectGear(gear.id)}
                        >
                          <div className="d-flex align-items-center gap-2">
                            <input
                              type="checkbox"
                              className="form-check-input mt-0"
                              checked={isSelected}
                              onChange={() => {}}
                            />
                            <span className="badge bg-dark px-2 py-1" style={{ fontSize: '0.72rem', letterSpacing: '0.04em' }}>
                              {gear.assetTag}
                            </span>
                            <span className="small fw-semibold text-dark">{gear.name}</span>
                            <span className="small text-muted">({gear.brand})</span>
                          </div>
                          <div className="d-flex align-items-center gap-2">
                            <span className="badge bg-secondary-subtle text-secondary" style={{ fontSize: '0.7rem' }}>
                              <i className="bi bi-geo-alt me-1"></i>{gear.location || 'Vault Shelf'}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* SECTION 4: VAULT NOTES */}
              <div className="form-section-card mb-0">
                <div className="form-section-title">
                  <i className="bi bi-chat-left-text text-primary"></i> 4. Special Handling & Vault Notes
                </div>
                <textarea
                  className="form-control"
                  rows="2"
                  name="notes"
                  placeholder="e.g. Ensure all V-mount batteries are charged at 100%, include Pelican 1510 flight cases..."
                  value={formData.notes}
                  onChange={handleChange}
                ></textarea>
              </div>
            </div>

            <div className="modal-footer bg-light py-3 d-flex justify-content-between align-items-center">
              <span className="small text-muted" style={{ fontSize: '0.78rem' }}>
                <i className="bi bi-info-circle me-1"></i> Requisition will be routed to the vault team for approval.
              </span>
              <div className="d-flex gap-2">
                <button type="button" className="btn btn-outline-secondary" onClick={onHide} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1"></span> Submitting...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-send-check me-1"></i> Submit Request
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RequestFormModal;
