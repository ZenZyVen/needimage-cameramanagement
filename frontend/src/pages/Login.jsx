import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Invalid login credentials.');
    } finally {
      setLoading(false);
    }
  };

  // 1-Click Demo Login Shortcuts for rapid evaluation of all 3 roles
  const handleQuickLogin = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setLoading(true);
    setErrorMsg('');
    login(demoEmail, demoPassword)
      .then(() => navigate('/dashboard'))
      .catch((err) => {
        setErrorMsg(err.response?.data?.message || err.message || 'Login failed. Please verify database connection.');
      })
      .finally(() => setLoading(false));
  };

  return (
    <div
      className="d-flex align-items-center justify-content-center min-vh-100 p-3"
      style={{ backgroundColor: '#0f172a' }}
    >
      <div className="card shadow-lg border-0" style={{ maxWidth: '440px', width: '100%', borderRadius: '16px', overflow: 'hidden' }}>
        <div className="card-body p-4 p-sm-5">
          {/* Logo & Heading */}
          <div className="text-center mb-4">
            <img src="/logo.svg" alt="CineVault" style={{ width: '56px', height: '56px' }} className="mb-2" />
            <h4 className="fw-bold text-dark mb-1">CineVault Management</h4>
            <p className="text-muted small">Professional Camera Equipment & Logistics System</p>
          </div>

          {errorMsg && (
            <div className="alert alert-danger py-2 px-3 small mb-3 d-flex align-items-center gap-2">
              <i className="bi bi-exclamation-triangle-fill"></i>
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Work Email Address</label>
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-envelope"></i>
                </span>
                <input
                  type="email"
                  className="form-control"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label">Password</label>
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-lock"></i>
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  style={{ borderLeft: 'none' }}
                >
                  <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100 py-2.5 fw-semibold"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span> Authenticating...
                </>
              ) : (
                'Sign In to Vault'
              )}
            </button>
          </form>

          {/* 1-Click Role Switcher Demo Box */}
          <div className="mt-4 pt-3 border-top">
            <span className="text-muted small d-block mb-2 text-center fw-medium" style={{ fontSize: '0.75rem' }}>
              One-Click Role Demonstration Accounts:
            </span>
            <div className="d-flex flex-column gap-1.5">
              <button
                type="button"
                className="btn btn-sm btn-outline-dark d-flex justify-content-between align-items-center py-2"
                style={{ fontSize: '0.78rem' }}
                onClick={() => handleQuickLogin('admin@cameragear.com', 'password123')}
                disabled={loading}
              >
                <span><i className="bi bi-shield-lock me-1"></i> Admin (Sarah Connor)</span>
                <span className="badge bg-dark">ADMIN</span>
              </button>

              <button
                type="button"
                className="btn btn-sm btn-outline-secondary d-flex justify-content-between align-items-center py-2"
                style={{ fontSize: '0.78rem' }}
                onClick={() => handleQuickLogin('stock@cameragear.com', 'password123')}
                disabled={loading}
              >
                <span><i className="bi bi-box-seam me-1"></i> Stock Controller (Marcus Vance)</span>
                <span className="badge bg-secondary">STOCK</span>
              </button>

              <button
                type="button"
                className="btn btn-sm btn-outline-primary d-flex justify-content-between align-items-center py-2"
                style={{ fontSize: '0.78rem' }}
                onClick={() => handleQuickLogin('user@cameragear.com', 'password123')}
                disabled={loading}
              >
                <span><i className="bi bi-camera me-1"></i> Normal User (David Kim)</span>
                <span className="badge bg-primary">USER</span>
              </button>
            </div>
          </div>

          <div className="text-center mt-4">
            <span className="text-muted small">Need an account? </span>
            <Link to="/register" className="small fw-semibold text-primary text-decoration-none">
              Register here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
