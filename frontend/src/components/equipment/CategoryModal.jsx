import React, { useState, useEffect } from 'react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../services/equipmentService';
import CategoryIconPicker from './CategoryIconPicker';
import CategoryIcon, { prepareCategoryIconForSave } from '../common/CategoryIcon';

const CategoryModal = ({ show, onHide, categories = [], onCategoriesUpdated, onCategoriesChanged }) => {
  const [localCategories, setLocalCategories] = useState(categories);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('bi-camera-reels');
  const [editingCategory, setEditingCategory] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  useEffect(() => {
    if (show && (!categories || categories.length === 0)) {
      getCategories()
        .then((res) => {
          if (res.data?.success) {
            setLocalCategories(res.data.data || []);
          }
        })
        .catch(() => {});
    }
  }, [show]);

  if (!show) return null;

  const notifyParent = () => {
    const callback = onCategoriesUpdated || onCategoriesChanged;
    if (typeof callback === 'function') {
      callback();
    }
    getCategories()
      .then((res) => {
        if (res.data?.success) {
          setLocalCategories(res.data.data || []);
        }
      })
      .catch(() => {});
  };

  const resetForm = () => {
    setEditingCategory(null);
    setName('');
    setDescription('');
    setIcon('bi-camera-reels');
  };

  const handleStartEdit = (cat) => {
    setErrorMsg('');
    setSuccessMsg('');
    setEditingCategory(cat);
    setName(cat.name || '');
    setDescription(cat.description || '');
    setIcon(cat.icon || 'bi-camera');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Category name is required.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');
      setSuccessMsg('');
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        icon: prepareCategoryIconForSave(icon)
      };

      if (editingCategory) {
        await updateCategory(editingCategory.id, payload);
        setSuccessMsg(`Category "${payload.name}" updated successfully.`);
      } else {
        await createCategory(payload);
        setSuccessMsg('Category created successfully.');
      }

      resetForm();
      notifyParent();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error saving category.');
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
      if (editingCategory?.id === id) {
        resetForm();
      }
      setSuccessMsg(`Category "${catName}" removed.`);
      notifyParent();
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

          <div className="modal-body p-4" style={{ maxHeight: '78vh', overflowY: 'auto' }}>
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

            {/* 1. Create / Edit Category Form */}
            <div className="form-section-card">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div className="form-section-title mb-0">
                  <i className={`bi ${editingCategory ? 'bi-pencil-square' : 'bi-plus-circle-fill'} text-primary`}></i>{' '}
                  {editingCategory ? `Edit Category: ${editingCategory.name}` : 'Create New Category'}
                </div>
                {editingCategory && (
                  <button
                    type="button"
                    className="btn btn-xs btn-outline-secondary"
                    onClick={resetForm}
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Category Name</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. C-Stands, Softboxes, Filters"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Category Description (Optional)</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Short description of gear in this category"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label">Choose Industry Icon</label>
                    <CategoryIconPicker value={icon} onChange={setIcon} />
                  </div>

                  <div className="col-12 d-flex justify-content-end gap-2">
                    {editingCategory && (
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={resetForm}
                        disabled={submitting}
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      className="btn btn-primary px-4"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-1"></span> Saving...
                        </>
                      ) : editingCategory ? (
                        <>
                          <i className="bi bi-check-lg me-1"></i> Save Changes
                        </>
                      ) : (
                        <>
                          <i className="bi bi-plus-lg me-1"></i> Add Category
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* 2. Existing Categories List */}
            <div className="form-section-card mb-0">
              <div className="form-section-title">
                <i className="bi bi-list-check text-primary"></i> Existing Categories ({localCategories.length})
              </div>

              <div className="table-responsive border rounded bg-white">
                <table className="table table-custom mb-0">
                  <thead>
                    <tr>
                      <th style={{ width: 44 }}>Icon</th>
                      <th>Category Name</th>
                      <th>Description</th>
                      <th>Items in Vault</th>
                      <th className="text-end" style={{ width: 100 }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {localCategories.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-4 text-muted small">
                          No categories defined yet.
                        </td>
                      </tr>
                    ) : (
                      localCategories.map((cat) => (
                        <tr key={cat.id} className={editingCategory?.id === cat.id ? 'table-primary' : ''}>
                          <td>
                            <div className="p-1 rounded bg-light text-primary d-inline-flex align-items-center justify-content-center" style={{ width: 32, height: 32 }}>
                              <CategoryIcon icon={cat.icon} name={cat.name} size={20} fallback="bi-box-seam" />
                            </div>
                          </td>
                          <td className="fw-semibold text-dark">{cat.name}</td>
                          <td className="small text-muted">{cat.description || '—'}</td>
                          <td>
                            <span className="badge bg-light text-secondary border">
                              {cat._count?.equipment ?? 0} item(s)
                            </span>
                          </td>
                          <td className="text-end">
                            <div className="btn-group btn-group-sm">
                              <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={() => handleStartEdit(cat)}
                                title="Edit category & icon"
                              >
                                <i className="bi bi-pencil"></i>
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline-danger"
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
                            </div>
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
