import React, { useState } from 'react';
import { createCategory, deleteCategory } from '../../services/equipmentService';

const AVAILABLE_ICONS = [
  { value: 'bi-camera', label: 'Camera' },
  { value: 'bi-record-circle', label: 'Lens' },
  { value: 'bi-lightbulb', label: 'Lighting' },
  { value: 'bi-mic', label: 'Audio' },
  { value: 'bi-arrows-move', label: 'Grip & Support' },
  { value: 'bi-airplane', label: 'Drones' },
  { value: 'bi-battery-charging', label: 'Power & Batteries' },
  { value: 'bi-sd-card', label: 'Media & Storage' },
  { value: 'bi-box-seam', label: 'Cases & Accs' }
];

const CategoryModal = ({ show, onHide, categories = [], onCategoriesUpdated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('bi-camera');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!show) return null;

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Category name is required.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');
      setSuccessMsg('');
      await createCategory({
        name: name.trim(),
        description: description.trim() || null,
        icon
      });
      setName('');
      setDescription('');
      setIcon('bi-camera');
      setSuccessMsg('Category created successfully.');
      onCategoriesUpdated();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error creating category.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, catName) => {
    if (!window.confirm(`Are you sure you want to remove the category "${catName}"?`)) {
      return;
    }

    try {
      setDeletingId(id);
      setErrorMsg('');
      setSuccessMsg('');
      await deleteCategory(id);
      setSuccessMsg(`Category "${catName}" removed.`);
      onCategoriesUpdated();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error deleting category.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)' }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content border-0 shadow-lg">
          <div className="modal-header bg-slate-900 text-white" style={{ backgroundColor: '#0f172a' }}>
            <div className="d-flex align-items-center gap-2">
              <div className="p-2 rounded bg-primary-subtle text-primary d-flex align-items-center justify-content-center" style={{ width: 34, height: 34 }}>
                <i className="bi bi-tags-fill"></i>
              </div>
              <h6 className="modal-title fw-bold text-white mb-0">Equipment Categories Management</h6>
            </div>
            <button
              type="button"
              className="modal-close-btn"
              onClick={onHide}
              aria-label="Close"
            >
              <i className="bi bi-x-lg"></i>
            </button>
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

            {/* 1. Create New Category Form */}
            <div className="form-section-card">
              <div className="form-section-title">
                <i className="bi bi-plus-circle-fill text-primary"></i> Create New Category
              </div>

              <form onSubmit={handleCreate}>
                <div className="row g-3">
                  <div className="col-md-5">
                    <label className="form-label">
                      Category Name <span className="required-star">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Category Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">Category Icon</label>
                    <select
                      className="form-select"
                      value={icon}
                      onChange={(e) => setIcon(e.target.value)}
                    >
                      {AVAILABLE_ICONS.map((ic) => (
                        <option key={ic.value} value={ic.value}>
                          {ic.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-3 d-flex align-items-end">
                    <button
                      type="submit"
                      className="btn btn-primary w-100"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-1"></span> Creating...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-plus-lg me-1"></i> Add Category
                        </>
                      )}
                    </button>
                  </div>

                  <div className="col-12">
                    <label className="form-label">Category Description (Optional)</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Category Description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                </div>
              </form>
            </div>

            {/* 2. Existing Categories List */}
            <div className="form-section-card mb-0">
              <div className="form-section-title">
                <i className="bi bi-list-check text-primary"></i> Existing Categories ({categories.length})
              </div>

              <div className="table-responsive border rounded bg-white">
                <table className="table table-custom mb-0">
                  <thead>
                    <tr>
                      <th style={{ width: 40 }}>Icon</th>
                      <th>Category Name</th>
                      <th>Description</th>
                      <th>Items in Vault</th>
                      <th className="text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-4 text-muted small">
                          No categories defined yet.
                        </td>
                      </tr>
                    ) : (
                      categories.map((cat) => (
                        <tr key={cat.id}>
                          <td>
                            <i className={`bi ${cat.icon || 'bi-box-seam'} fs-5 text-primary`}></i>
                          </td>
                          <td className="fw-semibold text-dark">{cat.name}</td>
                          <td className="small text-muted">{cat.description || '—'}</td>
                          <td>
                            <span className="badge bg-light text-secondary border">
                              {cat._count?.equipment ?? 0} item(s)
                            </span>
                          </td>
                          <td className="text-end">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDelete(cat.id, cat.name)}
                              disabled={deletingId === cat.id}
                              title="Delete category"
                            >
                              {deletingId === cat.id ? (
                                <span className="spinner-border spinner-border-sm"></span>
                              ) : (
                                <i className="bi bi-trash"></i>
                              )}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
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

export default CategoryModal;
