import React from 'react';
import StatusBadge from '../common/StatusBadge';
import { formatDate } from '../../utils/formatters';

const ProjectCard = ({ project, onView, onEdit, onDelete, canManage }) => {
  return (
    <div className="card h-100">
      <div className="card-body p-3 d-flex flex-column justify-content-between">
        <div>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="badge bg-secondary-subtle text-secondary border fw-bold" style={{ fontSize: '0.72rem' }}>
              {project.projectCode}
            </span>
            <StatusBadge status={project.status} />
          </div>

          <h6
            className="fw-bold text-dark text-truncate mb-1"
            title={project.title}
            style={{ cursor: 'pointer' }}
            onClick={() => onView(project)}
          >
            {project.title}
          </h6>

          <div className="text-muted small mb-3">
            Client: <span className="text-secondary fw-medium">{project.client || 'Internal'}</span>
          </div>

          <div className="p-2 border rounded bg-light mb-3">
            <div className="row g-2 text-center" style={{ fontSize: '0.78rem' }}>
              <div className="col-6 border-end">
                <span className="text-muted d-block">Director</span>
                <span className="fw-semibold text-dark text-truncate d-block">{project.director || '—'}</span>
              </div>
              <div className="col-6">
                <span className="text-muted d-block">Requests</span>
                <span className="fw-bold text-primary">{project._count?.borrowRequests || 0}</span>
              </div>
            </div>
          </div>

          <div className="small text-muted mb-2">
            <i className="bi bi-calendar3 me-1"></i>
            {formatDate(project.startDate)} – {formatDate(project.endDate)}
          </div>
          {project.location && (
            <div className="small text-muted text-truncate">
              <i className="bi bi-geo-alt me-1"></i>
              {project.location}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="d-flex align-items-center gap-1 border-top pt-2 mt-3">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm flex-fill"
            style={{ fontSize: '0.75rem' }}
            onClick={() => onView(project)}
          >
            View Project Gear
          </button>
          {canManage && (
            <>
              <button
                type="button"
                className="btn btn-light border btn-sm"
                style={{ width: '30px', height: '30px', padding: 0 }}
                title="Edit Project"
                onClick={() => onEdit(project)}
              >
                <i className="bi bi-pencil text-secondary" style={{ fontSize: '0.8rem' }}></i>
              </button>
              <button
                type="button"
                className="btn btn-light border btn-sm text-danger"
                style={{ width: '30px', height: '30px', padding: 0 }}
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
