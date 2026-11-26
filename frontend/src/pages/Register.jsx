import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import DepartmentSelect from '../components/common/DepartmentSelect';

const DEFAULT_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80'
];

const Register = () => {
  const { register } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    department: 'Cinematography',
    phone: '',
    profilePhoto: DEFAULT_AVATARS[0]
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'username') {
      const cleaned = value.toLowerCase().replace(/[^a-z0-9._-]/g, '');
      setFormData(prev => ({ ...prev, username: cleaned }));
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCustomPhoto = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setFormData(prev => ({ ...prev, profilePhoto: ev.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.username || !formData.email || !formData.password) {
      setErrorMsg('Full name, username, email, and password are required.');
      return;
    }

    if (formData.username.length < 3) {
      setErrorMsg('Username must be at least 3 characters.');
      return;
    }

    if (formData.password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      await register(formData);
      navigate('/dashboard');
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="d-flex align-items-center justify-content-center min-vh-100 p-3"
      style={{ backgroundColor: '#0f172a' }}
    >
      <div className="card shadow-lg border-0" style={{ maxWidth: '500px', width: '100%', borderRadius: '16px', overflow: 'hidden' }}>
        <div className="card-body p-4 p-sm-5">
          <div className="text-center mb-4">
            <img
              src={settings.logoUrl || '/logo.svg'}
              alt={settings.companyName || 'CineVault'}
              style={{ width: '48px', height: '48px', objectFit: 'contain' }}
              className="mb-2"
              onError={(e) => { e.target.src = '/logo.svg'; }}
            />
            <h4 className="fw-bold text-dark mb-1">Create CineVault Account</h4>
            <p className="text-muted small">Register for equipment loans and production vault access</p>
          </div>

          {errorMsg && (
            <div className="alert alert-danger py-2 px-3 small mb-3 d-flex align-items-center gap-2">
              <i className="bi bi-exclamation-triangle-fill"></i>
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Profile Photo Selection */}
            <div className="text-center mb-3">
              <div className="position-relative d-inline-block">
                <img
                  src={formData.profilePhoto}
                  alt="Avatar"
                  className="rounded-circle border shadow-sm mb-2"
                  style={{ width: '64px', height: '64px', objectFit: 'cover' }}
                />
                <label
                  className="position-absolute bottom-0 end-0 bg-primary text-white rounded-circle p-1 cursor-pointer shadow"
                  style={{ width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="Upload custom photo"
                >
                  <i className="bi bi-camera-fill" style={{ fontSize: '0.65rem' }}></i>
                  <input
                    type="file"
                    accept="image/*"
                    className="d-none"
                    onChange={handleCustomPhoto}
                  />
                </label>
              </div>
              <div className="d-flex justify-content-center gap-2">
                {DEFAULT_AVATARS.map((av, idx) => (
                  <img
                    key={idx}
                    src={av}
                    alt={`Avatar ${idx + 1}`}
                    className={`rounded-circle cursor-pointer border ${formData.profilePhoto === av ? 'border-primary border-2 shadow-sm' : ''}`}
                    style={{ width: '28px', height: '28px', objectFit: 'cover' }}
                    onClick={() => setFormData(prev => ({ ...prev, profilePhoto: av }))}
                  />
                ))}
              </div>
            </div>

            <div className="row g-3 mb-3 align-items-end">
              <div className="col-12 col-sm-6 d-flex flex-column justify-content-end">
                <label className="form-label small fw-semibold text-secondary">Full Name</label>
                <div className="input-group">
                  <span className="input-group-text bg-white"><i className="bi bi-person text-muted"></i></span>
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="col-12 col-sm-6 d-flex flex-column justify-content-end">
                <label className="form-label small fw-semibold text-secondary">Username</label>
                <div className="input-group">
                  <span className="input-group-text bg-white"><i className="bi bi-at text-muted"></i></span>
                  <input
                    type="text"
                    className="form-control font-monospace"
                    name="username"
                    placeholder="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    value={formData.username}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label small fw-semibold text-secondary">Work Email Address</label>
              <div className="input-group">
                <span className="input-group-text bg-white"><i className="bi bi-envelope text-muted"></i></span>
                <input
                  type="email"
                  className="form-control"
                  name="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="row g-3 mb-3 align-items-end">
              <div className="col-12 col-sm-6 d-flex flex-column justify-content-end">
                <label className="form-label small fw-semibold text-secondary">Department</label>
                <DepartmentSelect
                  value={formData.department}
                  onChange={(val) => setFormData(prev => ({ ...prev, department: val }))}
                />
              </div>
              <div className="col-12 col-sm-6 d-flex flex-column justify-content-end">
                <label className="form-label small fw-semibold text-secondary">Phone Number</label>
                <input
                  type="text"
                  className="form-control"
                  name="phone"
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label small fw-semibold text-secondary">Password (min 6 characters)</label>
              <div className="input-group">
                <span className="input-group-text bg-white"><i className="bi bi-lock text-muted"></i></span>
                <input
                  type="password"
                  className="form-control"
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100 py-2.5 fw-semibold"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span> Creating Account...
                </>
              ) : (
                'Create Account & Access Vault'
              )}
            </button>
          </form>

          <div className="text-center mt-4">
            <span className="text-muted small">Already have an account? </span>
            <Link to="/login" className="small fw-semibold text-primary text-decoration-none">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
