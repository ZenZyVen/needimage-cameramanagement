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
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow">
          <div className="modal-header bg-slate-900 text-white" style={{ backgroundColor: '#1e293b' }}>
            <h6 className="modal-title fw-bold text-white mb-0">
              <i className={`bi ${isEdit ? 'bi-pencil' : 'bi-folder-plus'} me-2 text-primary`}></i>
              {isEdit ? 'Edit Production Project' : 'Create Production Project'}
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

              <div className="mb-3">
                <label className="form-label small fw-semibold text-secondary">
                  Project Title <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  name="title"
                  placeholder="e.g. EcoDrive Brand Commercial"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="row g-3 mb-3">
                <div className="col-6">
                  <label className="form-label small fw-semibold text-secondary">Project Code</label>
                  <input
                    type="text"
                    className="form-control"
                    name="projectCode"
                    placeholder="Auto-generated if empty"
                    value={formData.projectCode}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-6">
                  <label className="form-label small fw-semibold text-secondary">Status</label>
                  <select
                    className="form-select"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    <option value="PLANNING">Planning</option>
                    <option value="IN_PRODUCTION">In Production</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="row g-3 mb-3">
                <div className="col-6">
                  <label className="form-label small fw-semibold text-secondary">Client / Production Studio</label>
                  <input
                    type="text"
                    className="form-control"
                    name="client"
                    placeholder="e.g. Apex Automotive"
                    value={formData.client}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-6">
                  <label className="form-label small fw-semibold text-secondary">Director / Production Lead</label>
                  <input
                    type="text"
                    className="form-control"
                    name="director"
                    placeholder="e.g. Alex Rivera"
                    value={formData.director}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="row g-3 mb-3">
                <div className="col-6">
                  <label className="form-label small fw-semibold text-secondary">
                    Start Date <span className="text-danger">*</span>
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
                <div className="col-6">
                  <label className="form-label small fw-semibold text-secondary">
                    End Date <span className="text-danger">*</span>
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

              <div className="mb-3">
                <label className="form-label small fw-semibold text-secondary">Shooting Location</label>
                <input
                  type="text"
                  className="form-control"
                  name="location"
                  placeholder="e.g. Stage 3 & Pacific Coast Highway"
                  value={formData.location}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="form-label small fw-semibold text-secondary">Production Notes</label>
                <textarea
                  className="form-control"
                  rows="2"
                  name="notes"
                  placeholder="Gear requirements, special permits..."
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
                {submitting ? 'Saving...' : isEdit ? 'Update Project' : 'Create Project'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProjectFormModal;
