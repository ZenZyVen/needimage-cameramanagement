import React, { useState, useRef } from 'react';
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

  const [signatureUrl, setSignatureUrl] = useState(user?.signatureUrl || '');
  const [profilePhoto, setProfilePhoto] = useState(user?.profilePhoto || user?.avatar || '');
  const [uploadingSignature, setUploadingSignature] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Drawing signature canvas
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showCanvas, setShowCanvas] = useState(false);

  const [saving, setSaving] = useState(false);
  const [alertMsg, setAlertMsg] = useState({ type: '', text: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Profile photo upload
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const data = new FormData();
    data.append('avatar', file);

    try {
      setUploadingPhoto(true);
      const res = await api.post('/auth/upload-avatar', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.success) {
        setProfilePhoto(res.data.profilePhoto);
        updateUserProfile({ ...user, profilePhoto: res.data.profilePhoto, avatar: res.data.profilePhoto });
        setAlertMsg({ type: 'success', text: 'Profile photo updated successfully!' });
      }
    } catch (err) {
      setAlertMsg({ type: 'danger', text: err.response?.data?.message || 'Error uploading photo.' });
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Signature image file upload
  const handleSignatureUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const data = new FormData();
    data.append('signature', file);

    try {
      setUploadingSignature(true);
      const res = await api.post('/auth/upload-signature', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.success) {
        setSignatureUrl(res.data.signatureUrl);
        updateUserProfile({ ...user, signatureUrl: res.data.signatureUrl });
        setAlertMsg({ type: 'success', text: 'Inspector signature uploaded and saved!' });
      }
    } catch (err) {
      setAlertMsg({ type: 'danger', text: err.response?.data?.message || 'Error uploading signature.' });
    } finally {
      setUploadingSignature(false);
    }
  };

  // Delete signature
  const handleDeleteSignature = async () => {
    if (window.confirm('Delete your saved inspector signature?')) {
      try {
        await api.put('/auth/profile', { signatureUrl: null });
        setSignatureUrl('');
        updateUserProfile({ ...user, signatureUrl: null });
        setAlertMsg({ type: 'info', text: 'Signature removed from your profile.' });
      } catch (err) {
        setAlertMsg({ type: 'danger', text: 'Could not delete signature.' });
      }
    }
  };

  // Canvas drawing handlers
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveCanvasSignature = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');

    try {
      setSaving(true);
      await api.put('/auth/profile', { signatureUrl: dataUrl });
      setSignatureUrl(dataUrl);
      updateUserProfile({ ...user, signatureUrl: dataUrl });
      setShowCanvas(false);
      setAlertMsg({ type: 'success', text: 'Drawn signature saved to your inspector profile!' });
    } catch (err) {
      setAlertMsg({ type: 'danger', text: 'Failed to save drawn signature.' });
    } finally {
      setSaving(false);
    }
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
        setAlertMsg({ type: 'success', text: 'Profile details saved successfully.' });
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

  // Get user initials
  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'IV';

  return (
    <div style={{ maxWidth: '820px' }}>
      <h4 className="fw-bold text-dark mb-1">Inspector & User Profile</h4>
      <p className="text-muted small mb-4">
        Manage your contact credentials, profile photo, and official Vault Inspector signature.
      </p>

      {alertMsg.text && (
        <div className={`alert alert-${alertMsg.type} alert-dismissible fade show py-2 small mb-4`} role="alert">
          {alertMsg.text}
          <button type="button" className="btn-close py-2" onClick={() => setAlertMsg({ type: '', text: '' })}></button>
        </div>
      )}

      {/* Profile Overview & Photo Upload */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-4">
          <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 pb-4 mb-4 border-bottom">
            <div className="d-flex align-items-center gap-3">
              <div className="position-relative">
                <img
                  src={profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                  alt={user?.name}
                  className="rounded-circle border shadow-sm"
                  style={{ width: '74px', height: '74px', objectFit: 'cover' }}
                />
                <label
                  className="position-absolute bottom-0 end-0 bg-primary text-white rounded-circle p-1 cursor-pointer shadow"
                  style={{ width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="Upload profile photo"
                >
                  <i className="bi bi-camera-fill" style={{ fontSize: '0.75rem' }}></i>
                  <input
                    type="file"
                    accept="image/*"
                    className="d-none"
                    onChange={handlePhotoUpload}
                    disabled={uploadingPhoto}
                  />
                </label>
              </div>

              <div>
                <h5 className="fw-bold text-dark mb-0">{user?.name}</h5>
                <div className="text-muted small">{user?.email}</div>
                <div className="mt-1 d-flex gap-2">
                  <span className="badge bg-slate-900 text-white">{user?.role}</span>
                  <span className="badge bg-light text-secondary border">{user?.department || 'Production Team'}</span>
                </div>
              </div>
            </div>

            <div className="text-sm-end">
              <span className="text-muted small d-block">Inspector Initials</span>
              <div
                className="badge bg-primary-subtle text-primary border border-primary-subtle fw-bold fs-6 px-3 py-2"
                style={{ letterSpacing: '0.1em' }}
              >
                {initials}
              </div>
            </div>
          </div>

          {/* SECTION: Vault Inspector Signature / Initials */}
          <div className="p-3 border rounded bg-light mb-4">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-3">
              <div>
                <h6 className="fw-bold text-dark mb-0">
                  <i className="bi bi-pen-fill text-primary me-2"></i>
                  Vault Inspector Official Signature / Initials
                </h6>
                <p className="text-muted small mb-0" style={{ fontSize: '0.75rem' }}>
                  Automatically stamped onto Check-in/Check-out inspection records, handover sheets, and Inventory Audit Reports.
                </p>
              </div>

              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setShowCanvas(!showCanvas)}
                >
                  <i className="bi bi-brush me-1"></i> {showCanvas ? 'Close Pad' : 'Draw Signature'}
                </button>

                <label className="btn btn-sm btn-outline-primary cursor-pointer mb-0">
                  <i className="bi bi-upload me-1"></i>
                  {uploadingSignature ? 'Uploading...' : 'Upload Image'}
                  <input
                    type="file"
                    accept="image/*"
                    className="d-none"
                    onChange={handleSignatureUpload}
                    disabled={uploadingSignature}
                  />
                </label>

                {signatureUrl && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    title="Delete signature"
                    onClick={handleDeleteSignature}
                  >
                    <i className="bi bi-trash"></i>
                  </button>
                )}
              </div>
            </div>

            {/* Signature Preview Box */}
            <div
              className="border rounded p-3 bg-white text-center d-flex align-items-center justify-content-center"
              style={{ minHeight: '100px', backgroundColor: '#fff' }}
            >
              {signatureUrl ? (
                <div className="d-inline-block">
                  <img
                    src={signatureUrl}
                    alt="Inspector Signature"
                    style={{ maxHeight: '75px', maxWidth: '100%', objectFit: 'contain' }}
                  />
                  <div className="small text-muted mt-1" style={{ fontSize: '0.7rem' }}>
                    Certified Signature of {user?.name}
                  </div>
                </div>
              ) : (
                <div className="text-muted small py-2">
                  <i className="bi bi-pencil-square me-1"></i> No signature registered. Upload an image or draw one above to auto-display on inspection receipts.
                </div>
              )}
            </div>

            {/* Draw Pad Canvas if opened */}
            {showCanvas && (
              <div className="mt-3 p-3 bg-white border rounded">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="small fw-semibold text-secondary">Sign using mouse or stylus:</span>
                  <button type="button" className="btn btn-sm btn-link text-muted p-0" onClick={clearCanvas}>
                    Clear Pad
                  </button>
                </div>
                <div className="border rounded bg-light mb-2 text-center">
                  <canvas
                    ref={canvasRef}
                    width={500}
                    height={120}
                    style={{ width: '100%', height: '120px', cursor: 'crosshair', display: 'block' }}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                  />
                </div>
                <div className="d-flex justify-content-end gap-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    onClick={() => setShowCanvas(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={saveCanvasSignature}
                    disabled={saving}
                  >
                    <i className="bi bi-check-lg me-1"></i> Save Drawn Signature
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Form: General Information */}
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
                <label className="form-label small fw-semibold text-secondary">Department / Crew Unit</label>
                <input
                  type="text"
                  className="form-control"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-semibold text-secondary">Contact Phone</label>
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
              Change Security Password (Leave blank to keep current)
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
                  placeholder="Minimum 6 characters"
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
                  placeholder="Re-type new password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
