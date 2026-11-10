import React, { useState, useEffect } from 'react';
import { getUsers, createUser, updateUser, deleteUser } from '../services/userService';
import { formatDate } from '../utils/formatters';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'USER',
    department: 'Cinematography',
    phone: ''
  });

  const [alertMsg, setAlertMsg] = useState({ type: '', text: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadUsers();
  }, [roleFilter, search]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params = {
        role: roleFilter !== 'ALL' ? roleFilter : undefined,
        search: search.trim() || undefined
      };
      const res = await getUsers(params);
      if (res.data?.success) {
        setUsers(res.data.data || []);
      }
    } catch (err) {
      setAlertMsg({ type: 'danger', text: err.response?.data?.message || 'Error loading users.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await createUser(formData);
      setAlertMsg({ type: 'success', text: `User "${formData.name}" created successfully.` });
      setShowCreateModal(false);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'USER',
        department: 'Cinematography',
        phone: ''
      });
      loadUsers();
    } catch (err) {
      setAlertMsg({ type: 'danger', text: err.response?.data?.message || 'Error creating user.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await updateUser(editingUser.id, {
        name: editingUser.name,
        role: editingUser.role,
        department: editingUser.department,
        phone: editingUser.phone,
        isActive: editingUser.isActive
      });
      setAlertMsg({ type: 'success', text: `User "${editingUser.name}" updated successfully.` });
      setShowEditModal(false);
      loadUsers();
    } catch (err) {
      setAlertMsg({ type: 'danger', text: err.response?.data?.message || 'Error updating user.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteUser(id);
        setAlertMsg({ type: 'success', text: 'User deleted successfully.' });
        loadUsers();
      } catch (err) {
        setAlertMsg({ type: 'danger', text: err.response?.data?.message || 'Error deleting user.' });
      }
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN':
        return <span className="badge bg-dark">ADMIN</span>;
      case 'STOCK_CONTROLLER':
        return <span className="badge bg-secondary">STOCK CONTROLLER</span>;
      case 'USER':
      default:
        return <span className="badge bg-primary">NORMAL USER</span>;
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-2">
        <div>
          <h4 className="fw-bold text-dark mb-1">User & Role Management</h4>
          <p className="text-muted small mb-0">
            Control user permissions across Admin, Stock Controller, and Normal User roles.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-sm btn-primary d-flex align-items-center gap-1"
          onClick={() => setShowCreateModal(true)}
        >
          <i className="bi bi-person-plus"></i>
          <span>Create New User</span>
        </button>
      </div>

      {alertMsg.text && (
        <div className={`alert alert-${alertMsg.type} alert-dismissible fade show py-2 small mb-3`} role="alert">
          {alertMsg.text}
          <button type="button" className="btn-close py-2" onClick={() => setAlertMsg({ type: '', text: '' })}></button>
        </div>
      )}

      {/* Filter toolbar */}
      <div className="card mb-4">
        <div className="card-body p-3">
          <div className="row g-2 align-items-center">
            <div className="col-md-6">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-white border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Search name, email, department..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="col-md-4">
              <select
                className="form-select form-select-sm"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="ALL">All Roles</option>
                <option value="ADMIN">Admin</option>
                <option value="STOCK_CONTROLLER">Stock Controller</option>
                <option value="USER">Normal User</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="text-muted small mt-2">Loading users...</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-responsive">
            <table className="table table-custom">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Phone</th>
                  <th>Borrow History</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="fw-semibold text-dark">{u.name}</div>
                      <div className="small text-muted">{u.email}</div>
                    </td>
                    <td>{getRoleBadge(u.role)}</td>
                    <td>{u.department || '—'}</td>
                    <td>{u.phone || '—'}</td>
                    <td>
                      <span className="badge bg-light text-secondary border">
                        {u._count?.borrowRequests || 0} loan(s)
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${u.isActive ? 'bg-success' : 'bg-danger'}`}>
                        {u.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td className="small">{formatDate(u.createdAt)}</td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        <button
                          type="button"
                          className="btn btn-light border"
                          title="Edit User"
                          onClick={() => {
                            setEditingUser(u);
                            setShowEditModal(true);
                          }}
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          type="button"
                          className="btn btn-light border text-danger"
                          title="Delete User"
                          onClick={() => handleDelete(u.id)}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-slate-900 text-white" style={{ backgroundColor: '#1e293b' }}>
                <h6 className="modal-title fw-bold text-white mb-0">
                  <i className="bi bi-person-plus me-2 text-primary"></i>
                  Create User Account
                </h6>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowCreateModal(false)}></button>
              </div>

              <form onSubmit={handleCreateSubmit}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Full Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Work Email Address</label>
                    <input
                      type="email"
                      className="form-control"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small fw-semibold text-secondary">System Role</label>
                      <select
                        className="form-select"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      >
                        <option value="USER">Normal User</option>
                        <option value="STOCK_CONTROLLER">Stock Controller</option>
                        <option value="ADMIN">Administrator</option>
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-semibold text-secondary">Department</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small fw-semibold text-secondary">Phone Number</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-semibold text-secondary">Initial Password</label>
                      <input
                        type="password"
                        className="form-control"
                        placeholder="min 6 chars"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-light py-2">
                  <button type="button" className="btn btn-sm btn-secondary" onClick={() => setShowCreateModal(false)} disabled={submitting}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-sm btn-primary" disabled={submitting}>
                    {submitting ? 'Creating...' : 'Create User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-slate-900 text-white" style={{ backgroundColor: '#1e293b' }}>
                <h6 className="modal-title fw-bold text-white mb-0">
                  <i className="bi bi-pencil me-2 text-primary"></i>
                  Edit User: {editingUser.name}
                </h6>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowEditModal(false)}></button>
              </div>

              <form onSubmit={handleEditSubmit}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Full Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editingUser.name}
                      onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small fw-semibold text-secondary">System Role</label>
                      <select
                        className="form-select"
                        value={editingUser.role}
                        onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                      >
                        <option value="USER">Normal User</option>
                        <option value="STOCK_CONTROLLER">Stock Controller</option>
                        <option value="ADMIN">Administrator</option>
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-semibold text-secondary">Account Status</label>
                      <select
                        className="form-select"
                        value={editingUser.isActive ? 'ACTIVE' : 'INACTIVE'}
                        onChange={(e) => setEditingUser({ ...editingUser, isActive: e.target.value === 'ACTIVE' })}
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive / Suspended</option>
                      </select>
                    </div>
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small fw-semibold text-secondary">Department</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editingUser.department || ''}
                        onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-semibold text-secondary">Phone Number</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editingUser.phone || ''}
                        onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-light py-2">
                  <button type="button" className="btn btn-sm btn-secondary" onClick={() => setShowEditModal(false)} disabled={submitting}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-sm btn-primary" disabled={submitting}>
                    {submitting ? 'Updating...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
