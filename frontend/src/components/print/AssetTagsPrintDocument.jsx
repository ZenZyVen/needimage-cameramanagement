import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { triggerPrint, exportPDF } from '../../utils/printHelper';
import { useSettings } from '../../context/SettingsContext';

// Clean SVG Barcode Generator Component (Deterministic Code 128 style representation)
const BarcodeSVG = ({ value, width = 140, height = 36 }) => {
  if (!value) return null;

  // Generate pattern of bar widths from string hash/chars
  const bars = [];
  let currentX = 4;
  const barHeight = height - 12;

  // Start guard bars (thin, space, thick)
  bars.push({ x: currentX, w: 2 }); currentX += 3;
  bars.push({ x: currentX, w: 1 }); currentX += 2;
  bars.push({ x: currentX, w: 3 }); currentX += 5;

  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    const b1 = (code % 3) + 1;
    const s1 = ((code >> 1) % 2) + 1;
    const b2 = ((code >> 2) % 3) + 1;
    const s2 = ((code >> 3) % 2) + 1;

    bars.push({ x: currentX, w: b1 }); currentX += b1 + s1;
    bars.push({ x: currentX, w: b2 }); currentX += b2 + s2;
  }

  // Stop guard bars
  bars.push({ x: currentX, w: 3 }); currentX += 4;
  bars.push({ x: currentX, w: 1 }); currentX += 2;
  bars.push({ x: currentX, w: 2 }); currentX += 3;

  const totalWidth = Math.max(width, currentX + 6);

  return (
    <svg
      width={totalWidth}
      height={height}
      viewBox={`0 0 ${totalWidth} ${height}`}
      className="mx-auto"
      style={{ display: 'block' }}
    >
      <rect width={totalWidth} height={height} fill="#ffffff" />
      {bars.map((bar, idx) => (
        <rect
          key={idx}
          x={bar.x}
          y={2}
          width={bar.w}
          height={barHeight}
          fill="#0f172a"
        />
      ))}
      <text
        x={totalWidth / 2}
        y={height - 2}
        textAnchor="middle"
        fontSize="9"
        fontWeight="bold"
        fontFamily="monospace"
        fill="#0f172a"
      >
        *{value}*
      </text>
    </svg>
  );
};

