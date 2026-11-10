import React from 'react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { triggerPrint, exportPDF } from '../../utils/printHelper';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';

const InventoryReportPrintDocument = ({ inventoryData, summary }) => {
  const { settings } = useSettings();
  const { user } = useAuth();
  const docId = 'inventory-audit-report';

  const totalAssets = inventoryData?.length || 0;
  const totalStockUnits = summary?.totalStockUnits || inventoryData?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0;
  const totalAvailUnits = summary?.totalAvailableUnits || inventoryData?.reduce((sum, item) => sum + (item.availableQuantity !== undefined ? item.availableQuantity : 1), 0) || 0;
  const totalValuation = summary?.totalValuation || inventoryData?.reduce((sum, item) => sum + (item.purchasePrice || 0) * (item.quantity || 1), 0) || 0;

  const inspectorName = user?.name || 'Authorized Vault Inspector';
  const inspectorRole = user?.roleNote || user?.role || settings?.defaultInspectorTitle || 'Stock Controller';
  const inspectorSignature = user?.signatureUrl;

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
          <i className="bi bi-printer me-1"></i> Print Official Audit
        </button>
      </div>

      <div className="printable-document p-4 bg-white" id={docId} style={{ minHeight: '1120px', position: 'relative' }}>
        {/* Header with Dynamic Company Branding */}
        <div className="document-header pb-3 mb-3 border-bottom d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-3">
            <img
              src={settings?.logoUrl || '/logo.svg'}
              alt={settings?.companyName || 'CineVault'}
              style={{ width: '48px', height: '48px', objectFit: 'contain' }}
            />
            <div>
              <div className="fw-bold fs-5 text-dark text-uppercase" style={{ letterSpacing: '0.04em' }}>
                {settings?.companyName || 'CineVault Media Production Studios'}
              </div>
              <p className="small text-muted mb-0">{settings?.companyTagline || 'Professional Camera Equipment & Stock Vault'}</p>
              <p className="small text-muted mb-0" style={{ fontSize: '0.72rem' }}>
                {settings?.address || 'Studio Lot 4B, Media Arts District'} • {settings?.email || 'vault@cinevault.com'} • {settings?.phone || '+1 555-019-2831'}
              </p>
            </div>
          </div>
          <div className="text-end">
            <h2 className="document-title mb-1 fw-bold text-dark" style={{ letterSpacing: '0.05em' }}>INVENTORY AUDIT</h2>
            <div className="badge bg-slate-900 text-white px-2 py-1" style={{ fontSize: '0.75rem' }}>OFFICIAL RECORD</div>
            <div className="small text-muted mt-1" style={{ fontSize: '0.75rem' }}>Audit Date: {formatDate(new Date())}</div>
          </div>
        </div>

        {/* Executive Summary Cards */}
        <div className="row g-2 mb-4">
          <div className="col">
            <div className="p-2 border rounded text-center bg-light">
              <div className="text-muted small" style={{ fontSize: '0.7rem' }}>Total Asset Models</div>
              <div className="fs-5 fw-bold text-dark">{totalAssets}</div>
            </div>
          </div>
          <div className="col">
            <div className="p-2 border rounded text-center bg-light">
              <div className="text-muted small" style={{ fontSize: '0.7rem' }}>Total Stock Units</div>
              <div className="fs-5 fw-bold text-primary">{totalStockUnits}</div>
            </div>
          </div>
          <div className="col">
            <div className="p-2 border rounded text-center bg-light">
              <div className="text-muted small" style={{ fontSize: '0.7rem' }}>Available in Vault</div>
              <div className="fs-5 fw-bold text-success">{totalAvailUnits}</div>
            </div>
          </div>
          <div className="col">
            <div className="p-2 border rounded text-center bg-light">
              <div className="text-muted small" style={{ fontSize: '0.7rem' }}>On Loan / In Use</div>
              <div className="fs-5 fw-bold text-warning">{totalStockUnits - totalAvailUnits}</div>
            </div>
          </div>
          <div className="col">
            <div className="p-2 border rounded text-center bg-light">
              <div className="text-muted small" style={{ fontSize: '0.7rem' }}>Total Stock Valuation</div>
              <div className="fs-5 fw-bold text-dark">{formatCurrency(totalValuation)}</div>
            </div>
          </div>
        </div>

        {/* Inventory Audit Table */}
        <table className="table table-bordered mb-4" style={{ fontSize: '8.5pt' }}>
          <thead className="table-light">
            <tr>
              <th style={{ width: '30px' }} className="text-center">#</th>
              <th style={{ width: '45px' }} className="text-center">Photo</th>
              <th style={{ width: '85px' }}>Asset Tag</th>
              <th>Equipment Name & Model</th>
              <th>Category</th>
              <th style={{ width: '90px' }}>Serial Number</th>
              <th className="text-center" style={{ width: '60px' }}>Stock</th>
              <th className="text-center" style={{ width: '60px' }}>Condition</th>
              <th style={{ width: '80px' }}>Status</th>
              <th className="text-end" style={{ width: '85px' }}>Est. Value</th>
            </tr>
          </thead>
          <tbody>
            {inventoryData?.map((item, idx) => (
              <tr key={item.id}>
                <td className="text-center text-muted">{idx + 1}</td>
                <td className="text-center p-1">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      style={{ width: '30px', height: '30px', objectFit: 'cover', borderRadius: '3px' }}
                    />
                  ) : (
                    <div style={{ width: '30px', height: '30px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#94a3b8' }}>
                      <i className="bi bi-camera"></i>
                    </div>
                  )}
                </td>
                <td className="fw-bold text-dark font-monospace">{item.assetTag}</td>
                <td>
                  <strong className="text-dark">{item.name}</strong>
                  <div className="text-muted" style={{ fontSize: '7.5pt' }}>{item.brand} {item.model}</div>
                </td>
                <td>{item.category?.name || 'General'}</td>
                <td className="font-monospace" style={{ fontSize: '7.5pt' }}>{item.serialNumber || '—'}</td>
                <td className="text-center font-monospace">
                  <span className="fw-bold">{item.availableQuantity !== undefined ? item.availableQuantity : 1}</span>
                  <span className="text-muted"> / {item.quantity || 1}</span>
                </td>
                <td className="text-center">
                  <span className="badge bg-light text-dark border px-1" style={{ fontSize: '7pt' }}>
                    {item.condition || 'GOOD'}
                  </span>
                </td>
                <td>
                  <span className="badge bg-light text-dark border px-1" style={{ fontSize: '7pt' }}>
                    {item.status}
                  </span>
                </td>
                <td className="text-end font-monospace fw-semibold">
                  {formatCurrency((item.purchasePrice || 0) * (item.quantity || 1))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Audit Sign-off Block */}
        <div className="signature-block mt-4 pt-3 border-top d-flex justify-content-between align-items-end">
          <div className="flex-fill pe-4">
            <div className="small text-muted mb-1">
              <strong>Audit Verification:</strong> The stock controller and vault inspector certify that the equipment items listed above have been physically inspected, counted, and recorded in compliance with studio equipment management policies.
            </div>
            <div className="small text-muted font-monospace" style={{ fontSize: '7pt' }}>
              Document ID: AUD-{new Date().getFullYear()}-{Math.floor(1000 + Math.random() * 9000)} • Generated via CineVault System
            </div>
          </div>

          <div style={{ minWidth: '220px' }}>
            <div className="border-bottom pb-1 text-center" style={{ minHeight: '60px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center' }}>
              {inspectorSignature ? (
                <img
                  src={inspectorSignature}
                  alt="Inspector Signature"
                  style={{ maxHeight: '48px', maxWidth: '160px', objectFit: 'contain' }}
                />
              ) : (
                <span className="fst-italic text-muted small">[Digitally Verified Signature]</span>
              )}
            </div>
            <div className="text-center mt-1">
              <strong className="text-dark d-block small">{inspectorName}</strong>
              <span className="text-muted d-block" style={{ fontSize: '0.72rem' }}>{inspectorRole}</span>
              <span className="text-muted d-block" style={{ fontSize: '0.7rem' }}>Date: {formatDate(new Date())}</span>
            </div>
          </div>
        </div>

        {/* Page Footer */}
        <div className="d-flex justify-content-between align-items-center mt-4 pt-2 border-top text-muted" style={{ fontSize: '7.5pt' }}>
          <span>{settings?.companyName || 'CineVault Media Production Studios'} • Official Inventory Audit</span>
          <span>Confidential & Proprietary • Page 1 of 1</span>
        </div>
      </div>
    </div>
  );
};

export default InventoryReportPrintDocument;