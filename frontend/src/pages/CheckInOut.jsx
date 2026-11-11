import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRequests } from '../services/requestService';
import { checkoutItems, checkinItems, getCheckInOutHistory } from '../services/checkInOutService';
import { lookupEquipment } from '../services/equipmentService';
import CheckoutModal from '../components/checkinout/CheckoutModal';
import CheckinModal from '../components/checkinout/CheckinModal';
import HandoverPrintDocument from '../components/print/HandoverPrintDocument';
import ReturnPrintDocument from '../components/print/ReturnPrintDocument';
import StatusBadge from '../components/common/StatusBadge';
import { formatDate, formatDateTime } from '../utils/formatters';

const CheckInOut = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'checkout'); // 'checkout', 'checkin', 'history'
  const [approvedRequests, setApprovedRequests] = useState([]);
  const [activeLoans, setActiveLoans] = useState([]);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [checkoutReq, setCheckoutReq] = useState(null);
  const [checkoutSingleEq, setCheckoutSingleEq] = useState(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  const [checkinReq, setCheckinReq] = useState(null);
  const [checkinSingleEq, setCheckinSingleEq] = useState(null);
  const [showCheckinModal, setShowCheckinModal] = useState(false);

  // Print vouchers
  const [printHandoverReq, setPrintHandoverReq] = useState(null);
  const [printReturnReq, setPrintReturnReq] = useState(null);

  const [alertMsg, setAlertMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    loadData();

    // Check if code was passed in URL query from scanner
    const code = searchParams.get('code');
    if (code) {
      lookupEquipment(code)
        .then(res => {
          if (res.data?.success && res.data.data) {
            const eq = res.data.data;
            if (eq.status === 'AVAILABLE') {
              setCheckoutSingleEq(eq);
              setShowCheckoutModal(true);
            } else if (eq.status === 'BORROWED') {
              setCheckinSingleEq(eq);
              setShowCheckinModal(true);
            }
          }
        })
        .catch(err => console.warn(err));
    }
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'checkout') {
        const res = await getRequests({ status: 'APPROVED' });
        if (res.data?.success) setApprovedRequests(res.data.data || []);
      } else if (activeTab === 'checkin') {
        const res = await getRequests({ status: 'CHECKED_OUT' });
        if (res.data?.success) setActiveLoans(res.data.data || []);
      } else {
        const res = await getCheckInOutHistory({ limit: 100 });
        if (res.data?.success) setHistoryLogs(res.data.data || []);
      }
    } catch (err) {
      console.warn('Error fetching tab data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckoutSubmit = async (payload) => {
    const res = await checkoutItems(payload);
    setAlertMsg({ type: 'success', text: 'Equipment checkout recorded. Status changed to BORROWED.' });
    loadData();
    if (checkoutReq) {
      setPrintHandoverReq(checkoutReq);
    }
  };

  const handleCheckinSubmit = async (payload) => {
    const res = await checkinItems(payload);
    setAlertMsg({ type: 'success', text: 'Equipment check-in and inspection recorded. Status updated.' });
    loadData();
    if (checkinReq) {
      setPrintReturnReq(checkinReq);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-2">
        <div>
          <h4 className="fw-bold text-dark mb-0">Checkout & Check-in</h4>
        </div>
      </div>

      {alertMsg.text && (
        <div className={`alert alert-${alertMsg.type} alert-dismissible fade show py-2 small mb-3`} role="alert">
          {alertMsg.text}
          <button type="button" className="btn-close py-2" onClick={() => setAlertMsg({ type: '', text: '' })}></button>
        </div>
      )}

      {/* Tabs */}
      <div className="card mb-4 border-bottom-0">
        <div className="card-header bg-white p-0">
          <ul className="nav nav-tabs card-header-tabs m-0">
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link py-3 px-4 fw-semibold ${activeTab === 'checkout' ? 'active text-primary' : 'text-secondary'}`}
                onClick={() => setActiveTab('checkout')}
              >
                <i className="bi bi-box-arrow-right me-2"></i>
                1. Handover (Checkout) Queue
              </button>
            </li>
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link py-3 px-4 fw-semibold ${activeTab === 'checkin' ? 'active text-success' : 'text-secondary'}`}
                onClick={() => setActiveTab('checkin')}
              >
                <i className="bi bi-box-arrow-in-left me-2"></i>
                2. Return (Check-in & Inspection)
              </button>
            </li>
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link py-3 px-4 fw-semibold ${activeTab === 'history' ? 'active text-dark' : 'text-secondary'}`}
                onClick={() => setActiveTab('history')}
              >
                <i className="bi bi-clock-history me-2"></i>
                3. Historical Handover Logs
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="text-muted small mt-2">Loading operations queue...</p>
        </div>
      ) : activeTab === 'checkout' ? (
        /* TAB 1: CHECKOUT QUEUE */
        <div>
          {approvedRequests.length === 0 ? (
            <div className="card text-center py-5">
              <div className="card-body">
                <i className="bi bi-check2-circle fs-1 text-success d-block mb-2"></i>
                <h6 className="fw-bold text-dark">No approved requests awaiting handover</h6>
                <p className="text-muted small">
                  All approved requisitions have been released or no new requests are currently in approved state.
                </p>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="table-responsive">
                <table className="table table-custom">
                  <thead>
                    <tr>
                      <th>Request #</th>
                      <th>Borrower & Department</th>
                      <th>Project Title</th>
                      <th>Scheduled Return</th>
                      <th>Gear Items to Handover</th>
                      <th className="text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvedRequests.map(req => (
                      <tr key={req.id}>
                        <td className="fw-bold text-dark">{req.requestNumber}</td>
                        <td>
                          <div className="fw-semibold text-dark">{req.user?.name}</div>
                          <div className="small text-muted">{req.user?.department || 'Production'}</div>
                        </td>
                        <td>
                          <div className="fw-semibold text-dark">{req.project?.title || 'Production'}</div>
                          <div className="small text-muted">{req.destination || 'Studio'}</div>
                        </td>
                        <td className="small text-danger fw-medium">{formatDate(req.endDate)}</td>
                        <td>
                          <div className="d-flex flex-wrap gap-1">
                            {req.items?.map(i => (
                              <span key={i.id} className="accessory-badge">
                                {i.equipment?.assetTag} - {i.equipment?.name}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="text-end">
                          <button
                            type="button"
                            className="btn btn-sm btn-primary"
                            onClick={() => {
                              setCheckoutReq(req);
                              setCheckoutSingleEq(null);
                              setShowCheckoutModal(true);
                            }}
                          >
                            <i className="bi bi-box-arrow-right me-1"></i> Release & Handover
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : activeTab === 'checkin' ? (
        /* TAB 2: CHECKIN QUEUE */
        <div>
          {activeLoans.length === 0 ? (
            <div className="card text-center py-5">
              <div className="card-body">
                <i className="bi bi-shield-check fs-1 text-muted d-block mb-2"></i>
                <h6 className="fw-bold text-dark">No active loans awaiting return</h6>
                <p className="text-muted small">
                  All equipment items are safely stored in the vault or no loans are currently active.
                </p>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="table-responsive">
                <table className="table table-custom">
                  <thead>
                    <tr>
                      <th>Request #</th>
                      <th>Borrower</th>
                      <th>Project</th>
                      <th>Due Date</th>
                      <th>Checked Out Items</th>
                      <th className="text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeLoans.map(req => {
                      const isOverdue = new Date(req.endDate) < new Date();
                      return (
                        <tr key={req.id} className={isOverdue ? 'table-warning' : ''}>
                          <td className="fw-bold text-dark">
                            {req.requestNumber}
                            {isOverdue && (
                              <span className="badge bg-danger ms-2" style={{ fontSize: '0.65rem' }}>OVERDUE</span>
                            )}
                          </td>
                          <td>
                            <div className="fw-semibold text-dark">{req.user?.name}</div>
                            <div className="small text-muted">{req.user?.phone || req.user?.email}</div>
                          </td>
                          <td>
                            <div className="fw-semibold text-dark">{req.project?.title || 'Production'}</div>
                          </td>
                          <td className={`small ${isOverdue ? 'text-danger fw-bold' : 'text-secondary'}`}>
                            {formatDate(req.endDate)}
                          </td>
                          <td>
                            <div className="d-flex flex-wrap gap-1">
                              {req.items?.map(i => (
                                <span key={i.id} className="accessory-badge">
                                  {i.equipment?.assetTag}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="text-end">
                            <button
                              type="button"
                              className="btn btn-sm btn-success text-white"
                              onClick={() => {
                                setCheckinReq(req);
                                setCheckinSingleEq(null);
                                setShowCheckinModal(true);
                              }}
                            >
                              <i className="bi bi-box-arrow-in-left me-1"></i> Inspect & Return
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* TAB 3: HISTORY LOGS */
        <div className="card">
          <div className="table-responsive">
            <table className="table table-custom">
              <thead>
                <tr>
                  <th>Action Type</th>
                  <th>Timestamp</th>
                  <th>Equipment Item</th>
                  <th>Borrower</th>
                  <th>Vault Staff</th>
                  <th>Condition Logged</th>
                  <th>Inspection Notes</th>
                </tr>
              </thead>
              <tbody>
                {historyLogs.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-4 text-muted small">
                      No handover actions recorded yet.
                    </td>
                  </tr>
                ) : (
                  historyLogs.map(log => (
                    <tr key={log.id}>
                      <td>
                        <span
                          className={`badge ${
                            log.type === 'CHECK_OUT' ? 'bg-primary' : 'bg-success'
                          }`}
                        >
                          {log.type === 'CHECK_OUT' ? 'CHECKOUT' : 'RETURN'}
                        </span>
                      </td>
                      <td className="small text-nowrap">{formatDateTime(log.actionDate)}</td>
                      <td>
                        <strong className="text-dark">{log.equipment?.assetTag}</strong> - {log.equipment?.name}
                      </td>
                      <td>{log.borrowerName || 'Staff'}</td>
                      <td>{log.handledBy?.name}</td>
                      <td>
                        <span className="badge bg-light text-secondary border">
                          {log.conditionAtAction}
                        </span>
                      </td>
                      <td className="small text-truncate" style={{ maxWidth: '200px' }}>
                        {log.damageReported ? (
                          <span className="text-danger fw-semibold">
                            <i className="bi bi-exclamation-triangle me-1"></i>
                            {log.damageNotes}
                          </span>
                        ) : (
                          log.notes || 'Normal'
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      <CheckoutModal
        show={showCheckoutModal}
        onHide={() => setShowCheckoutModal(false)}
        request={checkoutReq}
        equipment={checkoutSingleEq}
        onSubmit={handleCheckoutSubmit}
      />

      {/* Checkin Modal */}
      <CheckinModal
        show={showCheckinModal}
        onHide={() => setShowCheckinModal(false)}
        request={checkinReq}
        equipment={checkinSingleEq}
        onSubmit={handleCheckinSubmit}
      />

      {/* Handover Print Preview Modal */}
      {printHandoverReq && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)' }}>
          <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header py-2 px-3 bg-light border-bottom no-print">
                <h6 className="modal-title fw-bold text-dark mb-0">
                  <i className="bi bi-printer me-2 text-primary"></i>
                  Handover Voucher Ready for Printing
                </h6>
                <button type="button" className="btn-close" onClick={() => setPrintHandoverReq(null)}></button>
              </div>
              <div className="modal-body p-4">
                <HandoverPrintDocument request={printHandoverReq} staffUser={user} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Return Print Preview Modal */}
      {printReturnReq && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)' }}>
          <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header py-2 px-3 bg-light border-bottom no-print">
                <h6 className="modal-title fw-bold text-dark mb-0">
                  <i className="bi bi-printer me-2 text-success"></i>
                  Return Voucher Ready for Printing
                </h6>
                <button type="button" className="btn-close" onClick={() => setPrintReturnReq(null)}></button>
              </div>
              <div className="modal-body p-4">
                <ReturnPrintDocument request={printReturnReq} staffUser={user} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckInOut;
