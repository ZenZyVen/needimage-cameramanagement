import React, { useState, useEffect } from 'react';
import { getEquipment } from '../services/equipmentService';
import AssetTagsPrintDocument from '../components/print/AssetTagsPrintDocument';
import QRScannerModal from '../components/common/QRScannerModal';

const QRScannerPage = () => {
  const [equipmentList, setEquipmentList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    loadEquipment();
  }, [search]);

  const loadEquipment = async () => {
    try {
      setLoading(true);
      const res = await getEquipment({ search: search.trim() || undefined, limit: 100 });
      if (res.data?.success) {
        setEquipmentList(res.data.data || []);
      }
    } catch (err) {
      console.warn('Error loading equipment for tags:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-2">
        <div>
          <h4 className="fw-bold text-dark mb-0">Asset Tag Printing</h4>
        </div>

        <button
          type="button"
          className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
          onClick={() => setShowScanner(true)}
        >
          <i className="bi bi-qr-code-scan"></i>
          <span>Open Live Camera Scanner</span>
        </button>
      </div>

      {/* Filter toolbar */}
      <div className="card mb-4 no-print">
        <div className="card-body p-3">
          <div className="row g-2 align-items-center">
            <div className="col-md-6">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-white border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Filter equipment by tag, name, or serial number..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-6 text-md-end text-muted small">
              Showing {equipmentList.length} items ready for adhesive sheet printing
            </div>
          </div>
        </div>
      </div>

      {/* Printable Sheet Component */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="text-muted small mt-2">Loading asset tags...</p>
        </div>
      ) : (
        <AssetTagsPrintDocument equipmentList={equipmentList} />
      )}

      {/* Live QR Scanner Modal */}
      <QRScannerModal
        show={showScanner}
        onHide={() => setShowScanner(false)}
      />
    </div>
  );
};

export default QRScannerPage;
