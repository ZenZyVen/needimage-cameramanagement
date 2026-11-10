import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Profile = () => {
  const { user, updateUserProfile } = useAuth();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    department: user?.department || '',
    phone: user?.phone || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [saving, setSaving] = useState(false);
  const [alertMsg, setAlertMsg] = useState({ type: '', text: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.newPassword) {
      if (formData.newPassword !== formData.confirmPassword) {
        setAlertMsg({ type: 'danger', text: 'New password and confirmation do not match.' });
        return;
      }
      if (!formData.currentPassword) {
        setAlertMsg({ type: 'danger', text: 'Current password is required to change password.' });
        return;
      }
    }

    try {
      setSaving(true);
      setAlertMsg({ type: '', text: '' });

      const payload = {
        name: formData.name,
        department: formData.department,
        phone: formData.phone
      };

      if (formData.newPassword) {
        payload.currentPassword = formData.currentPassword;
        payload.newPassword = formData.newPassword;
      }

      const res = await api.put('/auth/profile', payload);
      if (res.data?.success) {
        updateUserProfile(res.data.user);
        setAlertMsg({ type: 'success', text: 'Profile updated successfully.' });
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
      }
    } catch (err) {
      setAlertMsg({ type: 'danger', text: err.response?.data?.message || 'Error updating profile.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '720px' }}>
      <h4 className="fw-bold text-dark mb-1">My User Profile</h4>
      <p className="text-muted small mb-4">
        Manage your contact details, department assignment, and security settings.
      </p>

      {alertMsg.text && (
        <div className={`alert alert-${alertMsg.type} alert-dismissible fade show py-2 small mb-4`} role="alert">
          {alertMsg.text}
          <button type="button" className="btn-close py-2" onClick={() => setAlertMsg({ type: '', text: '' })}></button>
        </div>
      )}

      <div className="card">
        <div className="card-body p-4">
          {/* User overview header */}
          <div className="d-flex align-items-center gap-3 pb-4 mb-4 border-bottom">
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt={user?.name}
              className="rounded-circle border"
              style={{ width: '64px', height: '64px', objectFit: 'cover' }}
            />
            <div>
              <h5 className="fw-bold text-dark mb-0">{user?.name}</h5>
              <div className="text-muted small">{user?.email}</div>
              <div className="mt-1">
                <span className="badge bg-dark me-2">{user?.role}</span>
                <span className="badge bg-light text-secondary border">{user?.department || 'Production'}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <h6 className="fw-bold text-secondary small text-uppercase mb-3">General Information</h6>

            <div className="mb-3">
              <label className="form-label small fw-semibold text-secondary">Full Name</label>
              <input
                type="text"
                className="form-control"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label className="form-label small fw-semibold text-secondary">Department / Crew</label>
                <input
                  type="text"
                  className="form-control"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-semibold text-secondary">Phone Number</label>
                <input
                  type="text"
                  className="form-control"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </div>

            <h6 className="fw-bold text-secondary small text-uppercase mb-3 pt-3 border-top">
              Change Password (Leave blank to keep current)
            </h6>

            <div className="mb-3">
              <label className="form-label small fw-semibold text-secondary">Current Password</label>
              <input
                type="password"
                className="form-control"
                name="currentPassword"
                placeholder="••••••••"
                value={formData.currentPassword}
                onChange={handleChange}
              />
            </div>

            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label className="form-label small fw-semibold text-secondary">New Password</label>
                <input
                  type="password"
                  className="form-control"
                  name="newPassword"
                  placeholder="min 6 characters"
                  value={formData.newPassword}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-semibold text-secondary">Confirm New Password</label>
                <input
                  type="password"
                  className="form-control"
                  name="confirmPassword"
                  placeholder="re-type password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Updating Profile...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
