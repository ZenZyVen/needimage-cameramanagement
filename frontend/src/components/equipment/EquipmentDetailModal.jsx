import React, { useState } from 'react';
import StatusBadge from '../common/StatusBadge';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';

const EquipmentDetailModal = ({ show, onHide, equipment, onShowQR }) => {
  const [activeTab, setActiveTab] = useState('details');

  if (!show || !equipment) return null;

  const defaultImage = 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&auto=format&fit=crop&q=80';
  const activeLoan = equipment.borrowItems?.[0]?.request;
  const qty = equipment.quantity || 1;
  const avail = equipment.availableQuantity !== undefined ? equipment.availableQuantity : (equipment.status === 'AVAILABLE' ? qty : 0);

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)' }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '12px', overflow: 'hidden' }}>
          {/* Header */}
          <div className="modal-header bg-slate-900 text-white" style={{ backgroundColor: '#0f172a' }}>
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-primary fs-6">{equipment.assetTag}</span>
              <h6 className="modal-title fw-bold text-white mb-0">{equipment.name}</h6>
            </div>
            <div className="d-flex align-items-center gap-2">
              {onShowQR && (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-light d-flex align-items-center gap-1"
                  onClick={() => onShowQR(equipment)}
                >
                  <i className="bi bi-qr-code"></i>
                  <span className="d-none d-sm-inline">QR Tag</span>
                </button>
              )}
              <button
                type="button"
                className="modal-close-btn"
                onClick={onHide}
                aria-label="Close"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="border-bottom px-3 pt-2 bg-light">
            <ul className="nav nav-tabs border-bottom-0">
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link small fw-medium ${activeTab === 'details' ? 'active text-primary' : 'text-secondary'}`}
                  onClick={() => setActiveTab('details')}
                >
                  <i className="bi bi-info-circle me-1"></i> Stock & Details
                </button>
              </li>
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link small fw-medium ${activeTab === 'history' ? 'active text-primary' : 'text-secondary'}`}
                  onClick={() => setActiveTab('history')}
                >
                  <i className="bi bi-clock-history me-1"></i> Handover & Loan History
                </button>
              </li>
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link small fw-medium ${activeTab === 'maintenance' ? 'active text-primary' : 'text-secondary'}`}
                  onClick={() => setActiveTab('maintenance')}
                >
                  <i className="bi bi-tools me-1"></i> Defect & Maintenance Records
                </button>
              </li>
            </ul>
          </div>

          {/* Body */}
          <div className="modal-body p-4" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
            {activeTab === 'details' && (
              <div>
                {/* Active loan banner if currently borrowed */}
                {equipment.status === 'BORROWED' && activeLoan && (
                  <div className="alert alert-warning border-warning-subtle py-2 px-3 mb-4 d-flex align-items-center justify-content-between">
                    <div>
                      <i className="bi bi-exclamation-triangle-fill me-2"></i>
                      <strong>Checked Out on Loan</strong> to{' '}
                      <span className="text-dark fw-bold">{activeLoan.user?.name}</span>
                      {activeLoan.project?.title && ` for "${activeLoan.project.title}"`}
                    </div>
                    <span className="badge bg-warning text-dark">
                      Due: {formatDate(activeLoan.endDate)}
                    </span>
                  </div>
                )}

                <div className="row g-4 mb-4">
                  {/* Photo & Stock Counters */}
                  <div className="col-md-5">
                    <div className="border rounded overflow-hidden bg-light p-2 mb-3 d-flex align-items-center justify-content-center" style={{ height: '220px' }}>
                      <img
                        src={equipment.imageUrl || defaultImage}
                        alt={equipment.name}
                        referrerPolicy="no-referrer"
                        className="w-100 h-100"
                        style={{ objectFit: 'contain' }}
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = defaultImage; }}
                      />
                    </div>

                    {/* Stock Quantity Card */}
                    <div className="p-3 border rounded bg-light text-center mb-3">
                      <div className="text-muted small text-uppercase fw-semibold mb-1">Stock Availability</div>
                      <div className="d-flex align-items-center justify-content-center gap-2">
                        <span className="fs-3 fw-bold text-success">{avail}</span>
                        <span className="text-muted fs-5">/</span>
                        <span className="fs-4 fw-bold text-dark">{qty}</span>
                        <span className="small text-muted ms-1">units available</span>
                      </div>
                      <div className="progress mt-2" style={{ height: '6px' }}>
                        <div
                          className={`progress-bar ${avail === 0 ? 'bg-danger' : avail <= 2 ? 'bg-warning' : 'bg-success'}`}
                          style={{ width: `${qty > 0 ? (avail / qty) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="small text-muted">Stock Status:</span>
                      <StatusBadge status={equipment.status} />
                    </div>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="small text-muted">Condition:</span>
                      <span className="badge bg-secondary-subtle text-secondary border">
                        {equipment.condition}
                      </span>
                    </div>
                  </div>

                  {/* Tech Specs & Inventory Info */}
                  <div className="col-md-7">
                    <h5 className="fw-bold text-dark mb-1">{equipment.name}</h5>
                    <p className="text-muted small mb-3">
                      Brand: <strong className="text-dark">{equipment.brand}</strong>
                      {equipment.model && <> | Model: <strong className="text-dark">{equipment.model}</strong></>}
                    </p>

                    <div className="p-3 border rounded bg-light mb-3">
                      <div className="row g-3">
                        <div className="col-6">
                          <span className="text-muted small d-block">Serial Number:</span>
                          <span className="fw-bold text-dark font-monospace">{equipment.serialNumber}</span>
                        </div>
                        <div className="col-6">
                          <span className="text-muted small d-block">Media Category:</span>
                          <span className="badge bg-white text-dark border fw-semibold">
                            {equipment.category?.name || 'General Equipment'}
                          </span>
                        </div>
                        <div className="col-6">
                          <span className="text-muted small d-block">Purchase Value:</span>
                          <span className="fw-semibold text-dark">{formatCurrency(equipment.purchasePrice)}</span>
                        </div>
                        <div className="col-6">
                          <span className="text-muted small d-block">Daily Rental Rate:</span>
                          <span className="fw-semibold text-primary">{formatCurrency(equipment.dailyRate)} / day</span>
                        </div>
                        {equipment.purchaseDate && (
                          <div className="col-6">
                            <span className="text-muted small d-block">Acquisition Date:</span>
                            <span className="small text-dark">{formatDate(equipment.purchaseDate)}</span>
                          </div>
                        )}
                        <div className="col-6">
                          <span className="text-muted small d-block">Asset Lifecycle:</span>
                          <span className="badge bg-light text-secondary border">
                            {equipment.isDeleted ? 'Archived' : 'Active In Vault'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Notes & Specs */}
                    {equipment.notes && (
                      <div className="p-3 border rounded bg-white">
                        <h6 className="fw-bold text-secondary small text-uppercase mb-1">Vault Technical Notes</h6>
                        <p className="small text-muted mb-0">{equipment.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
              <div>
                <h6 className="fw-bold text-secondary small text-uppercase mb-3">
                  Recent Handover & Check-in Records
                </h6>
                {equipment.checkInsOuts && equipment.checkInsOuts.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-sm table-bordered align-middle" style={{ fontSize: '8.5pt' }}>
                      <thead className="table-light">
                        <tr>
                          <th>Action</th>
                          <th>Date</th>
                          <th>Handled By</th>
                          <th>Borrower</th>
                          <th>Condition</th>
                          <th>Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {equipment.checkInsOuts.map((log) => (
                          <tr key={log.id}>
                            <td>
                              <span className={`badge ${log.type === 'CHECK_OUT' ? 'bg-warning text-dark' : 'bg-success'}`}>
                                {log.type === 'CHECK_OUT' ? 'CHECKED OUT' : 'CHECKED IN'}
                              </span>
                            </td>
                            <td className="text-nowrap">{formatDateTime(log.actionDate)}</td>
                            <td>{log.handledBy?.name || 'Staff'}</td>
                            <td className="fw-semibold">{log.borrowerName || '—'}</td>
                            <td>
                              <span className="badge bg-light text-dark border">{log.conditionAtAction}</span>
                            </td>
                            <td className="small text-muted">{log.notes || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted small">
                    <i className="bi bi-clock-history me-1"></i> No recorded loan or return events for this equipment yet.
                  </div>
                )}
              </div>
            )}

            {/* Maintenance Records Tab */}
            {activeTab === 'maintenance' && (
              <div>
                <h6 className="fw-bold text-secondary small text-uppercase mb-3">
                  Maintenance & Defect Diagnostics History
                </h6>
                {equipment.maintenances && equipment.maintenances.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-sm table-bordered align-middle" style={{ fontSize: '8.5pt' }}>
                      <thead className="table-light">
                        <tr>
                          <th>Ticket Code</th>
                          <th>Issue Title</th>
                          <th>Severity</th>
                          <th>Status</th>
                          <th>Reported By</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {equipment.maintenances.map((mnt) => (
                          <tr key={mnt.id}>
                            <td className="fw-bold font-monospace">{mnt.ticketNumber}</td>
                            <td>{mnt.issueTitle}</td>
                            <td>
                              <span className={`badge ${mnt.severity === 'HIGH' || mnt.severity === 'CRITICAL' ? 'bg-danger' : 'bg-warning text-dark'}`}>
                                {mnt.severity}
                              </span>
                            </td>
                            <td>
                              <span className="badge bg-light text-dark border">{mnt.status}</span>
                            </td>
                            <td>{mnt.reportedBy?.name || 'Staff'}</td>
                            <td className="text-nowrap">{formatDate(mnt.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted small">
                    <i className="bi bi-check-circle text-success me-1"></i> Equipment has zero active or past maintenance tickets.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="modal-footer bg-light px-4 py-2">
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onHide}>
              Close Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EquipmentDetailModal;
