import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getProjectCrew, addProjectCrewMember, removeProjectCrewMember } from '../../services/projectService';
import { formatDate } from '../../utils/formatters';

const CREW_ROLES = [
  'Director of Photography (DP)',
  'Camera Operator (A-Cam)',
  'Camera Operator (B-Cam)',
  '1st AC / Focus Puller',
  '2nd AC / Clapper Loader',
  'Gaffer (Chief Lighting)',
  'Best Boy Electric',
  'Key Grip',
  'Sound Recordist / Mixer',
  'Boom Operator',
  'Drone Pilot / Aerial Op',
  'Digital Imaging Tech (DIT)',
  'Steadicam Operator',
  'Production Assistant (PA)',
  'Director / Producer'
];

const PROJECT_TYPES = [
  'Commercial Shoot',
  'Feature Film',
  'Documentary Field Shoot',
  'Music Video',
  'Corporate & Brand Video',
  'Second Unit / B-Roll',
  'Live Event / Broadcast',
  'Studio Soundstage Shoot'
];

const ProjectCrewModal = ({ show, onHide, project }) => {
  const { isAdmin } = useAuth();
  const [crewList, setCrewList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    role: 'Director of Photography (DP)',
    shootDate: '',
    projectType: 'Commercial Shoot',
    phone: '',
    callTime: '07:00 AM',
    notes: '',
    status: 'CONFIRMED'
  });

  useEffect(() => {
    if (show && project?.id) {
      loadCrew();
      setFormData({
        name: '',
        role: 'Director of Photography (DP)',
        shootDate: project.startDate ? project.startDate.substring(0, 10) : new Date().toISOString().substring(0, 10),
        projectType: 'Commercial Shoot',
        phone: '',
        callTime: '07:00 AM',
        notes: '',
        status: 'CONFIRMED'
      });
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [show, project]);

  const loadCrew = async () => {
    try {
      setLoading(true);
      const res = await getProjectCrew(project.id);
      if (res.data?.success) {
        setCrewList(res.data.data || []);
      }
    } catch (err) {
      console.warn('Error loading project crew:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegisterCrew = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.role) {
      setErrorMsg('Crew member name and role are required.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');
      setSuccessMsg('');
      await addProjectCrewMember(project.id, formData);
      setSuccessMsg(`Crew member "${formData.name}" registered for shoot.`);
      setFormData(prev => ({
        ...prev,
        name: '',
        phone: '',
        notes: ''
      }));
      loadCrew();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error registering crew member.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveCrew = async (crewId, crewName) => {
    if (!window.confirm(`Remove "${crewName}" from this project shoot?`)) return;

    try {
      setErrorMsg('');
      setSuccessMsg('');
      await removeProjectCrewMember(project.id, crewId);
      setSuccessMsg(`Crew member "${crewName}" removed.`);
      loadCrew();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error removing crew member.');
    }
  };

  const handlePrintRoster = () => {
    window.print();
  };

  if (!show || !project) return null;

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)' }}>
      <div className="modal-dialog modal-dialog-centered modal-xl">
        <div className="modal-content border-0 shadow-lg">
          <div className="modal-header bg-slate-900 text-white" style={{ backgroundColor: '#0f172a' }}>
            <div className="d-flex align-items-center gap-2">
              <div className="p-2 rounded bg-primary-subtle text-primary d-flex align-items-center justify-content-center" style={{ width: 32, height: 32 }}>
                <i className="bi bi-people-fill" style={{ fontSize: '0.95rem' }}></i>
              </div>
              <h6 className="modal-title fw-bold text-white mb-0">
                Project Crew: {project.title}
              </h6>
            </div>
            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-sm btn-outline-light d-flex align-items-center gap-1 py-1 px-2"
                onClick={handlePrintRoster}
                title="Print Call Sheet Roster"
                style={{ fontSize: '0.75rem' }}
              >
                <i className="bi bi-printer"></i>
                <span className="d-none d-sm-inline">Print Roster</span>
              </button>
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
          </div>

          <div className="modal-body p-4" style={{ maxHeight: '74vh', overflowY: 'auto' }}>
            {errorMsg && (
              <div className="alert alert-danger py-2 px-3 small mb-3 d-flex align-items-center gap-2">
                <i className="bi bi-exclamation-triangle-fill"></i>
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="alert alert-success py-2 px-3 small mb-3 d-flex align-items-center gap-2">
                <i className="bi bi-check-circle-fill"></i>
                <span>{successMsg}</span>
              </div>
            )}

            {/* 1. Register Crew Member Form - Admin Only */}
            {isAdmin ? (
              <div className="form-section-card">
                <div className="form-section-title">
                <i className="bi bi-person-plus-fill text-primary"></i> Register Crew Member for Shoot
              </div>

              <form onSubmit={handleRegisterCrew}>
                <div className="row g-3">
                  <div className="col-md-3">
                    <label className="form-label">
                      Crew Member Name <span className="required-star">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="name"
                      placeholder="Crew Member Name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-3">
                    <label className="form-label">
                      Role / Position <span className="required-star">*</span>
                    </label>
                    <select
                      className="form-select"
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                    >
                      {CREW_ROLES.map((r, idx) => (
                        <option key={idx} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-2">
                    <label className="form-label">
                      Shoot Day <span className="required-star">*</span>
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      name="shootDate"
                      value={formData.shootDate}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-2">
                    <label className="form-label">Project Type / Unit</label>
                    <select
                      className="form-select"
                      name="projectType"
                      value={formData.projectType}
                      onChange={handleChange}
                    >
                      {PROJECT_TYPES.map((pt, idx) => (
                        <option key={idx} value={pt}>{pt}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-2">
                    <label className="form-label">Call Time</label>
                    <input
                      type="text"
                      className="form-control"
                      name="callTime"
                      placeholder="Call Time"
                      value={formData.callTime}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-3">
                    <label className="form-label">Phone / Contact</label>
                    <input
                      type="text"
                      className="form-control"
                      name="phone"
                      placeholder="Phone Number"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-3">
                    <label className="form-label">Status</label>
                    <select
                      className="form-select"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                    >
                      <option value="CONFIRMED">Confirmed</option>
                      <option value="ON_LOCATION">On Location / Active</option>
                      <option value="WRAPPED">Wrapped</option>
                    </select>
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">Call Notes / Instructions</label>
                    <input
                      type="text"
                      className="form-control"
                      name="notes"
                      placeholder="Call notes and stage info"
                      value={formData.notes}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-2 d-flex align-items-end">
                    <button
                      type="submit"
                      className="btn btn-primary w-100"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-1"></span> Adding...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-person-check me-1"></i> Register Crew
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          ) : (
            <div className="alert alert-light border py-2 px-3 small mb-3 text-muted d-flex align-items-center gap-2">
              <i className="bi bi-info-circle text-primary"></i>
              <span>Registered shoot crew manifest for this production project.</span>
            </div>
          )}

            {/* 2. Registered Crew Manifest Table */}
            <div className="form-section-card mb-0">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div className="form-section-title mb-0">
                  <i className="bi bi-card-checklist text-primary"></i> Registered Field Crew ({crewList.length})
                </div>
              </div>

              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary spinner-border-sm"></div>
                  <span className="text-muted small ms-2">Loading crew roster...</span>
                </div>
              ) : crewList.length === 0 ? (
                <div className="text-center py-4 text-muted small bg-white border rounded">
                  <i className="bi bi-person-x fs-3 d-block text-secondary mb-1"></i>
                  No crew members registered for this project shoot yet.
                </div>
              ) : (
                <div className="table-responsive border rounded bg-white">
                  <table className="table table-custom mb-0">
                    <thead>
                      <tr>
                        <th>Crew Member</th>
                        <th>Role / Department</th>
                        <th>Shoot Date</th>
                        <th>Call Time</th>
                        <th>Project Type / Unit</th>
                        <th>Phone / Contact</th>
                        <th>Status</th>
                        <th>Notes</th>
                        {isAdmin && <th className="text-end">Action</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {crewList.map((crew) => (
                        <tr key={crew.id}>
                          <td className="fw-bold text-dark">{crew.name}</td>
                          <td>
                            <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                              {crew.role}
                            </span>
                          </td>
                          <td className="small text-nowrap">
                            <i className="bi bi-calendar-day me-1 text-primary"></i>
                            {formatDate(crew.shootDate)}
                          </td>
                          <td className="small font-monospace text-secondary">{crew.callTime || '—'}</td>
                          <td className="small text-muted">{crew.projectType || 'Standard'}</td>
                          <td className="small font-monospace">{crew.phone || '—'}</td>
                          <td>
                            <span className={`badge ${
                              crew.status === 'ON_LOCATION'
                                ? 'bg-success text-white'
                                : crew.status === 'WRAPPED'
                                ? 'bg-secondary text-white'
                                : 'bg-primary-subtle text-primary'
                            }`}>
                              {crew.status}
                            </span>
                          </td>
                          <td className="small text-muted text-truncate" style={{ maxWidth: '140px' }}>
                            {crew.notes || '—'}
                          </td>
                          {isAdmin && (
                            <td className="text-end">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleRemoveCrew(crew.id, crew.name)}
                                title="Remove Crew Member"
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer bg-light py-3 d-flex justify-content-end">
            <button type="button" className="btn btn-outline-secondary" onClick={onHide}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectCrewModal;
