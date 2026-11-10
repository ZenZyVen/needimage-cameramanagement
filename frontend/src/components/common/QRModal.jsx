import React from 'react';
import { triggerPrint } from '../../utils/printHelper';

const QRModal = ({ show, onHide, equipment }) => {
  if (!show || !equipment) return null;

  const handleDownload = () => {
    if (!equipment.qrCode) return;
    const link = document.createElement('a');
    link.href = equipment.qrCode;
    link.download = `QR-${equipment.assetTag}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)' }}>
      <div className="modal-dialog modal-dialog-centered modal-sm">
        <div className="modal-content border-0 shadow">
          <div className="modal-header py-2 px-3 border-bottom">
            <h6 className="modal-title fw-bold text-secondary mb-0">
              <i className="bi bi-qr-code me-1 text-primary"></i>
              Equipment Asset Tag
            </h6>
            <button type="button" className="btn-close" onClick={onHide}></button>
          </div>

          <div className="modal-body text-center p-4">
            <div className="border p-3 rounded bg-white mb-3 shadow-sm d-inline-block">
              {equipment.qrCode ? (
                <img
                  src={equipment.qrCode}
                  alt={`QR for ${equipment.assetTag}`}
                  style={{ width: '180px', height: '180px', objectFit: 'contain' }}
                />
              ) : (
                <div className="p-4 text-muted small">No QR generated</div>
              )}
              <div className="mt-2 text-center">
                <span className="badge bg-dark px-3 py-1 fs-6">{equipment.assetTag}</span>
              </div>
            </div>

            <h6 className="fw-bold text-dark mb-1">{equipment.name}</h6>
            <p className="small text-muted mb-0">
              SN: <span className="text-secondary fw-semibold">{equipment.serialNumber}</span>
            </p>
            {equipment.location && (
              <p className="small text-muted mb-0">
                Location: <span className="text-secondary">{equipment.location}</span>
              </p>
            )}
          </div>

          <div className="modal-footer justify-content-center bg-light py-2">
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={handleDownload}>
              <i className="bi bi-download me-1"></i> Download
            </button>
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={() => {
                window.print();
              }}
            >
              <i className="bi bi-printer me-1"></i> Print Label
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRModal;
