import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getProjectCrew, addProjectCrewMember, removeProjectCrewMember, getCrewCandidates } from '../../services/projectService';
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
  'Editor / Colorist',
  'Producer / Production Manager',
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

const ProjectCrewModal = ({ show, onHide, project, onCrewUpdated }) => {
  const { isAdmin } = useAuth();
  const [crewList, setCrewList] = useState([]);
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Selection mode: user ID from registered accounts or 'OTHER'
  const [crewSource, setCrewSource] = useState('');
  const [customCrewName, setCustomCrewName] = useState('');
  const [roleChoice, setRoleChoice] = useState(CREW_ROLES[0]);
  const [customRoleName, setCustomRoleName] = useState('');

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

  const suggestRoleForUser = (u) => {
    if (!u) return CREW_ROLES[0];
    const hint = `${u.roleNote || ''} ${u.department || ''}`.toLowerCase();
    if (hint.includes('photography') || hint.includes('dp') || hint.includes('cinematography')) return 'Director of Photography (DP)';
    if (hint.includes('documentary') || hint.includes('operator')) return 'Camera Operator (A-Cam)';
    if (hint.includes('lighting') || hint.includes('gaffer')) return 'Gaffer (Chief Lighting)';
    if (hint.includes('sound') || hint.includes('audio')) return 'Sound Recordist / Mixer';
    if (hint.includes('vault') || hint.includes('logistics') || hint.includes('stock')) return 'Digital Imaging Tech (DIT)';
    if (hint.includes('producer') || hint.includes('operations') || u.role === 'ADMIN') return 'Producer / Production Manager';
    return CREW_ROLES[0];
  };

  useEffect(() => {
    if (show && project?.id) {
      loadCrew();
      getCrewCandidates()
        .then(res => {
          if (res.data?.success && Array.isArray(res.data.data)) {
            const users = res.data.data;
            setRegisteredUsers(users);
            if (users.length > 0) {
              const first = users[0];
              const suggested = suggestRoleForUser(first);
              setCrewSource(first.id);
              setRoleChoice(suggested);
              setFormData(prev => ({
                ...prev,
                name: first.name,
                phone: first.phone || '',
                role: suggested
              }));
            } else {
              setCrewSource('OTHER');
            }
          }
        })
        .catch(() => {
          setCrewSource('OTHER');
        });

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
      setCustomCrewName('');
      setCustomRoleName('');
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

  const handleCrewSourceChange = (e) => {
    const val = e.target.value;
    setCrewSource(val);
    if (val === 'OTHER') {
      setCustomCrewName('');
      setFormData(prev => ({ ...prev, name: '', phone: '' }));
    } else {
      const found = registeredUsers.find(u => u.id === val);
      if (found) {
        const suggested = suggestRoleForUser(found);
        setRoleChoice(suggested);
        setFormData(prev => ({
          ...prev,
          name: found.name,
          phone: found.phone || '',
          role: suggested
        }));
      }
    }
  };

  const handleRoleChoiceChange = (e) => {
    const val = e.target.value;
    setRoleChoice(val);
    if (val !== 'OTHER') {
      setFormData(prev => ({ ...prev, role: val }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegisterCrew = async (e) => {
    e.preventDefault();
    const resolvedName = crewSource === 'OTHER' ? customCrewName.trim() : formData.name.trim();
    const resolvedRole = roleChoice === 'OTHER' ? customRoleName.trim() : roleChoice;

    if (!resolvedName || !resolvedRole) {
      setErrorMsg('Crew member name and role are required.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');
      setSuccessMsg('');
      await addProjectCrewMember(project.id, {
        ...formData,
        name: resolvedName,
        role: resolvedRole
      });
      setSuccessMsg(`Crew member "${resolvedName}" (${resolvedRole}) added to project.`);
      if (crewSource === 'OTHER') {
        setCustomCrewName('');
      }
      if (roleChoice === 'OTHER') {
        setCustomRoleName('');
      }
      setFormData(prev => ({
        ...prev,
        notes: ''
      }));
      await loadCrew();
      if (onCrewUpdated) onCrewUpdated();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error registering crew member.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickAddAccountUser = async (userObj) => {
    try {
      setSubmitting(true);
      setErrorMsg('');
      setSuccessMsg('');
      const role = suggestRoleForUser(userObj);
      await addProjectCrewMember(project.id, {
        name: userObj.name,
        role,
        shootDate: formData.shootDate || (project.startDate ? project.startDate.substring(0, 10) : new Date().toISOString().substring(0, 10)),
        projectType: formData.projectType || 'Commercial Shoot',
        phone: userObj.phone || '',
        callTime: formData.callTime || '07:00 AM',
        status: 'CONFIRMED',
        notes: userObj.department ? `Dept: ${userObj.department}` : ''
      });
      setSuccessMsg(`Assigned ${userObj.name} as ${role}.`);
      await loadCrew();
      if (onCrewUpdated) onCrewUpdated();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error assigning user to crew.');
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
      await loadCrew();
      if (onCrewUpdated) onCrewUpdated();
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
              <div>
                <h6 className="modal-title fw-bold text-white mb-0">
                  Project Crew Roster: {project.title}
                </h6>
                <small className="text-slate-400" style={{ fontSize: '0.72rem' }}>
                  {project.projectCode} • Assign from registered user accounts or custom crew
                </small>
              </div>
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

          <div className="modal-body p-4" style={{ maxHeight: '76vh', overflowY: 'auto' }}>
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

            {/* Register Crew Member Form - Admin Only */}
            {isAdmin ? (
              <div className="form-section-card">
                <div className="form-section-title d-flex justify-content-between align-items-center">
                  <span>
                    <i className="bi bi-person-plus-fill text-primary me-1"></i> Assign Crew Member & Role
                  </span>
                  <span className="badge bg-light text-secondary border fw-normal" style={{ fontSize: '0.68rem' }}>
                    Select Registered User or Other
                  </span>
                </div>

                {/* Quick 1-Click Assign from Registered Accounts */}
                {registeredUsers.length > 0 && (
                  <div className="mb-3 pb-3 border-bottom">
                    <div className="text-muted small mb-1.5" style={{ fontSize: '0.74rem' }}>
                      Quick Assign from Registered System Accounts:
                    </div>
                    <div className="d-flex flex-wrap gap-1.5">
                      {registeredUsers.map(u => {
                        const isAlreadyInRoster = crewList.some(c => c.name?.toLowerCase() === u.name?.toLowerCase());
                        return (
                          <button
                            key={u.id}
                            type="button"
                            className={`btn btn-xs ${isAlreadyInRoster ? 'btn-success text-white' : 'btn-outline-primary bg-white'} d-inline-flex align-items-center gap-1 px-2 py-1`}
                            disabled={isAlreadyInRoster || submitting}
                            onClick={() => handleQuickAddAccountUser(u)}
                          >
                            <i className={`bi ${isAlreadyInRoster ? 'bi-check-circle-fill' : 'bi-person-plus-fill'}`}></i>
                            <span className="fw-semibold">{u.name}</span>
                            <span className="opacity-75">({u.department || u.role})</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <form onSubmit={handleRegisterCrew}>
                  <div className="row g-3">
                    {/* Select Registered User or Other */}
                    <div className={crewSource === 'OTHER' ? 'col-md-3' : 'col-md-4'}>
                      <label className="form-label">
                        <span>Select Crew Member</span>
                      </label>
                      <select
                        className="form-select form-select-sm"
                        value={crewSource}
                        onChange={handleCrewSourceChange}
                      >
                        <optgroup label="Registered User Accounts">
                          {registeredUsers.map(u => (
                            <option key={u.id} value={u.id}>
                              {u.name} ({u.department || u.role})
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="Custom / External Crew">
                          <option value="OTHER">Other (Enter Custom Crew Name)...</option>
                        </optgroup>
                      </select>
                    </div>

                    {/* Custom Crew Name Input (when Other is selected) */}
                    {crewSource === 'OTHER' && (
                      <div className="col-md-3">
                        <label className="form-label">
                          <span>Custom Crew Name</span>
                        </label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Enter crew full name"
                          value={customCrewName}
                          onChange={(e) => setCustomCrewName(e.target.value)}
                          required
                        />
                      </div>
                    )}

                    {/* Select Role or Other */}
                    <div className={roleChoice === 'OTHER' ? 'col-md-3' : 'col-md-4'}>
                      <label className="form-label">
                        <span>Role / Position</span>
                      </label>
                      <select
                        className="form-select form-select-sm"
                        value={roleChoice}
                        onChange={handleRoleChoiceChange}
                      >
                        {CREW_ROLES.map((r, idx) => (
                          <option key={idx} value={r}>{r}</option>
                        ))}
                        <option value="OTHER">Other (Enter Custom Role)...</option>
                      </select>
                    </div>

                    {/* Custom Role Input (when Other is selected) */}
                    {roleChoice === 'OTHER' && (
                      <div className="col-md-3">
                        <label className="form-label">
                          <span>Custom Role</span>
                        </label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Enter custom role"
                          value={customRoleName}
                          onChange={(e) => setCustomRoleName(e.target.value)}
                          required
                        />
                      </div>
                    )}

                    <div className="col-md-2">
                      <label className="form-label">
                        <span>Shoot Date</span>
                      </label>
                      <input
                        type="date"
                        className="form-control form-control-sm"
                        name="shootDate"
                        value={formData.shootDate}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="col-md-2">
                      <label className="form-label">Call Time</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        name="callTime"
                        placeholder="07:00 AM"
                        value={formData.callTime}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-md-3">
                      <label className="form-label">Phone / Contact</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        name="phone"
                        placeholder="Phone number"
                        value={formData.phone}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-md-3">
                      <label className="form-label">Unit / Shoot Type</label>
                      <select
                        className="form-select form-select-sm"
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
                      <label className="form-label">Status</label>
                      <select
                        className="form-select form-select-sm"
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                      >
                        <option value="CONFIRMED">Confirmed</option>
                        <option value="ON_LOCATION">On Location</option>
                        <option value="WRAPPED">Wrapped</option>
                      </select>
                    </div>

                    <div className="col-md-2">
                      <label className="form-label">Notes</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        name="notes"
                        placeholder="Optional notes"
                        value={formData.notes}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-md-2 d-flex align-items-end">
                      <button
                        type="submit"
                        className="btn btn-sm btn-primary w-100"
                        disabled={submitting}
                      >
                        {submitting ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-1"></span> Adding...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-person-check me-1"></i> Assign Crew
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
                <span>Assigned production crew roster for this project.</span>
              </div>
            )}

            {/* Assigned Crew Manifest Table */}
            <div className="form-section-card mb-0">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div className="form-section-title mb-0">
                  <i className="bi bi-card-checklist text-primary"></i> Assigned Production Crew ({crewList.length})
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
                  No crew members assigned to this project yet.
                </div>
              ) : (
                <div className="table-responsive border rounded bg-white">
                  <table className="table table-custom mb-0">
                    <thead>
                      <tr>
                        <th>Crew Member</th>
                        <th>Role / Position</th>
                        <th>Shoot Date</th>
                        <th>Call Time</th>
                        <th>Unit</th>
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
            <button type="button" className="btn btn-outline-secondary btn-sm px-3" onClick={onHide}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectCrewModal;
