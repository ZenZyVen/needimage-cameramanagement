import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { lookupEquipment } from '../../services/equipmentService';

const QRScannerModal = ({ show, onHide, onScanSuccess }) => {
  const [manualCode, setManualCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [scannedItem, setScannedItem] = useState(null);
  const scannerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    let html5QrcodeScanner = null;

    if (show) {
      setErrorMsg('');
      setScannedItem(null);
      setManualCode('');

      // Initialize camera scanner after modal renders
      const timer = setTimeout(() => {
        try {
          const qrElement = document.getElementById('qr-camera-reader');
          if (qrElement) {
            html5QrcodeScanner = new Html5QrcodeScanner(
              'qr-camera-reader',
              { fps: 10, qrbox: { width: 220, height: 220 } },
              false
            );

            html5QrcodeScanner.render(
              (decodedText) => {
                handleCodeIdentified(decodedText);
              },
              (errorMessage) => {
                // scanning frame error, normal while looking for QR
              }
            );
            scannerRef.current = html5QrcodeScanner;
          }
        } catch (err) {
          console.warn('Could not launch camera scanner:', err);
        }
      }, 300);

      return () => {
        clearTimeout(timer);
        if (scannerRef.current) {
          scannerRef.current.clear().catch(e => console.warn(e));
        }
      };
    }
  }, [show]);

  const handleCodeIdentified = async (code) => {
    if (!code || loading) return;
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await lookupEquipment(code);
      if (res.data?.success && res.data.data) {
        setScannedItem(res.data.data);
        if (onScanSuccess) {
          onScanSuccess(res.data.data);
        }
      } else {
        setErrorMsg(`Item not found for code "${code}".`);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || `Equipment with code "${code}" was not found.`);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleCodeIdentified(manualCode.trim());
    }
  };

  const handleGoToEquipment = () => {
    if (scannedItem) {
      onHide();
      navigate(`/equipment?search=${encodeURIComponent(scannedItem.assetTag)}`);
    }
  };

  const handleGoToCheckout = () => {
    if (scannedItem) {
      onHide();
      navigate(`/checkin-out?tab=checkout&code=${encodeURIComponent(scannedItem.assetTag)}`);
    }
  };

  const handleGoToCheckin = () => {
    if (scannedItem) {
      onHide();
      navigate(`/checkin-out?tab=checkin&code=${encodeURIComponent(scannedItem.assetTag)}`);
    }
  };

  if (!show) return null;

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow">
          <div className="modal-header bg-slate-900 text-white" style={{ backgroundColor: '#1e293b' }}>
            <h6 className="modal-title fw-bold text-white mb-0 d-flex align-items-center gap-2">
              <i className="bi bi-qr-code-scan text-primary"></i>
              Equipment QR / Barcode Scanner
            </h6>
            <button
              type="button"
              className="modal-close-btn"
              onClick={onHide}
              aria-label="Close"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          <div className="modal-body p-4">
            {/* Scanned Result Card */}
            {scannedItem ? (
              <div className="card border border-success-subtle bg-white shadow-sm p-3 mb-3">
                <div className="d-flex align-items-center justify-content-between mb-2 pb-2 border-bottom">
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-success-subtle text-success border border-success-subtle fw-bold">
                      <i className="bi bi-check-circle me-1"></i> VERIFIED ASSET
                    </span>
                    <span className="badge bg-slate-900 text-white font-monospace">{scannedItem.assetTag}</span>
                  </div>
                  <span className={`badge ${
                    scannedItem.status === 'AVAILABLE' ? 'bg-success' :
                    scannedItem.status === 'BORROWED' ? 'bg-warning text-dark' :
                    scannedItem.status === 'UNDER_MAINTENANCE' ? 'bg-info' : 'bg-danger'
                  }`}>
                    {scannedItem.status}
                  </span>
                </div>

                <div className="d-flex align-items-center gap-3 mb-2">
                  {scannedItem.imageUrl ? (
                    <img
                      src={scannedItem.imageUrl}
                      alt={scannedItem.name}
                      className="rounded border object-fit-cover flex-shrink-0"
                      style={{ width: '64px', height: '64px' }}
                    />
                  ) : (
                    <div className="bg-light rounded border d-flex align-items-center justify-content-center text-muted flex-shrink-0" style={{ width: '64px', height: '64px' }}>
                      <i className="bi bi-camera fs-3"></i>
                    </div>
                  )}

                  <div className="flex-grow-1 overflow-hidden">
                    <h6 className="fw-bold text-dark mb-1 text-truncate">{scannedItem.name}</h6>
                    <div className="small text-muted">
                      <span>{scannedItem.brand} {scannedItem.model}</span>
                      <span className="ms-2 font-monospace">SN: {scannedItem.serialNumber || '—'}</span>
                    </div>
                    <div className="d-flex gap-2 align-items-center mt-1 flex-wrap">
                      <span className="badge bg-light text-secondary border" style={{ fontSize: '0.68rem' }}>
                        {scannedItem.category?.name || 'General Gear'}
                      </span>
                      <span className="badge bg-light text-dark border" style={{ fontSize: '0.68rem' }}>
                        Condition: {scannedItem.condition || 'GOOD'}
                      </span>
                      <span className="badge bg-light text-primary border" style={{ fontSize: '0.68rem' }}>
                        Stock: {scannedItem.availableQuantity !== undefined ? scannedItem.availableQuantity : 1} / {scannedItem.quantity || 1} units
                      </span>
                    </div>
                  </div>
                </div>

                {/* Current Active Loan Info if Borrowed */}
                {scannedItem.borrowItems && scannedItem.borrowItems.length > 0 && (
                  <div className="p-2 border rounded bg-warning-subtle text-dark small mb-2">
                    <div className="fw-bold mb-1">
                      <i className="bi bi-person-badge me-1"></i> Current Borrower: {scannedItem.borrowItems[0].request?.user?.name || 'Production Crew'}
                    </div>
                    <div>
                      Project: {scannedItem.borrowItems[0].request?.project?.title || 'Standalone Shoot'}
                    </div>
                  </div>
                )}

                <div className="d-flex gap-2 mt-2 flex-wrap">
                  <button className="btn btn-sm btn-outline-primary" onClick={handleGoToEquipment}>
                    <i className="bi bi-info-circle me-1"></i> View Vault Details
                  </button>
                  {scannedItem.status === 'AVAILABLE' && (
                    <button className="btn btn-sm btn-primary" onClick={handleGoToCheckout}>
                      <i className="bi bi-box-arrow-right me-1"></i> Fast Checkout
                    </button>
                  )}
                  {scannedItem.status === 'BORROWED' && (
                    <button className="btn btn-sm btn-success text-white" onClick={handleGoToCheckin}>
                      <i className="bi bi-box-arrow-in-left me-1"></i> Fast Check-in
                    </button>
                  )}
                </div>
              </div>
            ) : null}

            {errorMsg && (
              <div className="alert alert-danger py-2 small mb-3">
                <i className="bi bi-exclamation-circle me-1"></i> {errorMsg}
              </div>
            )}

            {/* Live Camera Scanner Box */}
            <div className="mb-4">
              <p className="small text-muted mb-2">
                Scan via webcam/mobile camera or point your handheld barcode scanner:
              </p>
              <div
                id="qr-camera-reader"
                style={{
                  width: '100%',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0'
                }}
              ></div>
            </div>

            {/* Manual input / USB scanner input */}
            <form onSubmit={handleManualSubmit}>
              <label className="form-label small fw-semibold text-secondary">
                Or Type Asset Tag / Serial / Barcode:
              </label>
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Asset Tag or Serial Number"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  autoFocus
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading || !manualCode.trim()}
                >
                  {loading ? (
                    <span className="spinner-border spinner-border-sm"></span>
                  ) : (
                    'Lookup'
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="modal-footer bg-light py-2">
            <button type="button" className="btn btn-sm btn-secondary" onClick={onHide}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScannerModal;
