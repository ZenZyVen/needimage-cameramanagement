import React, { useState } from 'react';
import StatusBadge from '../common/StatusBadge';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';

const EquipmentDetailModal = ({ show, onHide, equipment, onShowQR }) => {
  const [activeTab, setActiveTab] = useState('details');

  if (!show || !equipment) return null;

  const defaultImage = 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&auto=format&fit=crop&q=80';
  const accessories = Array.isArray(equipment.accessories) ? equipment.accessories : [];
  const activeLoan = equipment.borrowItems?.[0]?.request;

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)' }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content border-0 shadow">
          {/* Header */}
          <div className="modal-header bg-slate-900 text-white" style={{ backgroundColor: '#1e293b' }}>
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-primary fs-6">{equipment.assetTag}</span>
              <h6 className="modal-title fw-bold text-white mb-0">{equipment.name}</h6>
            </div>
            <button type="button" className="btn-close btn-close-white" onClick={onHide}></button>
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
                  <i className="bi bi-info-circle me-1"></i> Specifications & Details
                </button>
              </li>
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link small fw-medium ${activeTab === 'history' ? 'active text-primary' : 'text-secondary'}`}
                  onClick={() => setActiveTab('history')}
                >
                  <i className="bi bi-clock-history me-1"></i> Loan & Return History
                </button>
              </li>
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link small fw-medium ${activeTab === 'maintenance' ? 'active text-primary' : 'text-secondary'}`}
                  onClick={() => setActiveTab('maintenance')}
                >
                  <i className="bi bi-tools me-1"></i> Maintenance Records
                </button>
              </li>
            </ul>
          </div>

          {/* Body */}
          <div className="modal-body p-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            {activeTab === 'details' && (
              <div>
                {/* Active loan banner if currently borrowed */}
                {equipment.status === 'BORROWED' && activeLoan && (
                  <div className="alert alert-warning border-warning-subtle py-2 px-3 mb-4 d-flex align-items-center justify-content-between">
                    <div>
                      <i className="bi bi-exclamation-triangle-fill me-2"></i>
                      <strong>Currently Checked Out</strong> to{' '}
                      <span className="text-dark fw-bold">{activeLoan.user?.name}</span>
                      {activeLoan.project?.title && ` for "${activeLoan.project.title}"`}
                    </div>
                    <span className="badge bg-warning text-dark">
                      Due: {formatDate(activeLoan.endDate)}
                    </span>
                  </div>
                )}

                <div className="row g-4 mb-4">
                  {/* Photo & Quick Badges */}
                  <div className="col-md-5">
                    <div className="border rounded overflow-hidden bg-light mb-3" style={{ height: '220px' }}>
                      <img
                        src={equipment.imageUrl || defaultImage}
                        alt={equipment.name}
                        className="w-100 h-100 object-fit-cover"
                        onError={(e) => { e.target.src = defaultImage; }}
                      />
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="small text-muted">Status:</span>
                      <StatusBadge status={equipment.status} />
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="small text-muted">Condition:</span>
                      <span className="badge bg-secondary-subtle text-secondary border">
                        {equipment.condition}
                      </span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="small text-muted">Location:</span>
                      <span className="small fw-semibold text-dark">{equipment.location || 'Vault Main'}</span>
                    </div>
                  </div>

                  {/* Tech Specs & Inventory Info */}
                  <div className="col-md-7">
                    <h5 className="fw-bold text-dark mb-1">{equipment.name}</h5>
                    <p className="text-muted small mb-3">
                      Brand: <strong className="text-dark">{equipment.brand}</strong> | Model:{' '}
                      <strong className="text-dark">{equipment.model || 'N/A'}</strong>
                    </p>

                    <div className="p-3 border rounded bg-light mb-3">
                      <div className="row g-2">
                        <div className="col-6">
                          <span className="text-muted small d-block">Serial Number:</span>
                          <span className="fw-bold text-dark">{equipment.serialNumber}</span>
                        </div>
                        <div className="col-6">
                          <span className="text-muted small d-block">Category:</span>
                          <span className="fw-semibold text-dark">{equipment.category?.name || 'General'}</span>
                        </div>
                        <div className="col-6">
                          <span className="text-muted small d-block">Purchase Value:</span>
                          <span className="fw-semibold text-dark">{formatCurrency(equipment.purchasePrice)}</span>
                        </div>
                        <div className="col-6">
                          <span className="text-muted small d-block">Daily Rate:</span>
                          <span className="fw-semibold text-primary">{formatCurrency(equipment.dailyRate)}/day</span>
                        </div>
                      </div>
                    </div>

                    {/* Accessories Checklist */}
                    <div>
                      <h6 className="fw-bold text-secondary small text-uppercase mb-2">
                        Included Accessories ({accessories.length})
                      </h6>
                      <div className="d-flex flex-wrap gap-1">
                        {accessories.length === 0 ? (
                          <span className="small text-muted">Standard unit only.</span>
                        ) : (
                          accessories.map((acc, i) => (
                            <span key={i} className="accessory-badge">
                              <i className="bi bi-check2 me-1 text-success"></i>
                              {acc}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {equipment.notes && (
                  <div className="p-3 border rounded bg-light">
                    <h6 className="fw-bold text-secondary small text-uppercase mb-1">Vault Notes & Log</h6>
                    <p className="small text-muted mb-0">{equipment.notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
              <div>
                <h6 className="fw-bold text-secondary small text-uppercase mb-3">
                  Recent Handover & Return Logs
                </h6>
                {equipment.checkInsOuts && equipment.checkInsOuts.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-sm table-bordered" style={{ fontSize: '8.5pt' }}>
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
                        {equipment.checkInsOuts.map((record) => (
                          <tr key={record.id}>
                            <td>
                              <span
                                className={`badge ${
                                  record.type === 'CHECK_OUT'
                                    ? 'bg-primary'
                                    : 'bg-success'
                                }`}
                              >
                                {record.type === 'CHECK_OUT' ? 'CHECKED OUT' : 'RETURNED'}
                              </span>
                            </td>
                            <td>{formatDateTime(record.actionDate)}</td>
                            <td>{record.handledBy?.name || 'Staff'}</td>
                            <td>{record.borrowerName || '—'}</td>
                            <td>{record.conditionAtAction}</td>
                            <td className="small">{record.notes || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted small">
                    No loan history recorded for this item yet.
                  </div>
                )}
              </div>
            )}

            {/* Maintenance Tab */}
            {activeTab === 'maintenance' && (
              <div>
                <h6 className="fw-bold text-secondary small text-uppercase mb-3">
                  Service & Damage Tickets
                </h6>
                {equipment.maintenances && equipment.maintenances.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-sm table-bordered" style={{ fontSize: '8.5pt' }}>
                      <thead className="table-light">
                        <tr>
                          <th>Ticket #</th>
                          <th>Issue</th>
                          <th>Severity</th>
                          <th>Status</th>
                          <th>Vendor / Cost</th>
                          <th>Reported</th>
                        </tr>
                      </thead>
                      <tbody>
                        {equipment.maintenances.map((mnt) => (
                          <tr key={mnt.id}>
                            <td className="fw-bold">{mnt.ticketNumber}</td>
                            <td>{mnt.issueTitle}</td>
                            <td>
                              <span className="badge bg-secondary">{mnt.severity}</span>
                            </td>
                            <td>
                              <StatusBadge status={mnt.status} />
                            </td>
                            <td>
                              {mnt.vendor || 'Internal'}
                              {mnt.cost ? ` (${formatCurrency(mnt.cost)})` : ''}
                            </td>
                            <td>{formatDate(mnt.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted small">
                    <i className="bi bi-shield-check fs-2 text-success d-block mb-1"></i>
                    No maintenance issues reported. Equipment in healthy state.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="modal-footer bg-light py-2 d-flex justify-content-between">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={() => onShowQR(equipment)}
            >
              <i className="bi bi-qr-code me-1"></i> View QR Tag
            </button>
            <button type="button" className="btn btn-sm btn-secondary" onClick={onHide}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EquipmentDetailModal;
