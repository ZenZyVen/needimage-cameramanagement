import React, { useState, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';
import { getAuditLogs, exportBackup, uploadLogo } from '../services/settingsService';
import { getCategories, createCategory, deleteCategory } from '../services/equipmentService';
import { formatDate, formatDateTime } from '../utils/formatters';

const POPULAR_ICONS = [
  { icon: 'bi-camera-reels', label: 'Cameras' },
  { icon: 'bi-disc', label: 'Lenses' },
  { icon: 'bi-lightbulb', label: 'Lighting' },
  { icon: 'bi-soundwave', label: 'Audio' },
  { icon: 'bi-mic', label: 'Microphones' },
  { icon: 'bi-triangle', label: 'Tripods' },
  { icon: 'bi-joystick', label: 'Gimbals' },
  { icon: 'bi-send', label: 'Drones' },
  { icon: 'bi-display', label: 'Monitors' },
  { icon: 'bi-broadcast', label: 'Broadcasting' },
  { icon: 'bi-camera-video', label: 'Streaming' },
  { icon: 'bi-diagram-2', label: 'Cables' },
  { icon: 'bi-battery-charging', label: 'Batteries' },
  { icon: 'bi-sd-card', label: 'Memory Cards' },
  { icon: 'bi-laptop', label: 'Computers' },
  { icon: 'bi-device-ssd', label: 'Storage Devices' },
  { icon: 'bi-gear-wide-connected', label: 'Accessories' }
];

const Settings = () => {
  const { settings, updateSettings, refreshSettings } = useSettings();
  const [activeTab, setActiveTab] = useState('branding');

  // Form states
  const [formData, setFormData] = useState({ ...settings });
  const [saving, setSaving] = useState(false);
  const [alertMsg, setAlertMsg] = useState({ type: '', text: '' });

  // Categories
  const [categories, setCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('bi-camera');

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [auditFilter, setAuditFilter] = useState('ALL');

  // Logo upload
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({ ...settings });
    }
  }, [settings]);

  useEffect(() => {
    if (activeTab === 'categories') {
      loadCategories();
    } else if (activeTab === 'audit') {
      loadAuditLogs();
    }
  }, [activeTab, auditFilter]);

  const loadCategories = async () => {
    try {
      setLoadingCats(true);
      const res = await getCategories();
      if (res.data?.success) {
        setCategories(res.data.data || []);
      }
    } catch (err) {
      console.warn(err);
    } finally {
      setLoadingCats(false);
    }
  };

  const loadAuditLogs = async () => {
    try {
      setLoadingLogs(true);
      const res = await getAuditLogs({ action: auditFilter !== 'ALL' ? auditFilter : undefined, limit: 100 });
      if (res.data?.success) {
        setAuditLogs(res.data.data || []);
      }
    } catch (err) {
      console.warn(err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSaveBrandingAndRules = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setAlertMsg({ type: '', text: '' });
      await updateSettings(formData);
      setAlertMsg({ type: 'success', text: 'System settings & company branding updated successfully!' });
      refreshSettings();
    } catch (err) {
      setAlertMsg({ type: 'danger', text: err.response?.data?.message || 'Error updating settings.' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append('logo', file);

    try {
      setUploadingLogo(true);
      const res = await uploadLogo(uploadData);
      if (res.data?.success) {
        setFormData(prev => ({ ...prev, logoUrl: res.data.logoUrl }));
        await updateSettings({ ...formData, logoUrl: res.data.logoUrl });
        setAlertMsg({ type: 'success', text: 'Company logo uploaded and updated throughout the system!' });
        refreshSettings();
      }
    } catch (err) {
      setAlertMsg({ type: 'danger', text: err.response?.data?.message || 'Failed to upload logo.' });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      await createCategory({
        name: newCatName.trim(),
        description: newCatDesc.trim(),
        icon: newCatIcon
      });
      setNewCatName('');
      setNewCatDesc('');
      loadCategories();
      setAlertMsg({ type: 'success', text: 'New equipment category added.' });
    } catch (err) {
      setAlertMsg({ type: 'danger', text: err.response?.data?.message || 'Failed to add category.' });
    }
  };

  const handleDeleteCategory = async (id, name) => {
    if (window.confirm(`Delete category "${name}"? Only empty categories can be deleted.`)) {
      try {
        await deleteCategory(id);
        loadCategories();
        setAlertMsg({ type: 'success', text: `Category "${name}" removed.` });
      } catch (err) {
        setAlertMsg({ type: 'danger', text: err.response?.data?.message || 'Could not delete category.' });
      }
    }
  };

  const handleExportBackup = async () => {
    try {
      const res = await exportBackup();
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cinevault-full-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setAlertMsg({ type: 'danger', text: 'Failed to generate database backup.' });
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-2">
        <div>
          <h4 className="fw-bold text-dark mb-1">Centralized System Settings & Control Panel</h4>
          <p className="text-muted small mb-0">
            Control company branding, logo, production categories, borrowing limits, stock thresholds, and audit trails.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
          onClick={handleExportBackup}
        >
          <i className="bi bi-download"></i>
          <span>Export System Backup (JSON)</span>
        </button>
      </div>

      {alertMsg.text && (
        <div className={`alert alert-${alertMsg.type} alert-dismissible fade show py-2 small mb-4`} role="alert">
          {alertMsg.text}
          <button type="button" className="btn-close py-2" onClick={() => setAlertMsg({ type: '', text: '' })}></button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="card mb-4 border-0 shadow-sm">
        <div className="card-body p-2 bg-light rounded">
          <ul className="nav nav-pills gap-1">
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link small py-2 px-3 fw-medium ${activeTab === 'branding' ? 'active' : 'text-dark'}`}
                onClick={() => setActiveTab('branding')}
              >
                <i className="bi bi-building me-1"></i> Company Profile & Branding
              </button>
            </li>
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link small py-2 px-3 fw-medium ${activeTab === 'categories' ? 'active' : 'text-dark'}`}
                onClick={() => setActiveTab('categories')}
              >
                <i className="bi bi-tags me-1"></i> Media Categories ({categories.length || 17})
              </button>
            </li>
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link small py-2 px-3 fw-medium ${activeTab === 'rules' ? 'active' : 'text-dark'}`}
                onClick={() => setActiveTab('rules')}
              >
                <i className="bi bi-sliders me-1"></i> Borrowing & Stock Rules
              </button>
            </li>
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link small py-2 px-3 fw-medium ${activeTab === 'audit' ? 'active' : 'text-dark'}`}
                onClick={() => setActiveTab('audit')}
              >
                <i className="bi bi-shield-check me-1"></i> Audit Logs
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* TAB 1: Company Profile & Branding */}
      {activeTab === 'branding' && (
        <div className="card border-0 shadow-sm">
          <div className="card-body p-4">
            <form onSubmit={handleSaveBrandingAndRules}>
              <div className="row g-4">
                {/* Logo & Identity */}
                <div className="col-md-4 text-center border-end">
                  <h6 className="fw-bold text-secondary small text-uppercase mb-3">Company Logo</h6>
                  <div
                    className="border rounded p-3 bg-light d-flex align-items-center justify-content-center mx-auto mb-3"
                    style={{ width: '160px', height: '160px', overflow: 'hidden' }}
                  >
                    <img
                      src={formData.logoUrl || '/logo.svg'}
                      alt="Company Logo"
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                      onError={(e) => { e.target.src = '/logo.svg'; }}
                    />
                  </div>
                  <label className="btn btn-sm btn-outline-primary d-inline-block cursor-pointer">
                    <i className="bi bi-upload me-1"></i>
                    {uploadingLogo ? 'Uploading...' : 'Upload New Logo'}
                    <input
                      type="file"
                      accept="image/*"
                      className="d-none"
                      onChange={handleLogoUpload}
                      disabled={uploadingLogo}
                    />
                  </label>
                  <p className="small text-muted mt-2 mb-0" style={{ fontSize: '0.72rem' }}>
                    PNG, SVG, or JPEG. Appears on dashboard, reports, and asset labels.
                  </p>
                </div>

                {/* Company Information */}
                <div className="col-md-8">
                  <h6 className="fw-bold text-secondary small text-uppercase mb-3">Organization Details</h6>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Company / Studio Name</label>
                    <input
                      type="text"
                      className="form-control"
                      name="companyName"
                      value={formData.companyName || ''}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Studio Tagline</label>
                    <input
                      type="text"
                      className="form-control"
                      name="companyTagline"
                      value={formData.companyTagline || ''}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Physical Studio Address</label>
                    <input
                      type="text"
                      className="form-control"
                      name="address"
                      value={formData.address || ''}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-secondary">Contact Phone</label>
                      <input
                        type="text"
                        className="form-control"
                        name="phone"
                        value={formData.phone || ''}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-secondary">Operations Email</label>
                      <input
                        type="email"
                        className="form-control"
                        name="email"
                        value={formData.email || ''}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-secondary">Website URL</label>
                      <input
                        type="text"
                        className="form-control"
                        name="website"
                        value={formData.website || ''}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-secondary">Currency Code</label>
                      <input
                        type="text"
                        className="form-control"
                        name="currency"
                        value={formData.currency || 'USD'}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Saving Changes...' : 'Save Company Profile'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: Equipment Categories */}
      {activeTab === 'categories' && (
        <div className="row g-4">
          <div className="col-md-5">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                <h6 className="fw-bold text-dark mb-1">Add Media Category</h6>
                <p className="text-muted small mb-3">Register new gear classifications with custom modern icons.</p>

                <form onSubmit={handleAddCategory}>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Category Name</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Action Cameras, Anamorphic Glass"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Description</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      placeholder="Category scope and gear description"
                      value={newCatDesc}
                      onChange={(e) => setNewCatDesc(e.target.value)}
                    ></textarea>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Category Icon</label>
                    <div className="d-flex flex-wrap gap-2 p-2 border rounded bg-light" style={{ maxHeight: '140px', overflowY: 'auto' }}>
                      {POPULAR_ICONS.map((item) => (
                        <button
                          key={item.icon}
                          type="button"
                          className={`btn btn-sm ${newCatIcon === item.icon ? 'btn-primary' : 'btn-outline-secondary'}`}
                          title={item.label}
                          onClick={() => setNewCatIcon(item.icon)}
                        >
                          <i className={`bi ${item.icon}`}></i>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary w-100">
                    <i className="bi bi-plus-lg me-1"></i> Add Category
                  </button>
                </form>
              </div>
            </div>
          </div>

          <div className="col-md-7">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="fw-bold text-dark mb-0">Active Media Categories</h6>
                  <span className="badge bg-light text-secondary border">{categories.length} categories</span>
                </div>

                {loadingCats ? (
                  <div className="text-center py-4">
                    <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0" style={{ fontSize: '9pt' }}>
                      <thead className="table-light">
                        <tr>
                          <th>Icon</th>
                          <th>Category Name</th>
                          <th>Description</th>
                          <th>Units</th>
                          <th className="text-end">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categories.map((cat) => (
                          <tr key={cat.id}>
                            <td style={{ width: '40px' }}>
                              <div className="p-2 rounded bg-light text-primary d-inline-flex align-items-center justify-content-center" style={{ width: 32, height: 32 }}>
                                <i className={`bi ${cat.icon || 'bi-camera'}`}></i>
                              </div>
                            </td>
                            <td className="fw-bold text-dark">{cat.name}</td>
                            <td className="text-muted small text-truncate" style={{ maxWidth: '180px' }}>
                              {cat.description || '—'}
                            </td>
                            <td>
                              <span className="badge bg-light text-dark border">
                                {cat._count?.equipment ?? 0}
                              </span>
                            </td>
                            <td className="text-end">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger py-0 px-2"
                                title="Remove empty category"
                                onClick={() => handleDeleteCategory(cat.id, cat.name)}
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Borrowing Rules & Stock Settings */}
      {activeTab === 'rules' && (
        <div className="card border-0 shadow-sm">
          <div className="card-body p-4">
            <form onSubmit={handleSaveBrandingAndRules}>
              <div className="row g-4">
                {/* Borrowing Rules */}
                <div className="col-md-6 border-end">
                  <h6 className="fw-bold text-secondary small text-uppercase mb-3">Borrowing Rules</h6>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Default Maximum Loan Duration (Days)</label>
                    <input
                      type="number"
                      min="1"
                      max="90"
                      className="form-control"
                      name="maxLoanDurationDays"
                      value={formData.maxLoanDurationDays || 14}
                      onChange={handleChange}
                    />
                    <div className="form-text small">Standard duration allowed for employee equipment checkouts.</div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Default Inspector Title</label>
                    <input
                      type="text"
                      className="form-control"
                      name="defaultInspectorTitle"
                      value={formData.defaultInspectorTitle || 'Lead Vault Inspector'}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-check form-switch mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="requireApproval"
                      name="requireApproval"
                      checked={formData.requireApproval !== false}
                      onChange={handleChange}
                    />
                    <label className="form-check-label small fw-semibold text-dark" htmlFor="requireApproval">
                      Require Administrator or Stock Controller Approval
                    </label>
                    <div className="form-text small">Requisitions must be approved before checkout can occur.</div>
                  </div>

                  <div className="form-check form-switch mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="requireInspectionSignature"
                      name="requireInspectionSignature"
                      checked={formData.requireInspectionSignature !== false}
                      onChange={handleChange}
                    />
                    <label className="form-check-label small fw-semibold text-dark" htmlFor="requireInspectionSignature">
                      Require Inspector Signature on Inspection & Handover
                    </label>
                    <div className="form-text small">Automatically binds inspector signature to check-in/out records.</div>
                  </div>

                  <div className="form-check form-switch mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="autoOverdueCheck"
                      name="autoOverdueCheck"
                      checked={formData.autoOverdueCheck !== false}
                      onChange={handleChange}
                    />
                    <label className="form-check-label small fw-semibold text-dark" htmlFor="autoOverdueCheck">
                      Automated Overdue Tracking & Alerts
                    </label>
                  </div>
                </div>

                {/* Stock Vault Settings */}
                <div className="col-md-6">
                  <h6 className="fw-bold text-secondary small text-uppercase mb-3">Stock Vault Controls</h6>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Low Stock Warning Threshold (Units)</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      className="form-control"
                      name="lowStockThreshold"
                      value={formData.lowStockThreshold || 2}
                      onChange={handleChange}
                    />
                    <div className="form-text small">Trigger system alerts when available stock drops to or below this count.</div>
                  </div>

                  <div className="form-check form-switch mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="autoOutOfStockStatus"
                      name="autoOutOfStockStatus"
                      checked={formData.autoOutOfStockStatus !== false}
                      onChange={handleChange}
                    />
                    <label className="form-check-label small fw-semibold text-dark" htmlFor="autoOutOfStockStatus">
                      Automatic "Out of Stock" Status Update
                    </label>
                    <div className="form-text small">Automatically marks items as Out of Stock when available quantity reaches 0.</div>
                  </div>

                  <div className="form-check form-switch mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="autoCreateTicketOnDamagedCheckin"
                      name="autoCreateTicketOnDamagedCheckin"
                      checked={formData.autoCreateTicketOnDamagedCheckin !== false}
                      onChange={handleChange}
                    />
                    <label className="form-check-label small fw-semibold text-dark" htmlFor="autoCreateTicketOnDamagedCheckin">
                      Auto-generate Maintenance Ticket on Damaged Check-in
                    </label>
                    <div className="form-text small">Quarantines gear and logs defect diagnostics immediately.</div>
                  </div>

                  <div className="form-check form-switch mb-4">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="enableStockMovementLogging"
                      name="enableStockMovementLogging"
                      checked={formData.enableStockMovementLogging !== false}
                      onChange={handleChange}
                    />
                    <label className="form-check-label small fw-semibold text-dark" htmlFor="enableStockMovementLogging">
                      Enable Stock Movements & History Audit Log
                    </label>
                  </div>

                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Rules & Stock Configuration'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 4: Audit Logs */}
      {activeTab === 'audit' && (
        <div className="card border-0 shadow-sm">
          <div className="card-body p-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h6 className="fw-bold text-dark mb-0">System Security & Activity Audit Log</h6>
                <small className="text-muted">Immutable record of logins, stock changes, checkouts, and admin actions.</small>
              </div>

              <select
                className="form-select form-select-sm"
                style={{ width: '180px' }}
                value={auditFilter}
                onChange={(e) => setAuditFilter(e.target.value)}
              >
                <option value="ALL">All Actions</option>
                <option value="LOGIN">Logins</option>
                <option value="CREATE_EQUIPMENT">Equipment Created</option>
                <option value="UPDATE_EQUIPMENT">Equipment Updated</option>
                <option value="CHECK_OUT">Checkouts</option>
                <option value="CHECK_IN">Check-ins</option>
                <option value="CREATE_MAINTENANCE">Maintenance Created</option>
                <option value="UPDATE_SETTINGS">Settings Changes</option>
              </select>
            </div>

            {loadingLogs ? (
              <div className="text-center py-4">
                <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="text-center py-4 text-muted small">No audit log records found for this filter.</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-sm table-hover align-middle mb-0" style={{ fontSize: '8.5pt' }}>
                  <thead className="table-light">
                    <tr>
                      <th>Timestamp</th>
                      <th>User</th>
                      <th>Action</th>
                      <th>Entity</th>
                      <th>Details</th>
                      <th>IP Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="text-nowrap">{formatDateTime(log.createdAt)}</td>
                        <td className="fw-bold text-dark">{log.user?.name || 'System / Anonymous'}</td>
                        <td>
                          <span className="badge bg-light text-dark border font-monospace">
                            {log.action}
                          </span>
                        </td>
                        <td className="text-muted">{log.entity}</td>
                        <td className="font-monospace small text-truncate" style={{ maxWidth: '280px' }}>
                          {JSON.stringify(log.details || {})}
                        </td>
                        <td className="text-muted font-monospace">{log.ipAddress || '127.0.0.1'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
