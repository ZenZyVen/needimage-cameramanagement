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
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)' }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content border-0 shadow">
          <div className="modal-header bg-slate-900 text-white" style={{ backgroundColor: '#1e293b' }}>
            <h6 className="modal-title fw-bold text-white mb-0">
              <i className="bi bi-calendar2-plus me-2 text-primary"></i>
              New Equipment Borrowing Request
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

              {/* Project & Dates */}
              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label small fw-semibold text-secondary">
                    Associated Production Project
                  </label>
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
                  <label className="form-label small fw-semibold text-secondary">
                    Required From <span className="text-danger">*</span>
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
                  <label className="form-label small fw-semibold text-secondary">
                    Return By <span className="text-danger">*</span>
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

              {/* Purpose & Destination */}
              <div className="row g-3 mb-3">
                <div className="col-md-7">
                  <label className="form-label small fw-semibold text-secondary">
                    Purpose of Loan / Shoot Details <span className="text-danger">*</span>
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
                  <label className="form-label small fw-semibold text-secondary">
                    Shooting Destination / Location
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    name="destination"
                    placeholder="e.g. Vancouver Soundstage 4"
                    value={formData.destination}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Equipment Picker */}
              <div className="border rounded p-3 mb-3 bg-light">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="fw-semibold small text-dark">
                    Select Equipment Items ({selectedGearIds.length} chosen)
                  </span>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    style={{ maxWidth: '220px' }}
                    placeholder="Search available gear..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div
                  className="bg-white border rounded p-2"
                  style={{ maxHeight: '200px', overflowY: 'auto' }}
                >
                  {filteredGear.length === 0 ? (
                    <div className="text-center py-3 text-muted small">
                      No matching available equipment found.
                    </div>
                  ) : (
                    filteredGear.map(gear => {
                      const isSelected = selectedGearIds.includes(gear.id);
                      return (
                        <div
                          key={gear.id}
                          className={`d-flex align-items-center justify-content-between p-2 border-bottom ${
                            isSelected ? 'bg-primary-subtle' : ''
                          }`}
                          style={{ cursor: 'pointer' }}
                          onClick={() => toggleSelectGear(gear.id)}
                        >
                          <div className="d-flex align-items-center gap-2">
                            <input
                              type="checkbox"
                              className="form-check-input mt-0"
                              checked={isSelected}
                              onChange={() => {}}
                            />
                            <span className="badge bg-dark" style={{ fontSize: '0.68rem' }}>
                              {gear.assetTag}
                            </span>
                            <span className="small fw-semibold text-dark">{gear.name}</span>
                            <span className="small text-muted">({gear.brand})</span>
                          </div>
                          <span className="small text-muted">{gear.location || 'Vault'}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="form-label small fw-semibold text-secondary">
                  Special Notes / Vault Instructions
                </label>
                <textarea
                  className="form-control"
                  rows="2"
                  name="notes"
                  placeholder="Need extra batteries charged, specific flight cases..."
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
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RequestFormModal;
