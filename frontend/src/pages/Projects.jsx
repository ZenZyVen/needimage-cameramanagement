import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject
} from '../services/projectService';
import ProjectCard from '../components/projects/ProjectCard';
import ProjectFormModal from '../components/projects/ProjectFormModal';
import ProjectCrewModal from '../components/projects/ProjectCrewModal';
import StatusBadge from '../components/common/StatusBadge';
import { formatDate } from '../utils/formatters';

const Projects = () => {
  const { isStaff, isAdmin } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [crewProject, setCrewProject] = useState(null);
  const [showCrewModal, setShowCrewModal] = useState(false);

  const [alertMsg, setAlertMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    loadProjects();
  }, [statusFilter, searchTerm]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const params = {
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        search: searchTerm.trim() || undefined
      };
      const res = await getProjects(params);
      if (res.data?.success) {
        setProjects(res.data.data || []);
      }
    } catch (err) {
      setAlertMsg({ type: 'danger', text: err.response?.data?.message || 'Error loading projects.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = async (formData) => {
    if (editingProject) {
      await updateProject(editingProject.id, formData);
      setAlertMsg({ type: 'success', text: `Project "${formData.title}" updated successfully.` });
    } else {
      await createProject(formData);
      setAlertMsg({ type: 'success', text: `Project "${formData.title}" created successfully.` });
    }
    loadProjects();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await deleteProject(id);
        setAlertMsg({ type: 'success', text: 'Project deleted successfully.' });
        loadProjects();
      } catch (err) {
        setAlertMsg({ type: 'danger', text: err.response?.data?.message || 'Cannot delete project.' });
      }
    }
  };

  const handleViewDetail = async (project) => {
    try {
      setLoadingDetail(true);
      setShowDetailModal(true);
      const res = await getProjectById(project.id);
      if (res.data?.success) {
        setSelectedProject(res.data.data);
      }
    } catch (err) {
      console.warn('Error fetching project detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <div>
      {/* Top Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-2">
        <div className="d-flex align-items-center gap-2">
          <h4 className="fw-bold text-dark mb-0">Production Projects</h4>
          {!isAdmin && (
            <span className="badge bg-secondary-subtle text-secondary border small">
              <i className="bi bi-eye me-1"></i> View Only
            </span>
          )}
        </div>

        {isAdmin && (
          <button
            type="button"
            className="btn btn-sm btn-primary d-flex align-items-center gap-1 shadow-sm px-3"
            onClick={() => {
              setEditingProject(null);
              setShowFormModal(true);
            }}
          >
            <i className="bi bi-folder-plus"></i>
            <span>Create Project</span>
          </button>
        )}
      </div>

      {alertMsg.text && (
        <div className={`alert alert-${alertMsg.type} alert-dismissible fade show py-2 small mb-3`} role="alert">
          {alertMsg.text}
          <button type="button" className="btn-close py-2" onClick={() => setAlertMsg({ type: '', text: '' })}></button>
        </div>
      )}

      {/* Filter toolbar */}
      <div className="card mb-4 border-0 shadow-sm">
        <div className="card-body p-3">
          <div className="row g-2 align-items-center">
            <div className="col-md-7">
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={() => setSearchTerm('')}
                  >
                    <i className="bi bi-x-lg"></i>
                  </button>
                )}
              </div>
            </div>

            <div className="col-md-5">
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Project Statuses</option>
                <option value="PLANNING">Planning (Pre-Production)</option>
                <option value="IN_PRODUCTION">In Production (Active Shooting)</option>
                <option value="COMPLETED">Completed (Wrap)</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="text-muted small mt-2">Loading projects...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="card text-center py-5">
          <div className="card-body">
            <i className="bi bi-film fs-1 text-muted d-block mb-2"></i>
            <h6 className="fw-bold text-dark">No production projects found</h6>
            <p className="text-muted small mb-3">
              {isAdmin
                ? 'Create your first project to organize equipment allocations and shoot dates.'
                : 'No projects have been registered by studio administration yet.'}
            </p>
            {isAdmin && (
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={() => {
                  setEditingProject(null);
                  setShowFormModal(true);
                }}
              >
                Create Project
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="row g-3">
          {projects.map(p => (
            <div key={p.id} className="col-sm-6 col-lg-4">
              <ProjectCard
                project={p}
                canManage={isAdmin}
                onView={handleViewDetail}
                onEdit={(proj) => {
                  if (!isAdmin) return;
                  setEditingProject(proj);
                  setShowFormModal(true);
                }}
                onDelete={(id) => {
                  if (!isAdmin) return;
                  handleDelete(id);
                }}
                onCrew={(proj) => {
                  setCrewProject(proj);
                  setShowCrewModal(true);
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Project Form Modal */}
      <ProjectFormModal
        show={showFormModal}
        onHide={() => setShowFormModal(false)}
        onSubmit={handleCreateOrUpdate}
        project={editingProject}
      />

      {/* Project Crew Roster & Field Registration Modal */}
      <ProjectCrewModal
        show={showCrewModal}
        onHide={() => setShowCrewModal(false)}
        project={crewProject}
        onCrewUpdated={loadProjects}
      />

      {/* Project Detail Modal */}
      {showDetailModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-slate-900 text-white" style={{ backgroundColor: '#1e293b' }}>
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-primary fs-6">{selectedProject?.projectCode}</span>
                  <h6 className="modal-title fw-bold text-white mb-0">{selectedProject?.title}</h6>
                </div>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setShowDetailModal(false)}
                  aria-label="Close"
                  title="Close modal"
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>

              <div className="modal-body p-4" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
                {loadingDetail ? (
                  <div className="text-center py-4">
                    <div className="spinner-border spinner-border-sm text-primary"></div>
                  </div>
                ) : selectedProject ? (
                  <div>
                    {/* Metadata summary */}
                    <div className="row g-3 mb-4">
                      <div className="col-md-6">
                        <div className="p-3 border rounded bg-light">
                          <span className="text-muted small text-uppercase fw-semibold d-block">Production Details</span>
                          <div className="small text-muted mt-1">Client: <strong>{selectedProject.client || 'N/A'}</strong></div>
                          <div className="small text-muted">Director: <strong>{selectedProject.director || 'N/A'}</strong></div>
                          <div className="small text-muted">Created By: {selectedProject.createdBy?.name}</div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="p-3 border rounded bg-light">
                          <span className="text-muted small text-uppercase fw-semibold d-block">Location & Schedule</span>
                          <div className="small text-muted mt-1">
                            Dates: <strong>{formatDate(selectedProject.startDate)}</strong> – <strong>{formatDate(selectedProject.endDate)}</strong>
                          </div>
                          <div className="small text-muted">Location: <strong>{selectedProject.location || 'Studio'}</strong></div>
                          <div className="mt-1">
                            <StatusBadge status={selectedProject.status} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {selectedProject.notes && (
                      <div className="p-3 border rounded bg-white mb-4">
                        <span className="text-muted small text-uppercase fw-semibold d-block mb-1">Notes</span>
                        <p className="small text-secondary mb-0">{selectedProject.notes}</p>
                      </div>
                    )}

                    {/* Assigned Crew Roster */}
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h6 className="fw-bold text-secondary small text-uppercase mb-0">
                        Assigned Production Crew ({selectedProject.crew?.length || 0})
                      </h6>
                      <button
                        type="button"
                        className="btn btn-xs btn-outline-primary"
                        onClick={() => {
                          setShowDetailModal(false);
                          setCrewProject(selectedProject);
                          setShowCrewModal(true);
                        }}
                      >
                        <i className="bi bi-people me-1"></i> Manage Crew & Roles
                      </button>
                    </div>

                    {!selectedProject.crew?.length ? (
                      <div className="p-3 border rounded bg-light text-center text-muted small mb-4">
                        No crew members assigned yet.
                      </div>
                    ) : (
                      <div className="d-flex flex-wrap gap-2 mb-4">
                        {selectedProject.crew.map((c) => (
                          <div key={c.id} className="p-2 border rounded bg-white d-inline-flex align-items-center gap-2 shadow-xs">
                            <span className="fw-bold text-dark small">{c.name}</span>
                            <span className="badge bg-primary-subtle text-primary border border-primary-subtle" style={{ fontSize: '0.68rem' }}>
                              {c.role}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Associated Equipment Requests */}
                    <h6 className="fw-bold text-secondary small text-uppercase mb-2">
                      Equipment Allocated to this Project ({selectedProject.borrowRequests?.length || 0} Request Bundles)
                    </h6>

                    {selectedProject.borrowRequests?.length === 0 ? (
                      <div className="p-4 border rounded bg-light text-center text-muted small">
                        No equipment requests linked to this project yet.
                      </div>
                    ) : (
                      <div className="d-flex flex-column gap-3">
                        {selectedProject.borrowRequests?.map(req => (
                          <div key={req.id} className="border rounded p-3 bg-white">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <div>
                                <span className="badge bg-dark me-2">{req.requestNumber}</span>
                                <strong className="small text-dark">{req.user?.name}</strong>
                                <span className="text-muted small ms-2">({req.purpose})</span>
                              </div>
                              <StatusBadge status={req.status} />
                            </div>

                            <div className="d-flex flex-wrap gap-2 mt-2">
                              {req.items?.map(i => (
                                <span key={i.id} className="accessory-badge">
                                  <i className="bi bi-camera me-1 text-primary"></i>
                                  {i.equipment?.assetTag} - {i.equipment?.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              <div className="modal-footer bg-light py-2">
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => setShowDetailModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
