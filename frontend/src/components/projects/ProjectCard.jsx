import React from 'react';
import StatusBadge from '../common/StatusBadge';
import { formatDate } from '../../utils/formatters';

const ProjectCard = ({ project, onView, onEdit, onDelete, onCrew, canManage }) => {
  const crewCount = project.crew?.length ?? project._count?.crew ?? 0;

  return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-body p-3 d-flex flex-column justify-content-between">
        <div>
          <div className="d-flex justify-content-between align-items-center mb-2" style={{ height: '24px' }}>
            <span className="badge bg-secondary-subtle text-secondary border fw-bold" style={{ fontSize: '0.72rem' }}>
              {project.projectCode}
            </span>
            <StatusBadge status={project.status} />
          </div>

          <h6
            className="fw-bold text-dark text-truncate mb-1"
            title={project.title}
            style={{ cursor: 'pointer', height: '22px', lineHeight: '1.4' }}
            onClick={() => onView(project)}
          >
            {project.title}
          </h6>

          <div className="text-muted small text-truncate mb-3" style={{ height: '20px' }}>
            Client: <span className="text-secondary fw-medium">{project.client || 'Internal Studio'}</span>
          </div>

          <div className="p-2 border rounded bg-light mb-3">
            <div className="row g-1 text-center" style={{ fontSize: '0.76rem' }}>
              <div className="col-5 border-end">
                <span className="text-muted d-block">Director</span>
                <span className="fw-semibold text-dark text-truncate d-block" title={project.director || '—'}>
                  {project.director || '—'}
                </span>
              </div>
              <div className="col-4 border-end">
                <span className="text-muted d-block">Crew</span>
                <span className="fw-bold text-primary">{crewCount}</span>
              </div>
              <div className="col-3">
                <span className="text-muted d-block">Loans</span>
                <span className="fw-bold text-dark">{project._count?.borrowRequests || 0}</span>
              </div>
            </div>
          </div>

          <div className="small text-muted text-truncate mb-1" style={{ height: '20px' }}>
            <i className="bi bi-calendar3 me-1"></i>
            {formatDate(project.startDate)} – {formatDate(project.endDate)}
          </div>
          <div className="small text-muted text-truncate" style={{ height: '20px' }} title={project.location || 'Studio Lot'}>
            <i className="bi bi-geo-alt me-1"></i>
            {project.location || 'Studio Lot'}
          </div>
        </div>

        {/* Actions (Uniform 32px height across all buttons) */}
        <div className="d-flex align-items-center gap-1 border-top pt-2 mt-3" style={{ height: '42px' }}>
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm flex-fill"
            style={{ fontSize: '0.75rem', height: '32px', minHeight: '32px', padding: '0 0.5rem' }}
            onClick={() => onView(project)}
          >
            <i className="bi bi-camera-reels me-1"></i> Details
          </button>
          <button
            type="button"
            className="btn btn-outline-primary btn-sm flex-fill"
            style={{ fontSize: '0.75rem', height: '32px', minHeight: '32px', padding: '0 0.5rem' }}
            onClick={() => onCrew(project)}
            title="Assign Crew & Roles"
          >
            <i className="bi bi-people me-1"></i> Crew ({crewCount})
          </button>
          {canManage && (
            <>
              <button
                type="button"
                className="btn btn-light border btn-sm flex-shrink-0"
                style={{ width: '32px', height: '32px', minHeight: '32px', padding: 0 }}
                title="Edit Project"
                onClick={() => onEdit(project)}
              >
                <i className="bi bi-pencil text-secondary" style={{ fontSize: '0.8rem' }}></i>
              </button>
              <button
                type="button"
                className="btn btn-light border btn-sm text-danger flex-shrink-0"
                style={{ width: '32px', height: '32px', minHeight: '32px', padding: 0 }}
                title="Delete Project"
                onClick={() => onDelete(project.id)}
              >
                <i className="bi bi-trash" style={{ fontSize: '0.8rem' }}></i>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
