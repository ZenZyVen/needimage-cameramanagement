import React, { useState, useEffect } from 'react';
import { getNextProjectCode, getCrewCandidates } from '../../services/projectService';

const STANDARD_CREW_ROLES = [
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

  const [directorMode, setDirectorMode] = useState('USER'); // 'USER' or 'OTHER'
  const [selectedDirectorUserId, setSelectedDirectorUserId] = useState('');

  // Registered system user accounts
  const [registeredUsers, setRegisteredUsers] = useState([]);

  // Assigned crew list for this project
  const [crewMembers, setCrewMembers] = useState([]);

  // Crew builder state
  const [crewSource, setCrewSource] = useState(''); // user.id or 'OTHER'
  const [customCrewName, setCustomCrewName] = useState('');
  const [crewRoleSelect, setCrewRoleSelect] = useState(STANDARD_CREW_ROLES[0]);
  const [customCrewRole, setCustomCrewRole] = useState('');
  const [crewPhone, setCrewPhone] = useState('');
  const [crewCallTime, setCrewCallTime] = useState('07:00 AM');

  const [projectNumber, setProjectNumber] = useState('01');
  const [loadingCode, setLoadingCode] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Suggest a production role from a user's department or role note
  const suggestRoleForUser = (u) => {
    if (!u) return STANDARD_CREW_ROLES[0];
    const hint = `${u.roleNote || ''} ${u.department || ''}`.toLowerCase();
    if (hint.includes('photography') || hint.includes('dp') || hint.includes('cinematography')) return 'Director of Photography (DP)';
    if (hint.includes('documentary') || hint.includes('operator')) return 'Camera Operator (A-Cam)';
    if (hint.includes('lighting') || hint.includes('gaffer')) return 'Gaffer (Chief Lighting)';
    if (hint.includes('sound') || hint.includes('audio')) return 'Sound Recordist / Mixer';
    if (hint.includes('vault') || hint.includes('logistics') || hint.includes('stock')) return 'Digital Imaging Tech (DIT)';
    if (hint.includes('producer') || hint.includes('operations') || u.role === 'ADMIN') return 'Producer / Production Manager';
    return STANDARD_CREW_ROLES[0];
  };

  useEffect(() => {
    if (show) {
      setErrorMsg('');
      // Load registered user accounts
      getCrewCandidates()
        .then(res => {
          if (res.data?.success && Array.isArray(res.data.data)) {
            const users = res.data.data;
            setRegisteredUsers(users);
            if (users.length > 0 && !crewSource) {
              setCrewSource(users[0].id);
              setCrewPhone(users[0].phone || '');
              setCrewRoleSelect(suggestRoleForUser(users[0]));
            }
          }
        })
        .catch(() => {});

      if (project) {
        const match = (project.projectCode || '').match(/(\d+)$/);
        const num = match ? match[1].padStart(2, '0') : '01';
        setProjectNumber(num);

        // Strip JSON crew wrapper from notes if present
        let cleanNotes = project.notes || '';
        let parsedNotesCrew = [];
        if (cleanNotes) {
          try {
            const parsed = JSON.parse(cleanNotes);
            if (parsed && typeof parsed === 'object' && Array.isArray(parsed.crew)) {
              cleanNotes = parsed.general || '';
              parsedNotesCrew = parsed.crew;
            }
          } catch (e) {
            // plain text
          }
        }

        setFormData({
          title: project.title || '',
          projectCode: project.projectCode || '',
          client: project.client || '',
          director: project.director || '',
          location: project.location || '',
          startDate: project.startDate ? project.startDate.substring(0, 10) : '',
          endDate: project.endDate ? project.endDate.substring(0, 10) : '',
          status: project.status || 'PLANNING',
          notes: cleanNotes
        });

        setDirectorMode('OTHER');
        setSelectedDirectorUserId('');
        setCrewMembers(Array.isArray(project.crew) && project.crew.length > 0 ? project.crew : parsedNotesCrew);
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
        setDirectorMode('USER');
        setSelectedDirectorUserId('');
        setCrewMembers([]);

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
          .catch(() => {
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

  const handleDirectorSelectChange = (e) => {
    const val = e.target.value;
    if (val === 'OTHER') {
      setDirectorMode('OTHER');
      setSelectedDirectorUserId('OTHER');
      setFormData(prev => ({ ...prev, director: '' }));
    } else if (val === '') {
      setDirectorMode('USER');
      setSelectedDirectorUserId('');
      setFormData(prev => ({ ...prev, director: '' }));
    } else {
      setDirectorMode('USER');
      setSelectedDirectorUserId(val);
      const found = registeredUsers.find(u => u.id === val);
      if (found) {
        setFormData(prev => ({ ...prev, director: found.name }));
      }
    }
  };

  const handleCrewSourceChange = (e) => {
    const val = e.target.value;
    setCrewSource(val);
    if (val === 'OTHER') {
      setCustomCrewName('');
      setCrewPhone('');
    } else {
      const found = registeredUsers.find(u => u.id === val);
      if (found) {
        setCrewPhone(found.phone || '');
        setCrewRoleSelect(suggestRoleForUser(found));
      }
    }
  };

  const handleAddCrewToList = () => {
    let finalName = '';
    let finalPhone = crewPhone.trim();

    if (crewSource === 'OTHER') {
      finalName = customCrewName.trim();
    } else {
      const found = registeredUsers.find(u => u.id === crewSource);
      if (found) {
        finalName = found.name;
        if (!finalPhone && found.phone) finalPhone = found.phone;
      }
    }

    const finalRole = crewRoleSelect === 'OTHER' ? customCrewRole.trim() : crewRoleSelect;

    if (!finalName) {
      setErrorMsg('Please select a crew member or enter a custom crew name.');
      return;
    }
    if (!finalRole) {
      setErrorMsg('Please select a crew role or enter a custom role.');
      return;
    }

    setErrorMsg('');
    setCrewMembers(prev => [
      ...prev,
      {
        id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: finalName,
        role: finalRole,
        phone: finalPhone || null,
        callTime: crewCallTime || '07:00 AM',
        shootDate: formData.startDate || new Date().toISOString().substring(0, 10),
        status: 'CONFIRMED'
      }
    ]);

    if (crewSource === 'OTHER') {
      setCustomCrewName('');
      setCrewPhone('');
    }
    if (crewRoleSelect === 'OTHER') {
      setCustomCrewRole('');
    }
  };

  const handleQuickAddUser = (userObj) => {
    const alreadyAdded = crewMembers.some(c => c.name.toLowerCase() === userObj.name.toLowerCase());
    if (alreadyAdded) return;
    setCrewMembers(prev => [
      ...prev,
      {
        id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: userObj.name,
        role: suggestRoleForUser(userObj),
        phone: userObj.phone || null,
        callTime: '07:00 AM',
        shootDate: formData.startDate || new Date().toISOString().substring(0, 10),
        status: 'CONFIRMED'
      }
    ]);
  };

  const handleUpdateCrewRoleInline = (idx, newRole) => {
    setCrewMembers(prev => prev.map((c, i) => (i === idx ? { ...c, role: newRole } : c)));
  };

  const handleRemoveCrewFromList = (idx) => {
    setCrewMembers(prev => prev.filter((_, i) => i !== idx));
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
        notes: formData.notes?.trim() || null,
        crewMembers
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
                  {isEdit ? `Project Reference ${formData.projectCode}` : 'Register a new film or commercial production'}
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
            <div className="modal-body p-4" style={{ maxHeight: '76vh', overflowY: 'auto' }}>
              {errorMsg && (
                <div className="alert alert-danger py-2 px-3 small mb-3 d-flex align-items-center gap-2">
                  <i className="bi bi-exclamation-octagon-fill"></i>
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* SECTION: PROJECT IDENTIFICATION & STATUS */}
              <div className="form-section-card mb-3 p-3 border rounded bg-white shadow-xs">
                <div className="form-section-title mb-3 fw-bold text-dark small text-uppercase d-flex align-items-center justify-content-between">
                  <span>
                    <i className="bi bi-film text-primary me-1"></i> Project Identification & Details
                  </span>
                  <span className="badge bg-light text-muted border fw-normal" style={{ fontSize: '0.68rem' }}>
                    Auto-Assigned Sequence
                  </span>
                </div>

                <div className="row g-3">
                  {/* Auto-Generated Project Number */}
                  <div className="col-md-4 col-sm-6">
                    <label className="form-label small fw-semibold text-secondary">
                      <span>Sequence No.</span>
                      <span className="badge bg-primary-subtle text-primary border border-primary-subtle font-monospace" style={{ fontSize: '0.65rem' }}>
                        Auto
                      </span>
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-sm bg-light font-monospace fw-bold text-primary"
                      value={loadingCode ? '...' : projectNumber}
                      disabled
                      readOnly
                    />
                  </div>

                  {/* Auto-Generated Project Code */}
                  <div className="col-md-4 col-sm-6">
                    <label className="form-label small fw-semibold text-secondary">
                      <span>Project Code</span>
                      <span className="badge bg-success-subtle text-success border border-success-subtle font-monospace" style={{ fontSize: '0.65rem' }}>
                        Unique
                      </span>
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-sm bg-light font-monospace fw-bold text-dark"
                      value={loadingCode ? 'Generating...' : (formData.projectCode || 'PRJ-01')}
                      disabled
                      readOnly
                    />
                  </div>

                  {/* Project Status */}
                  <div className="col-md-4 col-sm-12">
                    <label className="form-label small fw-semibold text-secondary">
                      Production Status
                    </label>
                    <select
                      className="form-select form-select-sm"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                    >
                      <option value="PLANNING">Planning (Pre-Production)</option>
                      <option value="IN_PRODUCTION">In Production (Active Shoot)</option>
                      <option value="COMPLETED">Completed (Wrap)</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>

                  {/* Project Title */}
                  <div className="col-md-7">
                    <label className="form-label small fw-semibold text-secondary">
                      Project Title
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      name="title"
                      placeholder="Production title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  {/* Client / Studio */}
                  <div className="col-md-5">
                    <label className="form-label small fw-semibold text-secondary">
                      Client / Studio
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      name="client"
                      placeholder="Client or studio name"
                      value={formData.client}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION: DIRECTOR, LOCATION & TIMELINE */}
              <div className="form-section-card mb-3 p-3 border rounded bg-white shadow-xs">
                <div className="form-section-title mb-3 fw-bold text-dark small text-uppercase">
                  <i className="bi bi-calendar-range text-primary me-1"></i> Director, Location & Schedule
                </div>
                <div className="row g-3">
                  {/* Director Selection (from Registered Accounts or Other) */}
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold text-secondary">
                      <span>Director / Lead DP</span>
                      <button
                        type="button"
                        className="btn btn-link btn-sm p-0 text-decoration-none"
                        style={{ fontSize: '0.7rem', minHeight: 'auto' }}
                        onClick={() => setDirectorMode(prev => (prev === 'USER' ? 'OTHER' : 'USER'))}
                      >
                        {directorMode === 'USER' ? 'Enter Custom Name' : 'Select Registered User'}
                      </button>
                    </label>
                    {directorMode === 'USER' && registeredUsers.length > 0 ? (
                      <select
                        className="form-select form-select-sm"
                        value={selectedDirectorUserId}
                        onChange={handleDirectorSelectChange}
                      >
                        <option value="">Select from registered users...</option>
                        {registeredUsers.map(u => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.department || u.role})
                          </option>
                        ))}
                        <option value="OTHER">Other (Enter Custom Name)...</option>
                      </select>
                    ) : (
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        name="director"
                        placeholder="Director or Lead DP name"
                        value={formData.director}
                        onChange={handleChange}
                      />
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-semibold text-secondary">Primary Shooting Location</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      name="location"
                      placeholder="Studio lot or field location"
                      value={formData.location}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-semibold text-secondary">
                      Start Date
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
                      Wrap Date
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

              {/* SECTION: CREW & ROLE ASSIGNMENT (Registered Accounts + Other Option) */}
              <div className="form-section-card mb-3 p-3 border rounded bg-white shadow-xs">
                <div className="form-section-title mb-2 fw-bold text-dark small text-uppercase d-flex align-items-center justify-content-between">
                  <span>
                    <i className="bi bi-people-fill text-primary me-1"></i> Assign Project Crew & Roles
                  </span>
                  <span className="badge bg-primary-subtle text-primary border border-primary-subtle" style={{ fontSize: '0.68rem' }}>
                    {crewMembers.length} Crew Assigned
                  </span>
                </div>

                {/* Quick 1-Click Add from Registered Accounts */}
                {registeredUsers.length > 0 && (
                  <div className="mb-3 pb-2 border-bottom">
                    <div className="text-muted mb-1" style={{ fontSize: '0.72rem' }}>
                      Quick Add from Registered User Accounts:
                    </div>
                    <div className="d-flex flex-wrap gap-1">
                      {registeredUsers.map(u => {
                        const isAssigned = crewMembers.some(c => c.name.toLowerCase() === u.name.toLowerCase());
                        return (
                          <button
                            key={u.id}
                            type="button"
                            className={`btn btn-xs ${isAssigned ? 'btn-success text-white' : 'btn-outline-secondary'} d-inline-flex align-items-center gap-1`}
                            onClick={() => handleQuickAddUser(u)}
                            disabled={isAssigned}
                            title={u.department || u.email}
                          >
                            <i className={`bi ${isAssigned ? 'bi-check-lg' : 'bi-person-plus'}`}></i>
                            <span>{u.name}</span>
                            <span className="opacity-75">({u.department || u.role})</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Select Crew Member (Registered User or Other) + Role (Standard or Other) */}
                <div className="row g-2 align-items-end">
                  <div className={crewSource === 'OTHER' ? 'col-md-3' : 'col-md-5'}>
                    <label className="form-label small fw-semibold text-secondary">Crew Member</label>
                    <select
                      className="form-select form-select-sm"
                      value={crewSource}
                      onChange={handleCrewSourceChange}
                    >
                      <optgroup label="Registered User Accounts">
                        {registeredUsers.map(u => (
                          <option key={u.id} value={u.id}>
                            {u.name} — {u.department || u.role}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="External / Custom">
                        <option value="OTHER">Other (Enter Crew Name)...</option>
                      </optgroup>
                    </select>
                  </div>

                  {crewSource === 'OTHER' && (
                    <div className="col-md-3">
                      <label className="form-label small fw-semibold text-secondary">Custom Crew Name</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="Enter full name"
                        value={customCrewName}
                        onChange={(e) => setCustomCrewName(e.target.value)}
                      />
                    </div>
                  )}

                  <div className={crewRoleSelect === 'OTHER' ? 'col-md-3' : 'col-md-4'}>
                    <label className="form-label small fw-semibold text-secondary">Production Role</label>
                    <select
                      className="form-select form-select-sm"
                      value={crewRoleSelect}
                      onChange={(e) => setCrewRoleSelect(e.target.value)}
                    >
                      {STANDARD_CREW_ROLES.map((r, i) => (
                        <option key={i} value={r}>{r}</option>
                      ))}
                      <option value="OTHER">Other (Enter Custom Role)...</option>
                    </select>
                  </div>

                  {crewRoleSelect === 'OTHER' && (
                    <div className="col-md-3">
                      <label className="form-label small fw-semibold text-secondary">Custom Role</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="Enter role title"
                        value={customCrewRole}
                        onChange={(e) => setCustomCrewRole(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="col-md-3">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary w-100"
                      onClick={handleAddCrewToList}
                    >
                      <i className="bi bi-plus-circle me-1"></i> Add Crew & Role
                    </button>
                  </div>
                </div>

                {/* Assigned Crew Roster List */}
                {crewMembers.length > 0 && (
                  <div className="table-responsive border rounded mt-3">
                    <table className="table table-sm align-middle mb-0" style={{ fontSize: '0.8rem' }}>
                      <thead className="table-light">
                        <tr>
                          <th>Crew Name</th>
                          <th>Assigned Role</th>
                          <th>Contact</th>
                          <th className="text-end">Remove</th>
                        </tr>
                      </thead>
                      <tbody>
                        {crewMembers.map((cm, idx) => (
                          <tr key={cm.id || idx}>
                            <td className="fw-semibold text-dark">{cm.name}</td>
                            <td>
                              <select
                                className="form-select form-select-sm py-0 px-2"
                                style={{ height: '28px', minHeight: '28px', fontSize: '0.76rem' }}
                                value={STANDARD_CREW_ROLES.includes(cm.role) ? cm.role : 'CUSTOM_EXISTING'}
                                onChange={(e) => {
                                  if (e.target.value !== 'CUSTOM_EXISTING') {
                                    handleUpdateCrewRoleInline(idx, e.target.value);
                                  }
                                }}
                              >
                                {!STANDARD_CREW_ROLES.includes(cm.role) && (
                                  <option value="CUSTOM_EXISTING">{cm.role}</option>
                                )}
                                {STANDARD_CREW_ROLES.map((r, rIdx) => (
                                  <option key={rIdx} value={r}>{r}</option>
                                ))}
                              </select>
                            </td>
                            <td className="text-muted font-monospace small">{cm.phone || '—'}</td>
                            <td className="text-end">
                              <button
                                type="button"
                                className="btn btn-xs btn-outline-danger"
                                onClick={() => handleRemoveCrewFromList(idx)}
                                title="Remove from project"
                              >
                                <i className="bi bi-x-lg"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* SECTION: PRODUCTION NOTES */}
              <div className="form-section-card mb-0 p-3 border rounded bg-white shadow-xs">
                <div className="form-section-title mb-2 fw-bold text-dark small text-uppercase">
                  <i className="bi bi-card-text text-primary me-1"></i> Production Notes
                </div>
                <textarea
                  className="form-control form-control-sm"
                  rows="2"
                  name="notes"
                  placeholder="Optional camera package or production notes"
                  value={formData.notes}
                  onChange={handleChange}
                ></textarea>
              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer bg-light py-2 px-4 d-flex justify-content-between align-items-center">
              <div className="text-muted small" style={{ fontSize: '0.72rem' }}>
                Project Code: <strong className="text-dark font-monospace">{formData.projectCode || 'PRJ-01'}</strong>
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
                      <i className="bi bi-check2-circle me-1"></i> {isEdit ? 'Update Project' : 'Save Project'}
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
