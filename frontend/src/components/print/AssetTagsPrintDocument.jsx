import React from 'react';
import { triggerPrint, exportPDF } from '../../utils/printHelper';

const AssetTagsPrintDocument = ({ equipmentList = [] }) => {
  const docId = 'asset-tags-sheet';

  return (
    <div>
      {/* Control Actions */}
      <div className="d-flex justify-content-between align-items-center mb-3 no-print">
        <p className="text-muted small mb-0">
          Showing {equipmentList.length} equipment asset label(s) formatted for standard A4 sticker sheet printing.
        </p>
        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={() => exportPDF(docId, 'Equipment-Asset-Tags.pdf')}
          >
            <i className="bi bi-file-earmark-pdf me-1"></i> Export PDF
          </button>
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={triggerPrint}
          >
            <i className="bi bi-printer me-1"></i> Print Sticker Sheet
          </button>
        </div>
      </div>

      {/* Printable Sheet */}
      <div id={docId} className="bg-white p-3 border rounded">
        <div className="asset-tags-sheet row g-3">
          {equipmentList.map((item) => (
            <div key={item.id} className="col-4">
              <div
                className="asset-tag-label p-2 border rounded text-center bg-white"
                style={{
                  minHeight: '180px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  border: '1.5px solid #1e293b'
                }}
              >
                {/* Header */}
                <div className="d-flex justify-content-between align-items-center border-bottom pb-1 mb-1">
                  <span className="fw-bold text-uppercase" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>
                    CINEVAULT
                  </span>
                  <span className="badge bg-dark" style={{ fontSize: '0.65rem' }}>
                    {item.assetTag}
                  </span>
                </div>

                {/* QR Code */}
                <div className="my-1">
                  {item.qrCode ? (
                    <img
                      src={item.qrCode}
                      alt={item.assetTag}
                      style={{ width: '90px', height: '90px', objectFit: 'contain' }}
                    />
                  ) : (
                    <div style={{ width: '90px', height: '90px', margin: '0 auto', border: '1px dashed #ccc' }}></div>
                  )}
                </div>

                {/* Details */}
                <div className="border-top pt-1 text-center">
                  <div className="fw-bold text-dark text-truncate" style={{ fontSize: '0.72rem' }}>
                    {item.name}
                  </div>
                  <div className="text-muted" style={{ fontSize: '0.65rem' }}>
                    SN: {item.serialNumber}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AssetTagsPrintDocument;
