import React from 'react';
import { formatDate, formatDateTime } from '../../utils/formatters';
import { triggerPrint, exportPDF } from '../../utils/printHelper';

const ReturnPrintDocument = ({ request, returnRecords, staffUser }) => {
  if (!request) return null;

  const docId = `return-doc-${request.id}`;

  return (
    <div>
      {/* Control Actions */}
      <div className="d-flex justify-content-end gap-2 mb-3 no-print">
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          onClick={() => exportPDF(docId, `Return-Receipt-${request.requestNumber}.pdf`)}
        >
          <i className="bi bi-file-earmark-pdf me-1"></i> Export PDF
        </button>
        <button
          type="button"
          className="btn btn-sm btn-primary"
          onClick={triggerPrint}
        >
          <i className="bi bi-printer me-1"></i> Print Return Receipt
        </button>
      </div>

      <div className="printable-document" id={docId}>
        {/* Header */}
        <div className="document-header">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <img src="/logo.svg" alt="Logo" style={{ width: '28px', height: '28px' }} />
              <span className="fw-bold fs-5 text-dark">CINEVAULT STUDIOS</span>
            </div>
            <p className="small text-muted mb-0">Equipment Vault & Technical Quality Inspection</p>
            <p className="small text-muted mb-0">Official Equipment Return & Inspection Voucher</p>
          </div>
          <div className="text-end">
            <h2 className="document-title text-success mb-1">RETURN RECEIPT</h2>
            <div className="badge bg-secondary px-2 py-1 fs-6">REF: {request.requestNumber}</div>
            <div className="small text-muted mt-1">Inspection Date: {formatDateTime(new Date())}</div>
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="row g-3 mb-4">
          <div className="col-6">
            <div className="p-3 border rounded bg-light">
              <h6 className="fw-bold text-uppercase small text-secondary mb-2">Returning Crew / Borrower</h6>
              <div className="fw-semibold text-dark">{request.user?.name}</div>
              <div className="small text-muted">Department: {request.user?.department || 'Production'}</div>
              <div className="small text-muted">Contact: {request.user?.email}</div>
            </div>
          </div>
          <div className="col-6">
            <div className="p-3 border rounded bg-light">
              <h6 className="fw-bold text-uppercase small text-secondary mb-2">Project Reference</h6>
              <div className="fw-semibold text-dark">{request.project?.title || 'Production'}</div>
              <div className="small text-muted">Project Code: {request.project?.projectCode || 'N/A'}</div>
              <div className="small text-muted">Original Due Date: {formatDate(request.endDate)}</div>
            </div>
          </div>
        </div>

        {/* Return Items Table */}
        <h6 className="fw-bold text-uppercase small text-secondary mb-2">Inspected Equipment Items</h6>
        <table className="table table-bordered mb-4" style={{ fontSize: '9pt' }}>
          <thead className="table-light">
            <tr>
              <th style={{ width: '40px' }}>#</th>
              <th style={{ width: '90px' }}>Asset Tag</th>
              <th>Equipment Model</th>
              <th>Serial Number</th>
              <th style={{ width: '100px' }}>Return Status</th>
              <th>Missing Accessories / Damage Inspection Notes</th>
            </tr>
          </thead>
          <tbody>
            {request.items?.map((item, index) => {
              const eq = item.equipment;
              return (
                <tr key={item.id || index}>
                  <td>{index + 1}</td>
                  <td className="fw-bold">{eq.assetTag}</td>
                  <td>{eq.name}</td>
                  <td>{eq.serialNumber}</td>
                  <td>
                    <span
                      className={`badge ${
                        item.status === 'RETURNED'
                          ? 'bg-success-subtle text-success'
                          : 'bg-warning-subtle text-warning'
                      }`}
                    >
                      {item.status || 'RETURNED'}
                    </span>
                  </td>
                  <td className="small">
                    {item.notes || 'All items and accessories accounted for in good order.'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Technical Inspection Sign-off */}
        <div className="terms-box">
          <strong>Vault Technical Inspection Sign-Off:</strong>
          <p className="mb-0 mt-1">
            The items listed above have undergone physical inspection, lens optic assessment, and mechanical verification by the Vault Controller.
            The return of equipment is officially logged in the CineVault system.
          </p>
        </div>

        {/* Signatures */}
        <div className="signature-block">
          <div className="flex-fill">
            <div className="signature-line">
              <strong>{request.user?.name}</strong>
              <div className="small text-muted">Returning Custodian Signature</div>
            </div>
          </div>
          <div className="flex-fill">
            <div className="signature-line">
              <strong>{staffUser?.name || 'Vault Technician'}</strong>
              <div className="small text-muted">Receiving Vault Inspector Signature</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReturnPrintDocument;
