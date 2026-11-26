import React, { useState, useEffect } from 'react';
import { getUsers, createUser, updateUser, deleteUser } from '../services/userService';
import { formatDate } from '../utils/formatters';
import DepartmentSelect from '../components/common/DepartmentSelect';

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
    username: '',
    email: '',
    password: '',
    role: 'USER',
    roleNote: '',
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
      await createUser({
        ...formData,
        username: formData.username.trim().toLowerCase()
      });
      setAlertMsg({ type: 'success', text: `User "${formData.name}" (@${formData.username.trim().toLowerCase()}) created successfully.` });
      setShowCreateModal(false);
      setFormData({
        name: '',
        username: '',
        email: '',
        password: '',
        role: 'USER',
        roleNote: '',
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
      const payload = {
        name: editingUser.name,
        username: editingUser.username?.trim().toLowerCase(),
        role: editingUser.role,
        roleNote: editingUser.roleNote,
        department: editingUser.department,
        phone: editingUser.phone,
        isActive: editingUser.isActive
      };
      if (editingUser.password && editingUser.password.trim() !== '') {
        payload.password = editingUser.password.trim();
      }
      await updateUser(editingUser.id, payload);
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
      case 'STOCK_MANAGEMENT':
      case 'STOCK_CONTROLLER':
        return <span className="badge bg-secondary">STOCK MANAGEMENT</span>;
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
          <h4 className="fw-bold text-dark mb-0">User & Role Access</h4>
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
                  placeholder="Search by name, username, email, or department..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={() => setSearch('')}
                  >
                    <i className="bi bi-x-lg"></i>
                  </button>
                )}
              </div>
            </div>

            <div className="col-md-5">
              <select
                className="form-select"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="ALL">All Roles</option>
                <option value="ADMIN">Admin</option>
                <option value="STOCK_MANAGEMENT">Stock Management</option>
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
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table table-custom align-middle">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Role Note / Who They Are</th>
                  <th>Department</th>
                  <th>Phone</th>
                  <th>Loans</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        <span className="fw-bold text-dark">{u.name}</span>
                        {u.username && (
                          <span className="badge bg-primary-subtle text-primary border border-primary-subtle font-monospace" style={{ fontSize: '0.72rem' }}>
                            @{u.username}
                          </span>
                        )}
                      </div>
                      <div className="small text-muted">{u.email}</div>
                    </td>
                    <td>{getRoleBadge(u.role)}</td>
                    <td>
                      <div className="small text-dark fw-medium" style={{ fontSize: '0.82rem' }}>
                        {u.roleNote || <span className="text-muted fst-italic">No role note</span>}
                      </div>
                    </td>
                    <td>
                      <span className="badge bg-light text-secondary border">
                        {u.department || 'Production'}
                      </span>
                    </td>
                    <td className="small font-monospace">{u.phone || '—'}</td>
                    <td>
                      <span className="badge bg-light text-secondary border">
                        {u._count?.borrowRequests || 0} loan(s)
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${u.isActive ? 'badge-status-available' : 'badge-status-damaged'}`}>
                        {u.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          title="Edit User & Role Notes"
                          onClick={() => {
                            setEditingUser(u);
                            setShowEditModal(true);
                          }}
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-danger"
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
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-slate-900 text-white" style={{ backgroundColor: '#0f172a' }}>
                <div className="d-flex align-items-center gap-2">
                  <div className="p-2 rounded bg-primary-subtle text-primary d-flex align-items-center justify-content-center" style={{ width: 34, height: 34 }}>
                    <i className="bi bi-person-plus-fill"></i>
                  </div>
                  <h6 className="modal-title fw-bold text-white mb-0">Create User Account</h6>
                </div>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setShowCreateModal(false)}
                  aria-label="Close"
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>

              <form onSubmit={handleCreateSubmit}>
                <div className="modal-body p-4" style={{ maxHeight: '74vh', overflowY: 'auto' }}>
                  <div className="form-section-card">
                    <div className="form-section-title">
                      <i className="bi bi-person-badge text-primary"></i> 1. Identity & Credentials
                    </div>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">Full Name</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Full Name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Username (for Login)</label>
                        <div className="input-group">
                          <span className="input-group-text"><i className="bi bi-at"></i></span>
                          <input
                            type="text"
                            className="form-control font-monospace"
                            placeholder="username"
                            autoCapitalize="none"
                            spellCheck={false}
                            value={formData.username}
                            onChange={(e) => setFormData({
                              ...formData,
                              username: e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, '')
                            })}
                            required
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Email Address</label>
                        <input
                          type="email"
                          className="form-control"
                          placeholder="Email Address"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Initial Password</label>
                        <input
                          type="password"
                          className="form-control"
                          placeholder="Temporary Password (min 6 chars)"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Phone Number</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Phone Number"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-section-card mb-0">
                    <div className="form-section-title">
                      <i className="bi bi-shield-lock text-primary"></i> 2. Role & Personnel Notes
                    </div>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">System Role</label>
                        <select
                          className="form-select"
                          value={formData.role}
                          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        >
                          <option value="USER">Normal User</option>
                          <option value="STOCK_MANAGEMENT">Stock Management</option>
                          <option value="ADMIN">Administrator</option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Department</label>
                        <DepartmentSelect
                          value={formData.department}
                          onChange={(val) => setFormData({ ...formData, department: val })}
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label">Role Note / Who They Are (Staff Reminder)</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Staff reminder notes (optional)"
                          value={formData.roleNote}
                          onChange={(e) => setFormData({ ...formData, roleNote: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-light py-3 d-flex justify-content-end gap-2">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowCreateModal(false)} disabled={submitting}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Creating...' : 'Create Account'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-slate-900 text-white" style={{ backgroundColor: '#0f172a' }}>
                <div className="d-flex align-items-center gap-2">
                  <div className="p-2 rounded bg-primary-subtle text-primary d-flex align-items-center justify-content-center" style={{ width: 34, height: 34 }}>
                    <i className="bi bi-pencil-square"></i>
                  </div>
                  <h6 className="modal-title fw-bold text-white mb-0">Edit User: {editingUser.name}</h6>
                </div>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setShowEditModal(false)}
                  aria-label="Close"
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>

              <form onSubmit={handleEditSubmit}>
                <div className="modal-body p-4" style={{ maxHeight: '74vh', overflowY: 'auto' }}>
                  <div className="form-section-card">
                    <div className="form-section-title">
                      <i className="bi bi-person-gear text-primary"></i> 1. Profile & Status
                    </div>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">Full Name</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editingUser.name}
                          onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Username (for Login)</label>
                        <div className="input-group">
                          <span className="input-group-text"><i className="bi bi-at"></i></span>
                          <input
                            type="text"
                            className="form-control font-monospace"
                            autoCapitalize="none"
                            spellCheck={false}
                            value={editingUser.username || ''}
                            onChange={(e) => setEditingUser({
                              ...editingUser,
                              username: e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, '')
                            })}
                            required
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Account Status</label>
                        <select
                          className="form-select"
                          value={editingUser.isActive ? 'ACTIVE' : 'INACTIVE'}
                          onChange={(e) => setEditingUser({ ...editingUser, isActive: e.target.value === 'ACTIVE' })}
                        >
                          <option value="ACTIVE">Active</option>
                          <option value="INACTIVE">Inactive / Suspended</option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Department</label>
                        <DepartmentSelect
                          value={editingUser.department || ''}
                          onChange={(val) => setEditingUser({ ...editingUser, department: val })}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Phone Number</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Phone Number"
                          value={editingUser.phone || ''}
                          onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-section-card mb-0">
                    <div className="form-section-title">
                      <i className="bi bi-shield-shaded text-primary"></i> 2. System Role & Staff Notes
                    </div>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">System Role</label>
                        <select
                          className="form-select"
                          value={editingUser.role}
                          onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                        >
                          <option value="USER">Normal User</option>
                          <option value="STOCK_MANAGEMENT">Stock Management</option>
                          <option value="ADMIN">Administrator</option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Reset Password (Optional)</label>
                        <input
                          type="password"
                          className="form-control"
                          placeholder="Leave blank to keep current password"
                          value={editingUser.password || ''}
                          onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label">Role Note / Who They Are (Staff Reminder)</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Staff reminder notes (optional)"
                          value={editingUser.roleNote || ''}
                          onChange={(e) => setEditingUser({ ...editingUser, roleNote: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-light py-3 d-flex justify-content-end gap-2">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowEditModal(false)} disabled={submitting}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
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
