import React from 'react';
import { formatDate, formatDateTime } from '../../utils/formatters';
import { triggerPrint, exportPDF } from '../../utils/printHelper';

const HandoverPrintDocument = ({ request, checkOutRecords, staffUser }) => {
  if (!request) return null;

  const docId = `handover-doc-${request.id}`;

  return (
    <div>
      {/* Control Actions (Hidden during print) */}
      <div className="d-flex justify-content-end gap-2 mb-3 no-print">
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          onClick={() => exportPDF(docId, `Handover-${request.requestNumber}.pdf`)}
        >
          <i className="bi bi-file-earmark-pdf me-1"></i> Export PDF
        </button>
        <button
          type="button"
          className="btn btn-sm btn-primary"
          onClick={triggerPrint}
        >
          <i className="bi bi-printer me-1"></i> Print A4 Form
        </button>
      </div>

      {/* Printable A4 Form Container */}
      <div className="printable-document" id={docId}>
        {/* Header */}
        <div className="document-header">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <img src="/logo.svg" alt="Logo" style={{ width: '28px', height: '28px' }} />
              <span className="fw-bold fs-5 text-dark">CINEVAULT STUDIOS</span>
            </div>
            <p className="small text-muted mb-0">Production Camera & Lighting Equipment Department</p>
            <p className="small text-muted mb-0">Official Equipment Loan & Handover Voucher</p>
          </div>
          <div className="text-end">
            <h2 className="document-title mb-1">HANDOVER VOUCHER</h2>
            <div className="badge bg-dark px-2 py-1 fs-6">{request.requestNumber}</div>
            <div className="small text-muted mt-1">Date: {formatDate(new Date())}</div>
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="row g-3 mb-4">
          <div className="col-6">
            <div className="p-3 border rounded bg-light">
              <h6 className="fw-bold text-uppercase small text-secondary mb-2">Borrower / Crew Lead</h6>
              <div className="fw-semibold text-dark">{request.user?.name}</div>
              <div className="small text-muted">Department: {request.user?.department || 'Production'}</div>
              <div className="small text-muted">Email: {request.user?.email}</div>
              <div className="small text-muted">Phone: {request.user?.phone || '—'}</div>
            </div>
          </div>
          <div className="col-6">
            <div className="p-3 border rounded bg-light">
              <h6 className="fw-bold text-uppercase small text-secondary mb-2">Production Project</h6>
              <div className="fw-semibold text-dark">{request.project?.title || 'General Production'}</div>
              <div className="small text-muted">Project Code: {request.project?.projectCode || 'N/A'}</div>
              <div className="small text-muted">Director: {request.project?.director || '—'}</div>
              <div className="small text-muted">Location: {request.destination || request.project?.location || 'Studio'}</div>
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="p-2 border rounded mb-4 bg-white">
          <div className="row text-center">
            <div className="col-6 border-end">
              <span className="small text-muted d-block">Handover / Pickup Date:</span>
              <strong className="text-dark">{formatDate(request.startDate)}</strong>
            </div>
            <div className="col-6">
              <span className="small text-muted d-block">Scheduled Return Date:</span>
              <strong className="text-danger">{formatDate(request.endDate)}</strong>
            </div>
          </div>
        </div>

        {/* Equipment Items Table */}
        <h6 className="fw-bold text-uppercase small text-secondary mb-2">Handed-Over Equipment Schedule</h6>
        <table className="table table-bordered mb-4" style={{ fontSize: '9pt' }}>
          <thead className="table-light">
            <tr>
              <th style={{ width: '44px' }}>No.</th>
              <th style={{ width: '90px' }}>Asset Tag</th>
              <th>Equipment Description & Model</th>
              <th>Serial Number</th>
              <th>Accessories & Components Verified</th>
              <th style={{ width: '90px' }}>Condition</th>
            </tr>
          </thead>
          <tbody>
            {request.items?.map((item, index) => {
              const eq = item.equipment;
              const accList = Array.isArray(eq.accessories) ? eq.accessories.join(', ') : 'Standard Kit';
              return (
                <tr key={item.id || index}>
                  <td>{index + 1}</td>
                  <td className="fw-bold">{eq.assetTag}</td>
                  <td>
                    <strong>{eq.name}</strong>
                    <div className="text-muted small">{eq.brand} - {eq.model}</div>
                  </td>
                  <td className="text-nowrap">{eq.serialNumber}</td>
                  <td className="small">{accList}</td>
                  <td>
                    <span className="badge bg-success-subtle text-success border border-success-subtle">
                      {eq.condition || 'GOOD'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Terms of Custody */}
        <div className="terms-box">
          <strong>Custody Terms & Liability Declaration:</strong>
          <p className="mb-0 mt-1">
            The borrower acknowledges receipt of all items listed above in verified operational condition with all noted accessories.
            The borrower assumes custodial responsibility for the equipment from handover until official check-in inspection.
            Any damage, optical scratches, liquid ingress, or missing accessories must be reported immediately to the Gear Vault.
          </p>
        </div>

        {/* Signatures */}
        <div className="signature-block">
          <div className="flex-fill">
            <div className="signature-line">
              <strong>{request.user?.name}</strong>
              <div className="small text-muted">Borrower Signature & Date</div>
            </div>
          </div>
          <div className="flex-fill">
            <div className="signature-line">
              <strong>{staffUser?.name || 'Vault Logistics Officer'}</strong>
              <div className="small text-muted">Authorizing Gear Vault Signature & Date</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HandoverPrintDocument;
