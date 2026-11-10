import React, { useState, useEffect } from 'react';
import { getInventoryReport, getLoansReport, getMaintenanceReport, getCrewWorkReport } from '../services/reportService';
import InventoryReportPrintDocument from '../components/print/InventoryReportPrintDocument';
import { formatCurrency, formatDate } from '../utils/formatters';

const Reports = () => {
  const [activeReport, setActiveReport] = useState('inventory'); // 'inventory', 'loans', 'maintenance', 'crew-work'
  const [inventoryData, setInventoryData] = useState([]);
  const [inventorySummary, setInventorySummary] = useState(null);
  const [loansData, setLoansData] = useState([]);
  const [maintenanceData, setMaintenanceData] = useState([]);
  const [maintenanceSummary, setMaintenanceSummary] = useState(null);
  const [crewWorkData, setCrewWorkData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, [activeReport]);

  const loadReport = async () => {
    try {
      setLoading(true);
      if (activeReport === 'inventory') {
        const res = await getInventoryReport();
        if (res.data?.success) {
          setInventoryData(res.data.data || []);
          setInventorySummary(res.data.summary || {});
        }
      } else if (activeReport === 'loans') {
        const res = await getLoansReport();
        if (res.data?.success) {
          setLoansData(res.data.data || []);
        }
      } else if (activeReport === 'maintenance') {
        const res = await getMaintenanceReport();
        if (res.data?.success) {
          setMaintenanceData(res.data.data || []);
          setMaintenanceSummary(res.data.summary || {});
        }
      } else if (activeReport === 'crew-work') {
        const res = await getCrewWorkReport();
        if (res.data?.success) {
          setCrewWorkData(res.data);
        }
      }
    } catch (err) {
      console.warn('Error loading report data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-2">
        <div>
          <h4 className="fw-bold text-dark mb-1">Reports & Printable Documents</h4>
          <p className="text-muted small mb-0">
            Generate formal A4 print documents, inventory valuation sheets, and exportable financial logs.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="card mb-4 border-bottom-0">
        <div className="card-header bg-white p-0">
          <ul className="nav nav-tabs card-header-tabs m-0">
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link py-3 px-4 fw-semibold ${activeReport === 'inventory' ? 'active text-primary' : 'text-secondary'}`}
                onClick={() => setActiveReport('inventory')}
              >
                <i className="bi bi-card-checklist me-2"></i>
                Inventory Audit & Valuation
              </button>
            </li>
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link py-3 px-4 fw-semibold ${activeReport === 'loans' ? 'active text-primary' : 'text-secondary'}`}
                onClick={() => setActiveReport('loans')}
              >
                <i className="bi bi-clock-history me-2"></i>
                Loan Activity Report
              </button>
            </li>
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link py-3 px-4 fw-semibold ${activeReport === 'maintenance' ? 'active text-primary' : 'text-secondary'}`}
                onClick={() => setActiveReport('maintenance')}
              >
                <i className="bi bi-tools me-2"></i>
                Maintenance & Cost Report
              </button>
            </li>
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link py-3 px-4 fw-semibold ${activeReport === 'crew-work' ? 'active text-primary' : 'text-secondary'}`}
                onClick={() => setActiveReport('crew-work')}
              >
                <i className="bi bi-people-fill me-2 text-primary"></i>
                Field Work & Crew Performance
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Body */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="text-muted small mt-2">Compiling report data...</p>
        </div>
      ) : activeReport === 'inventory' ? (
        <InventoryReportPrintDocument
          inventoryData={inventoryData}
          summary={inventorySummary}
        />
      ) : activeReport === 'loans' ? (
        <div className="card">
          <div className="card-header bg-white d-flex justify-content-between align-items-center">
            <span className="fw-semibold small text-secondary">
              Equipment Loan Utilization Ledger ({loansData.length} records)
            </span>
          </div>
          <div className="table-responsive">
            <table className="table table-custom">
              <thead>
                <tr>
                  <th>Request #</th>
                  <th>Borrower</th>
                  <th>Department</th>
                  <th>Project</th>
                  <th>Start - Return</th>
                  <th>Gear Units</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loansData.map(req => (
                  <tr key={req.id}>
                    <td className="fw-bold">{req.requestNumber}</td>
                    <td>{req.user?.name}</td>
                    <td>{req.user?.department || 'Production'}</td>
                    <td>{req.project?.title || 'Standalone'}</td>
                    <td className="small">{formatDate(req.startDate)} - {formatDate(req.endDate)}</td>
                    <td>{req.items?.length || 0} unit(s)</td>
                    <td>
                      <span className="badge bg-light text-secondary border">
                        {req.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeReport === 'maintenance' ? (
        <div className="card">
          <div className="card-header bg-white d-flex justify-content-between align-items-center">
            <span className="fw-semibold small text-secondary">
              Maintenance Tickets & Repair Expenses (Total: {formatCurrency(maintenanceSummary?.totalExpenditure || 0)})
            </span>
          </div>
          <div className="table-responsive">
            <table className="table table-custom">
              <thead>
                <tr>
                  <th>Ticket #</th>
                  <th>Equipment Item</th>
                  <th>Issue Details</th>
                  <th>Vendor</th>
                  <th>Cost</th>
                  <th>Status</th>
                  <th>Reported Date</th>
                </tr>
              </thead>
              <tbody>
                {maintenanceData.map(ticket => (
                  <tr key={ticket.id}>
                    <td className="fw-bold">{ticket.ticketNumber}</td>
                    <td>
                      <strong>{ticket.equipment?.assetTag}</strong> - {ticket.equipment?.name}
                    </td>
                    <td>{ticket.issueTitle}</td>
                    <td>{ticket.vendor || 'In-House'}</td>
                    <td className="fw-semibold">{formatCurrency(ticket.cost)}</td>
                    <td>
                      <span className="badge bg-light text-secondary border">
                        {ticket.status}
                      </span>
                    </td>
                    <td className="small">{formatDate(ticket.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* TAB 4: FIELD WORK & CREW PERFORMANCE */
        <div>
          {/* Top KPI Cards */}
          <div className="row g-3 mb-4">
            <div className="col-sm-6 col-lg-3">
              <div className="card p-3 shadow-xs">
                <span className="small text-muted fw-semibold">Active Field Workers</span>
                <div className="fs-3 fw-bold text-dark mt-1">
                  {crewWorkData?.summary?.totalCrewMembers || 0}
                </div>
                <span className="small text-muted">Crew with recorded shoots</span>
              </div>
            </div>
            <div className="col-sm-6 col-lg-3">
              <div className="card p-3 shadow-xs">
                <span className="small text-muted fw-semibold">Total Shoots Logged</span>
                <div className="fs-3 fw-bold text-primary mt-1">
                  {crewWorkData?.summary?.totalShootsLogged || 0}
                </div>
                <span className="small text-muted">Production dispatches</span>
              </div>
            </div>
            <div className="col-sm-6 col-lg-3">
              <div className="card p-3 shadow-xs">
                <span className="small text-muted fw-semibold">Total Days in Field</span>
                <div className="fs-3 fw-bold text-success mt-1">
                  {crewWorkData?.summary?.totalDaysLogged || 0} days
                </div>
                <span className="small text-muted">Cumulative shoot duration</span>
              </div>
            </div>
            <div className="col-sm-6 col-lg-3">
              <div className="card p-3 shadow-xs">
                <span className="small text-muted fw-semibold">Top Field Performer</span>
                <div className="fs-5 fw-bold text-dark mt-2 text-truncate">
                  {crewWorkData?.summary?.topPerformer || 'None'}
                </div>
                <span className="badge bg-primary-subtle text-primary border border-primary-subtle mt-1" style={{ fontSize: '0.7rem' }}>
                  Rank #1 Lead
                </span>
              </div>
            </div>
          </div>

          {/* 1. Crew Performance Leaderboard */}
          <div className="card mb-4">
            <div className="card-header bg-white d-flex justify-content-between align-items-center py-3">
              <div>
                <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                  <i className="bi bi-trophy-fill text-warning"></i>
                  Crew & Borrower Performance Ranking (Most Active Workers)
                </h6>
                <small className="text-muted">Ranking by field deployment days, shoots completed, and gear handled</small>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => window.print()}
              >
                <i className="bi bi-printer me-1"></i> Print Manifest
              </button>
            </div>
            <div className="table-responsive">
              <table className="table table-custom align-middle">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>Rank</th>
                    <th>Crew Member</th>
                    <th>Department</th>
                    <th>Shoots / Projects</th>
                    <th>Gear Deployed</th>
                    <th>Days in Field</th>
                    <th>Gear Value Handled</th>
                    <th>Performance Badge</th>
                  </tr>
                </thead>
                <tbody>
                  {!crewWorkData?.crewLeaderboard?.length ? (
                    <tr>
                      <td colSpan="8" className="text-center py-4 text-muted small">
                        No field work records logged yet.
                      </td>
                    </tr>
                  ) : (
                    crewWorkData.crewLeaderboard.map((crew, idx) => (
                      <tr key={crew.userId}>
                        <td>
                          <span className={`badge ${
                            idx === 0
                              ? 'bg-warning text-dark'
                              : idx === 1
                              ? 'bg-secondary text-white'
                              : idx === 2
                              ? 'bg-dark text-white'
                              : 'bg-light text-secondary border'
                          }`} style={{ width: 26, height: 26, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            {idx + 1}
                          </span>
                        </td>
                        <td>
                          <div className="fw-bold text-dark">{crew.name}</div>
                          <div className="small text-muted">{crew.email}</div>
                        </td>
                        <td>
                          <span className="badge bg-light text-secondary border">{crew.department}</span>
                        </td>
                        <td className="fw-semibold text-dark">{crew.totalShoots} shoot(s)</td>
                        <td className="text-secondary">{crew.totalGearItems} item(s)</td>
                        <td>
                          <strong className="text-success">{crew.totalDaysInField} day(s)</strong>
                        </td>
                        <td className="small font-monospace text-dark">
                          {formatCurrency(crew.totalAssetValue)}
                        </td>
                        <td>
                          <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                            <i className="bi bi-award me-1"></i>{crew.rankBadge}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. Field Work Breakdown by Day */}
          <div className="row g-4">
            <div className="col-lg-7">
              <div className="card h-100">
                <div className="card-header bg-white py-3">
                  <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                    <i className="bi bi-calendar-check text-primary"></i>
                    Field Work Dispatch by Day (Timeline)
                  </h6>
                  <small className="text-muted">Activity, gear units in field, and crew out by date</small>
                </div>
                <div className="table-responsive">
                  <table className="table table-custom">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Shoots</th>
                        <th>Gear Units</th>
                        <th>Crew Dispatched</th>
                        <th>Project</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!crewWorkData?.workByDay?.length ? (
                        <tr>
                          <td colSpan="5" className="text-center py-4 text-muted small">
                            No day records recorded.
                          </td>
                        </tr>
                      ) : (
                        crewWorkData.workByDay.map((dayItem, idx) => (
                          <tr key={idx}>
                            <td className="fw-bold small text-nowrap">
                              <i className="bi bi-calendar2-day me-1 text-primary"></i>
                              {formatDate(dayItem.date)}
                            </td>
                            <td>
                              <span className="badge bg-primary-subtle text-primary">
                                {dayItem.shootsCount} shoot(s)
                              </span>
                            </td>
                            <td className="small text-dark fw-medium">
                              {dayItem.itemsDeployed} units
                            </td>
                            <td className="small text-muted">
                              {dayItem.crewMembers.join(', ') || '—'}
                            </td>
                            <td className="small text-truncate" style={{ maxWidth: 160 }}>
                              {dayItem.projects.join(', ') || '—'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 3. Most Utilized Gear */}
            <div className="col-lg-5">
              <div className="card h-100">
                <div className="card-header bg-white py-3">
                  <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                    <i className="bi bi-camera-fill text-primary"></i>
                    Most Deployed Production Gear
                  </h6>
                  <small className="text-muted">Equipment dispatched to the field most frequently</small>
                </div>
                <div className="table-responsive">
                  <table className="table table-custom">
                    <thead>
                      <tr>
                        <th>Asset Tag</th>
                        <th>Equipment Name</th>
                        <th className="text-end">Times Deployed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!crewWorkData?.topGear?.length ? (
                        <tr>
                          <td colSpan="3" className="text-center py-4 text-muted small">
                            No equipment usage logged yet.
                          </td>
                        </tr>
                      ) : (
                        crewWorkData.topGear.map(item => (
                          <tr key={item.id}>
                            <td>
                              <span className="badge bg-slate-900 text-white font-monospace" style={{ fontSize: '0.72rem' }}>
                                {item.assetTag}
                              </span>
                            </td>
                            <td>
                              <div className="fw-semibold text-dark small">{item.name}</div>
                              <div className="text-muted" style={{ fontSize: '0.7rem' }}>{item.brand}</div>
                            </td>
                            <td className="text-end">
                              <span className="badge bg-success-subtle text-success">
                                {item.timesDeployed} shoot(s)
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
