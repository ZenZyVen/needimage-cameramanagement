import React, { useState, useEffect } from 'react';

const ProjectFormModal = ({ show, onHide, onSubmit, project = null }) => {
  const isEdit = Boolean(project);

  const [formData, setFormData] = useState({
    title: '',
    projectCode: '',
    client: '',
    director: '',
    location: '',
    startDate: '',
    endDate: '',
    status: 'PLANNING',
    notes: ''
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (project) {
      setFormData({
        title: project.title || '',
        projectCode: project.projectCode || '',
        client: project.client || '',
        director: project.director || '',
        location: project.location || '',
        startDate: project.startDate ? project.startDate.substring(0, 10) : '',
        endDate: project.endDate ? project.endDate.substring(0, 10) : '',
        status: project.status || 'PLANNING',
        notes: project.notes || ''
      });
    } else {
      const today = new Date().toISOString().substring(0, 10);
      const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().substring(0, 10);
      setFormData({
        title: '',
        projectCode: '',
        client: '',
        director: '',
        location: '',
        startDate: today,
        endDate: nextWeek,
        status: 'PLANNING',
        notes: ''
      });
    }
    setErrorMsg('');
  }, [project, show]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.startDate || !formData.endDate) {
      setErrorMsg('Title, Start Date, and End Date are required.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');
      await onSubmit(formData);
      onHide();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error saving project.');
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
                <i className={`bi ${isEdit ? 'bi-pencil-square' : 'bi-folder-plus'}`}></i>
              </div>
              <div>
                <h6 className="modal-title fw-bold text-white mb-0">
                  {isEdit ? 'Edit Production Project' : 'Register New Production Project'}
                </h6>
                <p className="text-secondary small mb-0" style={{ fontSize: '0.72rem' }}>
                  Manage film shoots, documentaries, commercials, and assigned camera kits
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

              {/* SECTION 1: IDENTITY */}
              <div className="form-section-card">
                <div className="form-section-title">
                  <i className="bi bi-tag text-primary"></i> 1. Project Identification
                </div>
                <div className="row g-3">
                  <div className="col-md-7">
                    <label className="form-label">
                      Project Title <span className="required-star">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="title"
                      placeholder="Project Title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-md-5">
                    <label className="form-label">Status</label>
                    <select
                      className="form-select"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                    >
                      <option value="PLANNING">Planning (Pre-Production)</option>
                      <option value="IN_PRODUCTION">In Production (Active Shooting)</option>
                      <option value="COMPLETED">Completed (Wrap)</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Project Code (Reference)</label>
                    <input
                      type="text"
                      className="form-control"
                      name="projectCode"
                      placeholder="Project Code"
                      value={formData.projectCode}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Client / Production Studio</label>
                    <input
                      type="text"
                      className="form-control"
                      name="client"
                      placeholder="Client or Production Company"
                      value={formData.client}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: PRODUCTION TEAM & LOCATION */}
              <div className="form-section-card">
                <div className="form-section-title">
                  <i className="bi bi-people text-primary"></i> 2. Key Personnel & Location
                </div>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Director / Lead DP</label>
                    <input
                      type="text"
                      className="form-control"
                      name="director"
                      placeholder="Director or Lead DP"
                      value={formData.director}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Primary Shooting Location</label>
                    <input
                      type="text"
                      className="form-control"
                      name="location"
                      placeholder="Shooting Location"
                      value={formData.location}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: DATES */}
              <div className="form-section-card">
                <div className="form-section-title">
                  <i className="bi bi-calendar-range text-primary"></i> 3. Production Timeline
                </div>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">
                      Start Date (First Shoot) <span className="required-star">*</span>
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
                  <div className="col-md-6">
                    <label className="form-label">
                      Wrap Date (Estimated Wrap) <span className="required-star">*</span>
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

              {/* SECTION 4: NOTES */}
              <div className="form-section-card mb-0">
                <div className="form-section-title">
                  <i className="bi bi-card-text text-primary"></i> 4. Production Notes & Camera Kit Requirements
                </div>
                <textarea
                  className="form-control"
                  rows="3"
                  name="notes"
                  placeholder="Production notes and gear requirements"
                  value={formData.notes}
                  onChange={handleChange}
                ></textarea>
              </div>
            </div>

            <div className="modal-footer bg-light py-3 d-flex justify-content-end gap-2">
              <button type="button" className="btn btn-outline-secondary" onClick={onHide} disabled={submitting}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1"></span> Saving...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check2-circle me-1"></i> {isEdit ? 'Update Project' : 'Register Project'}
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

export default ProjectFormModal;