const AssetTagsPrintDocument = ({ equipmentList = [] }) => {
  const { settings } = useSettings();
  const [selectedTag, setSelectedTag] = useState(null);
  const docId = 'asset-tags-sheet';

  const companyName = settings?.companyName || 'CineVault Media Studios';
  const logoUrl = settings?.logoUrl || '/logo.svg';

  return (
    <div>
      {/* Control Actions */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3 gap-2 no-print">
        <p className="text-muted small mb-0">
          Showing <strong>{equipmentList.length}</strong> equipment label(s) with high-res QR codes and barcodes for physical equipment tagging.
        </p>
        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={() => exportPDF(docId, `Equipment-Asset-Tags-${new Date().toISOString().slice(0, 10)}.pdf`)}
          >
            <i className="bi bi-file-earmark-pdf me-1"></i> Export PDF Sheet
          </button>
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={triggerPrint}
          >
            <i className="bi bi-printer me-1"></i> Print Label Sheet
          </button>
        </div>
      </div>

      {/* Printable Sheet */}
      <div id={docId} className="bg-white p-3 border rounded shadow-sm">
        <div className="row g-3">
          {equipmentList.map((item) => {
            const qrPayload = JSON.stringify({
              assetTag: item.assetTag,
              name: item.name,
              serial: item.serialNumber,
              system: 'CineVault'
            });

            return (
              <div key={item.id} className="col-12 col-md-6 col-lg-4">
                <div
                  className="asset-tag-label p-3 border rounded bg-white shadow-xs position-relative"
                  style={{
                    minHeight: '210px',
                    border: '1.5px solid #334155',
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  {/* Top Header: Company Logo & Name */}
                  <div className="d-flex justify-content-between align-items-center pb-2 mb-2 border-bottom">
                    <div className="d-flex align-items-center gap-2">
                      <img
                        src={logoUrl}
                        alt="Logo"
                        style={{ width: '22px', height: '22px', objectFit: 'contain' }}
                      />
                      <span className="fw-bold text-dark text-truncate" style={{ fontSize: '0.72rem', maxWidth: '140px', letterSpacing: '0.02em' }}>
                        {companyName}
                      </span>
                    </div>
                    <span className="badge bg-slate-900 text-white font-monospace px-2 py-1" style={{ fontSize: '0.7rem' }}>
                      {item.assetTag}
                    </span>
                  </div>

                  {/* Dual Code Section: Barcode + QR Code */}
                  <div className="d-flex align-items-center justify-content-between my-1 gap-2">
                    {/* QR Code */}
                    <div className="p-1 border rounded bg-light text-center flex-shrink-0">
                      <QRCodeSVG
                        value={qrPayload}
                        size={76}
                        level="M"
                        includeMargin={false}
                      />
                      <div className="text-muted" style={{ fontSize: '0.58rem', marginTop: '2px' }}>
                        SCAN QR
                      </div>
                    </div>

                    {/* Barcode SVG */}
                    <div className="flex-grow-1 text-center overflow-hidden">
                      <BarcodeSVG value={item.assetTag} width={135} height={42} />
                      <div className="text-muted" style={{ fontSize: '0.58rem', marginTop: '2px' }}>
                        1D BARCODE
                      </div>
                    </div>
                  </div>

                  {/* Gear Details Footer */}
                  <div className="border-top pt-2 mt-2">
                    <div className="fw-bold text-dark text-truncate" style={{ fontSize: '0.78rem' }}>
                      {item.name}
                    </div>
                    <div className="d-flex justify-content-between align-items-center text-muted" style={{ fontSize: '0.68rem' }}>
                      <span>{item.brand} {item.model}</span>
                      <span className="font-monospace">SN: {item.serialNumber || 'N/A'}</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mt-1">
                      <span className="badge bg-light text-secondary border px-1" style={{ fontSize: '0.62rem' }}>
                        {item.category?.name || 'Vault Gear'}
                      </span>
                      <span className="badge bg-light text-dark border px-1" style={{ fontSize: '0.62rem' }}>
                        {item.condition || 'GOOD'}
                      </span>
                    </div>
                  </div>

                  {/* Single Tag Download / Preview Button (no-print) */}
                  <button
                    type="button"
                    className="btn btn-xs btn-outline-secondary position-absolute top-0 end-0 m-1 no-print py-0 px-1"
                    title="Inspect Label"
                    onClick={() => setSelectedTag(item)}
                    style={{ fontSize: '0.65rem' }}
                  >
                    <i className="bi bi-zoom-in"></i>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Single Label Detail Modal */}
      {selectedTag && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-slate-900 text-white" style={{ backgroundColor: '#0f172a' }}>
                <h6 className="modal-title fw-bold text-white mb-0">Label Preview: {selectedTag.assetTag}</h6>
                <button type="button" className="btn-close btn-close-white" onClick={() => setSelectedTag(null)}></button>
              </div>
              <div className="modal-body p-4 text-center">
                <div className="p-3 border rounded bg-white shadow-sm mx-auto" style={{ maxWidth: '340px' }}>
                  <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <img src={logoUrl} alt="Logo" style={{ width: '24px', height: '24px' }} />
                      <strong className="small text-dark">{companyName}</strong>
                    </div>
                    <span className="badge bg-dark font-monospace">{selectedTag.assetTag}</span>
                  </div>

                  <div className="my-3">
                    <QRCodeSVG
                      value={JSON.stringify({ assetTag: selectedTag.assetTag, name: selectedTag.name, serial: selectedTag.serialNumber })}
                      size={120}
                      level="H"
                      className="mx-auto mb-2"
                    />
                    <BarcodeSVG value={selectedTag.assetTag} width={180} height={48} />
                  </div>

                  <div className="border-top pt-2 text-start">
                    <strong className="text-dark d-block">{selectedTag.name}</strong>
                    <div className="small text-muted">{selectedTag.brand} {selectedTag.model}</div>
                    <div className="small text-muted font-monospace">SN: {selectedTag.serialNumber}</div>
                  </div>
                </div>
              </div>
              <div className="modal-footer bg-light py-2">
                <button type="button" className="btn btn-sm btn-primary" onClick={triggerPrint}>
                  <i className="bi bi-printer me-1"></i> Print This Label
                </button>
                <button type="button" className="btn btn-sm btn-secondary" onClick={() => setSelectedTag(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetTagsPrintDocument;