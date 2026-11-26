import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

const Login = () => {
  const { login } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanedUsername = username.trim().toLowerCase();
    if (!cleanedUsername || !password) {
      setErrorMsg('Please enter both username and password.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      await login(cleanedUsername, password);
      navigate('/dashboard');
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="d-flex align-items-center justify-content-center min-vh-100 p-3"
      style={{
        backgroundColor: '#0f172a',
        backgroundImage:
          'radial-gradient(circle at 20% 20%, rgba(37, 99, 235, 0.16), transparent 45%), radial-gradient(circle at 80% 80%, rgba(148, 163, 184, 0.10), transparent 45%)'
      }}
    >
      <div
        className="card border-0"
        style={{
          maxWidth: '430px',
          width: '100%',
          borderRadius: '18px',
          overflow: 'hidden',
          boxShadow: '0 24px 48px -12px rgba(2, 6, 23, 0.65)'
        }}
      >
        <div className="card-body p-4 p-sm-5">
          {/* Logo & Heading */}
          <div className="text-center mb-4">
            <div
              className="d-inline-flex align-items-center justify-content-center rounded-4 mb-3"
              style={{
                width: '60px',
                height: '60px',
                backgroundColor: '#f1f5f9',
                border: '1px solid #e2e8f0'
              }}
            >
              <img
                src={settings.logoUrl || '/logo.svg'}
                alt={settings.companyName || 'CineVault'}
                style={{ width: '40px', height: '40px', objectFit: 'contain' }}
                onError={(e) => { e.target.src = '/logo.svg'; }}
              />
            </div>
            <h4 className="fw-bold text-dark mb-1" style={{ letterSpacing: '-0.02em' }}>
              {settings.companyName || 'CineVault Management'}
            </h4>
            <p className="text-muted small mb-0">
              Sign in with your username to access the equipment vault
            </p>
          </div>

          {errorMsg && (
            <div className="alert alert-danger py-2 px-3 small mb-3 d-flex align-items-center gap-2 rounded-3">
              <i className="bi bi-exclamation-triangle-fill flex-shrink-0"></i>
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Username</label>
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-at"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter your username"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
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
                  autoComplete="current-password"
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
              className="btn btn-primary w-100 py-2.5 fw-semibold rounded-3"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span> Authenticating...
                </>
              ) : (
                <>
                  <i className="bi bi-box-arrow-in-right me-2"></i>Sign In to Vault
                </>
              )}
            </button>
          </form>

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
