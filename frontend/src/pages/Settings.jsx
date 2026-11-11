import React, { useState, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';
import { getAuditLogs, exportBackup, uploadLogo } from '../services/settingsService';
import { getCategories, createCategory, deleteCategory } from '../services/equipmentService';
import { getRequests } from '../services/requestService';
import { formatDate, formatDateTime, formatCurrency } from '../utils/formatters';

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

  // Existing requests for invoice loader
  const [existingRequests, setExistingRequests] = useState([]);

  // Customizable Invoice preview fields
  const [customInvoice, setCustomInvoice] = useState({
    invoiceNumber: 'INV-2026-001',
    borrowingDate: new Date().toISOString().slice(0, 10),
    projectName: 'Horizon 2026 Electric Vehicle Commercial',
    projectCode: 'PRJ-2026-001',
    projectLocation: 'Pacific Rim Highway Stage 3',
    borrowerName: 'David Kim',
    borrowerDepartment: 'Cinematography Unit',
    borrowerPhone: '+1 (555) 019-7711',
    borrowerEmail: 'user@cameragear.com',
    expectedReturnDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    equipmentItems: [
      { tag: 'CAM-002', name: 'Sony FX6 Full-Frame Cinema Camera', serial: 'SN-FX6-902184', qty: 1, rate: 220, condition: 'EXCELLENT' },
      { tag: 'LNS-001', name: 'Sony FE 24-70mm f/2.8 GM II Lens', serial: 'SN-LNS-119203', qty: 1, rate: 65, condition: 'EXCELLENT' },
      { tag: 'BAT-001', name: 'Anton Bauer Titon 150 V-Mount Battery', serial: 'SN-BAT-901842', qty: 2, rate: 25, condition: 'EXCELLENT' },
      { tag: 'ACC-001', name: 'Tilta Mirage Carbon Fiber Matte Box', serial: 'SN-ACC-771920', qty: 1, rate: 20, condition: 'EXCELLENT' }
    ]
  });

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
    } else if (activeTab === 'invoice') {
      loadExistingRequests();
    }
  }, [activeTab, auditFilter]);

  const loadExistingRequests = async () => {
    try {
      const res = await getRequests({ limit: 30 });
      if (res.data?.success) {
        setExistingRequests(res.data.data || []);
      }
    } catch (e) {
      console.warn('Error loading requests for invoice preview:', e);
    }
  };

  const handleSelectRequestForInvoice = (reqId) => {
    const req = existingRequests.find(r => r.id === reqId);
    if (!req) return;
    setCustomInvoice({
      invoiceNumber: req.requestNumber || 'INV-2026-X',
      borrowingDate: req.startDate ? req.startDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
      projectName: req.project?.title || 'Production Project',
      projectCode: req.project?.projectCode || 'PRJ-2026-X',
      projectLocation: req.destination || req.project?.location || 'Studio Lot',
      borrowerName: req.user?.name || 'Borrower Lead',
      borrowerDepartment: req.user?.department || 'Cinematography',
      borrowerPhone: req.user?.phone || '+1 (555) 019-7711',
      borrowerEmail: req.user?.email || '',
      expectedReturnDate: req.endDate ? req.endDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
      equipmentItems: (req.items || []).map(i => ({
        tag: i.equipment?.assetTag || 'CAM-001',
        name: i.equipment?.name || 'Equipment Unit',
        serial: i.equipment?.serialNumber || 'SN-VERIFIED',
        qty: 1,
        rate: i.equipment?.dailyRate || 100,
        condition: i.returnedCondition || 'EXCELLENT'
      }))
    });
  };

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
                className={`nav-link small py-2 px-3 fw-medium ${activeTab === 'invoice' ? 'active' : 'text-dark'}`}
                onClick={() => setActiveTab('invoice')}
              >
                <i className="bi bi-receipt me-1"></i> Invoice & Custody Customization
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

      {/* TAB: Invoice Customization & Loan Voucher */}
      {activeTab === 'invoice' && (
        <div className="row g-4">
          {/* Left Column: Customization Form */}
          <div className="col-lg-5">
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-white border-bottom p-3">
                <div className="d-flex align-items-center justify-content-between">
                  <h6 className="fw-bold text-dark mb-0">
                    <i className="bi bi-pencil-square text-primary me-2"></i>
                    Customize Invoice Data
                  </h6>
                  {existingRequests.length > 0 && (
                    <span className="badge bg-light text-secondary border small">
                      {existingRequests.length} active requests
                    </span>
                  )}
                </div>
              </div>

              <div className="card-body p-3">
                {/* Loader from active request */}
                {existingRequests.length > 0 && (
                  <div className="p-3 bg-light rounded border mb-3">
                    <label className="form-label small fw-bold text-secondary mb-1">
                      <i className="bi bi-magic text-primary me-1"></i> Quick Load from Existing Loan Request:
                    </label>
                    <select
                      className="form-select form-select-sm"
                      onChange={(e) => handleSelectRequestForInvoice(e.target.value)}
                      defaultValue=""
                    >
                      <option value="" disabled>-- Select a live request to load data --</option>
                      {existingRequests.map(r => (
                        <option key={r.id} value={r.id}>
                          {r.requestNumber} • {r.user?.name} ({r.project?.title || 'Shoot'})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <form onSubmit={handleSaveBrandingAndRules}>
                  {/* Template Global Settings */}
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Invoice Header / Document Title</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      name="invoiceHeader"
                      value={formData.invoiceHeader || 'EQUIPMENT BORROWING AGREEMENT & CUSTODY INVOICE'}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small fw-semibold text-secondary">Studio Tax ID / EIN</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        name="invoiceTaxId"
                        value={formData.invoiceTaxId || 'EIN-84-9182903'}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-semibold text-secondary">Authorized Signer Title</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        name="invoiceAuthorizedSigner"
                        value={formData.invoiceAuthorizedSigner || 'Vault Logistics Authority'}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="border-top pt-3 mb-3">
                    <h6 className="fw-bold text-secondary small text-uppercase mb-2">
                      <i className="bi bi-calendar-range text-primary me-1"></i> Dates & Project Details
                    </h6>

                    <div className="row g-2 mb-2">
                      <div className="col-6">
                        <label className="form-label small text-secondary">Borrowing Date</label>
                        <input
                          type="date"
                          className="form-control form-control-sm"
                          value={customInvoice.borrowingDate}
                          onChange={(e) => setCustomInvoice(prev => ({ ...prev, borrowingDate: e.target.value }))}
                        />
                      </div>
                      <div className="col-6">
                        <label className="form-label small text-secondary">Expected Return Date</label>
                        <input
                          type="date"
                          className="form-control form-control-sm"
                          value={customInvoice.expectedReturnDate}
                          onChange={(e) => setCustomInvoice(prev => ({ ...prev, expectedReturnDate: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="mb-2">
                      <label className="form-label small text-secondary">Project Name & Code</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={customInvoice.projectName}
                        onChange={(e) => setCustomInvoice(prev => ({ ...prev, projectName: e.target.value }))}
                      />
                    </div>

                    <div className="mb-2">
                      <label className="form-label small text-secondary">Shoot Location / Set Destination</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={customInvoice.projectLocation}
                        onChange={(e) => setCustomInvoice(prev => ({ ...prev, projectLocation: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="border-top pt-3 mb-3">
                    <h6 className="fw-bold text-secondary small text-uppercase mb-2">
                      <i className="bi bi-person text-primary me-1"></i> Borrower Information
                    </h6>

                    <div className="row g-2 mb-2">
                      <div className="col-6">
                        <label className="form-label small text-secondary">Borrower Full Name</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={customInvoice.borrowerName}
                          onChange={(e) => setCustomInvoice(prev => ({ ...prev, borrowerName: e.target.value }))}
                        />
                      </div>
                      <div className="col-6">
                        <label className="form-label small text-secondary">Department / Crew Role</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={customInvoice.borrowerDepartment}
                          onChange={(e) => setCustomInvoice(prev => ({ ...prev, borrowerDepartment: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="row g-2 mb-2">
                      <div className="col-6">
                        <label className="form-label small text-secondary">Borrower Contact Phone</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={customInvoice.borrowerPhone}
                          onChange={(e) => setCustomInvoice(prev => ({ ...prev, borrowerPhone: e.target.value }))}
                        />
                      </div>
                      <div className="col-6">
                        <label className="form-label small text-secondary">Borrower Email</label>
                        <input
                          type="email"
                          className="form-control form-control-sm"
                          value={customInvoice.borrowerEmail}
                          onChange={(e) => setCustomInvoice(prev => ({ ...prev, borrowerEmail: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-top pt-3 mb-3">
                    <h6 className="fw-bold text-secondary small text-uppercase mb-2">
                      <i className="bi bi-file-earmark-text text-primary me-1"></i> Legal Custody Terms & Return Policy
                    </h6>
                    <textarea
                      className="form-control form-control-sm mb-2"
                      rows="3"
                      name="invoiceTerms"
                      value={formData.invoiceTerms || ''}
                      onChange={handleChange}
                    ></textarea>
                  </div>

                  <button type="submit" className="btn btn-primary w-100" disabled={saving}>
                    <i className="bi bi-check2-circle me-1"></i>
                    {saving ? 'Saving...' : 'Save Default Invoice Template'}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Right Column: Live Printable Preview */}
          <div className="col-lg-7">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-bottom p-3 d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-success-subtle text-success border border-success-subtle">
                    Live Printable Preview
                  </span>
                  <small className="text-muted">A4 PDF standard format</small>
                </div>
                <button
                  type="button"
                  className="btn btn-primary btn-sm d-flex align-items-center gap-1 shadow-sm px-3 fw-semibold"
                  onClick={() => window.print()}
                >
                  <i className="bi bi-printer"></i> Print Invoice as PDF
                </button>
              </div>

              {/* Printable Invoice Sheet Container */}
              <div className="card-body p-4 bg-white" style={{ minHeight: '600px' }}>
                {/* Header Section */}
                <div className="d-flex justify-content-between align-items-start border-bottom pb-3 mb-3">
                  <div>
                    <h5 className="fw-bold text-dark mb-0">{formData.companyName || settings.companyName || 'CineVault Media Studios'}</h5>
                    <p className="text-muted small mb-0">{formData.address || settings.address || 'Studio Lot 4B, Media Arts District, CA'}</p>
                    <p className="text-muted small mb-0">
                      Tel: {formData.phone || settings.phone || '+1 555-019-2831'} • Email: {formData.email || settings.email || 'vault@cinevault.com'}
                    </p>
                    <span className="badge bg-light text-secondary border font-monospace mt-1">
                      Tax ID / EIN: {formData.invoiceTaxId || 'EIN-84-9182903'}
                    </span>
                  </div>
                  <div className="text-end">
                    <span className="badge bg-dark font-monospace fs-6 mb-1">
                      {customInvoice.invoiceNumber || 'INV-2026-001'}
                    </span>
                    <div className="small text-muted font-monospace">
                      <strong>Issue Date:</strong> {formatDate(customInvoice.borrowingDate)}
                    </div>
                    <div className="small text-danger fw-bold font-monospace">
                      <strong>Return Due:</strong> {formatDate(customInvoice.expectedReturnDate)}
                    </div>
                  </div>
                </div>

                <div className="text-center my-2">
                  <h6 className="fw-bold text-dark text-uppercase letter-spacing-1 mb-0">
                    {formData.invoiceHeader || 'EQUIPMENT BORROWING AGREEMENT & CUSTODY INVOICE'}
                  </h6>
                </div>

                {/* Dual Metadata Panels */}
                <div className="row g-2 p-2 bg-light rounded border mb-3">
                  <div className="col-6 border-end">
                    <span className="text-uppercase text-secondary fw-bold" style={{ fontSize: '0.68rem' }}>
                      <i className="bi bi-person-badge text-primary me-1"></i> Who Borrowed The Equipment:
                    </span>
                    <div className="fw-bold text-dark small">{customInvoice.borrowerName}</div>
                    <div className="small text-muted" style={{ fontSize: '0.72rem' }}>
                      Department: <strong className="text-secondary">{customInvoice.borrowerDepartment}</strong>
                    </div>
                    <div className="small text-muted" style={{ fontSize: '0.72rem' }}>
                      Phone: {customInvoice.borrowerPhone}
                    </div>
                    <div className="small text-muted" style={{ fontSize: '0.72rem' }}>
                      Email: {customInvoice.borrowerEmail}
                    </div>
                  </div>

                  <div className="col-6 ps-3">
                    <span className="text-uppercase text-secondary fw-bold" style={{ fontSize: '0.68rem' }}>
                      <i className="bi bi-film text-primary me-1"></i> For Which Project & Where Used:
                    </span>
                    <div className="fw-bold text-dark small">{customInvoice.projectName}</div>
                    <div className="small text-muted" style={{ fontSize: '0.72rem' }}>
                      Project Code: <span className="font-monospace fw-semibold">{customInvoice.projectCode}</span>
                    </div>
                    <div className="small text-muted" style={{ fontSize: '0.72rem' }}>
                      Shoot Location: <strong className="text-dark">{customInvoice.projectLocation}</strong>
                    </div>
                    <div className="small text-muted" style={{ fontSize: '0.72rem' }}>
                      Expected Return: <strong className="text-primary">{formatDate(customInvoice.expectedReturnDate)}</strong>
                    </div>
                  </div>
                </div>

                {/* Itemized Table */}
                <div className="mb-3">
                  <h6 className="fw-bold text-dark small mb-1">Itemized Equipment & Serial Verification Schedule</h6>
                  <div className="table-responsive border rounded">
                    <table className="table table-sm align-middle mb-0" style={{ fontSize: '8pt' }}>
                      <thead className="table-light text-muted">
                        <tr>
                          <th>Asset Tag</th>
                          <th>Equipment Description</th>
                          <th>Serial #</th>
                          <th className="text-center">Qty</th>
                          <th className="text-center">Condition</th>
                          <th className="text-end">Daily Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customInvoice.equipmentItems.map((item, idx) => (
                          <tr key={idx}>
                            <td>
                              <span className="badge bg-dark font-monospace" style={{ fontSize: '0.65rem' }}>
                                {item.tag}
                              </span>
                            </td>
                            <td className="fw-bold text-dark">{item.name}</td>
                            <td className="font-monospace text-secondary">{item.serial}</td>
                            <td className="text-center fw-bold">{item.qty}</td>
                            <td className="text-center">
                              <span className="badge bg-success-subtle text-success border border-success-subtle" style={{ fontSize: '0.62rem' }}>
                                {item.condition}
                              </span>
                            </td>
                            <td className="text-end font-monospace">{formatCurrency(item.rate)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Terms Box */}
                <div className="p-2 bg-light border rounded mb-3">
                  <div className="fw-bold text-dark small mb-1" style={{ fontSize: '0.72rem' }}>
                    CUSTODY DECLARATION & RETURN POLICY
                  </div>
                  <p className="text-muted mb-0" style={{ fontSize: '0.68rem', lineHeight: 1.4 }}>
                    {formData.invoiceTerms ||
                      'The borrower acknowledges full custody and legal responsibility for all equipment listed herein. All items must be returned in their original flight cases with verified components. Any damaged optical sensors, missing cables, or body damage will be billed according to standard studio repair rates.'}
                  </p>
                </div>

                {/* Sign-off Blocks */}
                <div className="row g-3 pt-2">
                  <div className="col-6">
                    <div className="border-bottom pb-3 mb-1 text-center" style={{ minHeight: '40px' }}>
                      <span className="font-monospace text-muted" style={{ fontSize: '0.7rem' }}>
                        [ Borrower Signature ]
                      </span>
                    </div>
                    <div className="text-center" style={{ fontSize: '0.72rem' }}>
                      <strong className="d-block text-dark">{customInvoice.borrowerName}</strong>
                      <span className="text-muted">Lead Cinematographer / Custody Holder</span>
                    </div>
                  </div>

                  <div className="col-6">
                    <div className="border-bottom pb-3 mb-1 text-center" style={{ minHeight: '40px' }}>
                      <span className="font-monospace text-muted" style={{ fontSize: '0.7rem' }}>
                        [ Vault Officer Signature ]
                      </span>
                    </div>
                    <div className="text-center" style={{ fontSize: '0.72rem' }}>
                      <strong className="d-block text-dark">Sarah Connor</strong>
                      <span className="text-muted">{formData.invoiceAuthorizedSigner || 'Vault Logistics Authority'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
