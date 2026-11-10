import React from 'react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { triggerPrint, exportPDF } from '../../utils/printHelper';

const InventoryReportPrintDocument = ({ inventoryData, summary }) => {
  const docId = 'inventory-audit-report';

  return (
    <div>
      {/* Control Actions */}
      <div className="d-flex justify-content-end gap-2 mb-3 no-print">
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          onClick={() => exportPDF(docId, `Inventory-Audit-${new Date().toISOString().slice(0, 10)}.pdf`)}
        >
          <i className="bi bi-file-earmark-pdf me-1"></i> Export PDF
        </button>
        <button
          type="button"
          className="btn btn-sm btn-primary"
          onClick={triggerPrint}
        >
          <i className="bi bi-printer me-1"></i> Print Audit Report
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
            <p className="small text-muted mb-0">Operations & Asset Management Department</p>
            <p className="small text-muted mb-0">Official Equipment Inventory Audit & Valuation Report</p>
          </div>
          <div className="text-end">
            <h2 className="document-title mb-1">INVENTORY AUDIT</h2>
            <div className="small text-muted">Generated: {formatDate(new Date())}</div>
          </div>
        </div>

        {/* Executive Summary Cards */}
        <div className="row g-3 mb-4">
          <div className="col-3">
            <div className="p-2 border rounded text-center bg-light">
              <div className="text-muted small">Total Assets</div>
              <div className="fs-5 fw-bold text-dark">{summary?.totalItems || inventoryData?.length || 0}</div>
            </div>
          </div>
          <div className="col-3">
            <div className="p-2 border rounded text-center bg-light">
              <div className="text-muted small">Total Valuation</div>
              <div className="fs-5 fw-bold text-dark">{formatCurrency(summary?.totalValuation || 0)}</div>
            </div>
          </div>
          <div className="col-3">
            <div className="p-2 border rounded text-center bg-light">
              <div className="text-muted small">Available in Vault</div>
              <div className="fs-5 fw-bold text-success">{summary?.statusCounts?.AVAILABLE || 0}</div>
            </div>
          </div>
          <div className="col-3">
            <div className="p-2 border rounded text-center bg-light">
              <div className="text-muted small">Active on Loan</div>
              <div className="fs-5 fw-bold text-warning">{summary?.statusCounts?.BORROWED || 0}</div>
            </div>
          </div>
        </div>

        {/* Inventory Table */}
        <table className="table table-bordered mb-4" style={{ fontSize: '9pt' }}>
          <thead className="table-light">
            <tr>
              <th style={{ width: '35px' }}>#</th>
              <th style={{ width: '85px' }}>Asset Tag</th>
              <th>Item Name & Model</th>
              <th>Category</th>
              <th>Serial Number</th>
              <th>Location</th>
              <th style={{ width: '85px' }}>Status</th>
              <th className="text-end" style={{ width: '90px' }}>Value</th>
            </tr>
          </thead>
          <tbody>
            {inventoryData?.map((item, idx) => (
              <tr key={item.id}>
                <td>{idx + 1}</td>
                <td className="fw-bold">{item.assetTag}</td>
                <td>
                  <strong>{item.name}</strong>
                  <div className="text-muted small">{item.brand} {item.model}</div>
                </td>
                <td>{item.category?.name || '—'}</td>
                <td className="text-nowrap">{item.serialNumber}</td>
                <td>{item.location || 'Vault'}</td>
                <td>
                  <span className="badge bg-light text-dark border">
                    {item.status}
                  </span>
                </td>
                <td className="text-end fw-semibold">
                  {formatCurrency(item.purchasePrice)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Sign-off */}
        <div className="signature-block">
          <div className="flex-fill">
            <div className="signature-line">
              <div className="small text-muted">Stock Controller / Audit Lead</div>
            </div>
          </div>
          <div className="flex-fill">
            <div className="signature-line">
              <div className="small text-muted">Operations Director / Admin Approval</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryReportPrintDocument;
