import React, { useState, useEffect } from 'react';
import { getNextProjectCode } from '../../services/projectService';

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

  const [projectNumber, setProjectNumber] = useState('01');
  const [loadingCode, setLoadingCode] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (show) {
      setErrorMsg('');
      if (project) {
        // Edit mode: preserve existing code and derive number if present
        const match = (project.projectCode || '').match(/(\d+)$/);
        const num = match ? match[1].padStart(2, '0') : '01';
        setProjectNumber(num);

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
        // Create mode: fetch next sequential project number & code
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

        setLoadingCode(true);
        getNextProjectCode()
          .then(res => {
            if (res.data?.success && res.data.data) {
              setProjectNumber(res.data.data.projectNumber || '01');
              setFormData(prev => ({
                ...prev,
                projectCode: res.data.data.projectCode || 'PRJ-01'
              }));
            }
          })
          .catch(err => {
            console.warn('Could not auto-generate next project code:', err);
            setProjectNumber('01');
            setFormData(prev => ({ ...prev, projectCode: 'PRJ-01' }));
          })
          .finally(() => {
            setLoadingCode(false);
          });
      }
    }
  }, [project, show]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title?.trim() || !formData.startDate || !formData.endDate) {
      setErrorMsg('Project Title, Start Date, and Wrap Date are required.');
      return;
    }

    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      setErrorMsg('Wrap Date cannot precede Start Date.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');
      await onSubmit({
        ...formData,
        title: formData.title.trim(),
        client: formData.client?.trim() || null,
        director: formData.director?.trim() || null,
        location: formData.location?.trim() || null,
        notes: formData.notes?.trim() || null
      });
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
          {/* Header */}
          <div className="modal-header bg-slate-900 text-white" style={{ backgroundColor: '#0f172a' }}>
            <div className="d-flex align-items-center gap-2">
              <div
                className="p-2 rounded bg-primary-subtle text-primary d-flex align-items-center justify-content-center"
                style={{ width: 32, height: 32 }}
              >
                <i className={`bi ${isEdit ? 'bi-pencil-square' : 'bi-folder-plus'}`} style={{ fontSize: '0.95rem' }}></i>
              </div>
              <div>
                <h6 className="modal-title fw-bold text-white mb-0">
                  {isEdit ? 'Edit Production Project' : 'New Production Project'}
                </h6>
                <small className="text-slate-400" style={{ fontSize: '0.72rem' }}>
                  {isEdit ? `Modifying project reference ${formData.projectCode}` : 'Register a new production film or commercial shoot'}
                </small>
              </div>
            </div>
            <button
              type="button"
              className="modal-close-btn"
              onClick={onHide}
              aria-label="Close"
              title="Close modal"
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

              {/* SECTION 1: AUTO IDENTIFICATION & STATUS */}
              <div className="form-section-card mb-3 p-3 border rounded bg-white shadow-xs">
                <div className="form-section-title mb-3 fw-bold text-dark small text-uppercase d-flex align-items-center justify-content-between">
                  <span>
                    <i className="bi bi-shield-lock-fill text-primary me-1"></i> 1. System Project Identification
                  </span>
                  <span className="badge bg-light text-muted border fw-normal" style={{ fontSize: '0.68rem' }}>
                    Auto-Assigned & Sequential
                  </span>
                </div>

                <div className="row g-3">
                  {/* Auto-Generated Project Number */}
                  <div className="col-md-4 col-sm-6">
                    <label className="form-label small fw-semibold text-secondary d-flex align-items-center justify-content-between">
                      <span>Project Number</span>
                      <span className="badge bg-primary-subtle text-primary border border-primary-subtle font-monospace" style={{ fontSize: '0.68rem' }}>
                        Auto-Generated
                      </span>
                    </label>
                    <div className="input-group input-group-sm">
                      <span className="input-group-text bg-light text-muted fw-bold">#</span>
                      <input
                        type="text"
                        className="form-control bg-light font-monospace fw-bold text-primary"
                        value={loadingCode ? '...' : projectNumber}
                        disabled
                        readOnly
                      />
                    </div>
                    <div className="text-muted mt-1" style={{ fontSize: '0.7rem' }}>
                      Sequential index (01, 02, 03...)
                    </div>
                  </div>

                  {/* Auto-Generated Project Code */}
                  <div className="col-md-4 col-sm-6">
                    <label className="form-label small fw-semibold text-secondary d-flex align-items-center justify-content-between">
                      <span>Project Code (Reference)</span>
                      <span className="badge bg-success-subtle text-success border border-success-subtle font-monospace" style={{ fontSize: '0.68rem' }}>
                        <i className="bi bi-lock-fill me-1"></i>Unique Code
                      </span>
                    </label>
                    <div className="input-group input-group-sm">
                      <span className="input-group-text bg-light text-muted"><i className="bi bi-tag-fill"></i></span>
                      <input
                        type="text"
                        className="form-control bg-light font-monospace fw-bold text-dark"
                        value={loadingCode ? 'Generating unique code...' : (formData.projectCode || 'PRJ-01')}
                        disabled
                        readOnly
                      />
                    </div>
                    <div className="text-muted mt-1" style={{ fontSize: '0.7rem' }}>
                      Vault tracking identifier
                    </div>
                  </div>

                  {/* Project Status */}
                  <div className="col-md-4 col-sm-12">
                    <label className="form-label small fw-semibold text-secondary">
                      Production Status <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select form-select-sm"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                    >
                      <option value="PLANNING">Planning (Pre-Production)</option>
                      <option value="IN_PRODUCTION">In Production (Active Shooting)</option>
                      <option value="COMPLETED">Completed (Wrap)</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                    <div className="text-muted mt-1" style={{ fontSize: '0.7rem' }}>
                      Current production phase
                    </div>
                  </div>

                  {/* Project Title */}
                  <div className="col-12">
                    <label className="form-label small fw-semibold text-secondary">
                      Project Title / Production Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      name="title"
                      placeholder="Project title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  {/* Client / Studio */}
                  <div className="col-12">
                    <label className="form-label small fw-semibold text-secondary">
                      Client / Production Studio / Agency
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      name="client"
                      placeholder="Client / studio name"
                      value={formData.client}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: PRODUCTION TEAM & LOCATION */}
              <div className="form-section-card mb-3 p-3 border rounded bg-white shadow-xs">
                <div className="form-section-title mb-3 fw-bold text-dark small text-uppercase">
                  <i className="bi bi-people text-primary me-1"></i> 2. Key Personnel & Location
                </div>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold text-secondary">Director / Lead DP</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      name="director"
                      placeholder="Director name"
                      value={formData.director}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold text-secondary">Primary Shooting Location</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      name="location"
                      placeholder="Shooting location"
                      value={formData.location}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: TIMELINE */}
              <div className="form-section-card mb-3 p-3 border rounded bg-white shadow-xs">
                <div className="form-section-title mb-3 fw-bold text-dark small text-uppercase">
                  <i className="bi bi-calendar-range text-primary me-1"></i> 3. Production Timeline
                </div>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold text-secondary">
                      Start Date (First Shoot) <span className="text-danger">*</span>
                    </label>
                    <input
                      type="date"
                      className="form-control form-control-sm"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold text-secondary">
                      Wrap Date (Estimated Wrap) <span className="text-danger">*</span>
                    </label>
                    <input
                      type="date"
                      className="form-control form-control-sm"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: PRODUCTION NOTES */}
              <div className="form-section-card mb-0 p-3 border rounded bg-white shadow-xs">
                <div className="form-section-title mb-2 fw-bold text-dark small text-uppercase">
                  <i className="bi bi-card-text text-primary me-1"></i> 4. Production Notes & Camera Package Requirements
                </div>
                <textarea
                  className="form-control form-control-sm"
                  rows="3"
                  name="notes"
                  placeholder="Production notes (optional)"
                  value={formData.notes}
                  onChange={handleChange}
                ></textarea>
              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer bg-light py-2 px-4 d-flex justify-content-between align-items-center">
              <div className="text-muted small" style={{ fontSize: '0.72rem' }}>
                <i className="bi bi-info-circle me-1"></i>
                Project Code: <strong className="text-dark font-monospace">{formData.projectCode || 'PRJ-01'}</strong> (auto-assigned)
              </div>
              <div className="d-flex align-items-center gap-2">
                <button type="button" className="btn btn-sm btn-outline-secondary px-3" onClick={onHide} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-sm btn-primary px-3 fw-semibold shadow-xs" disabled={submitting || loadingCode}>
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
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProjectFormModal;
