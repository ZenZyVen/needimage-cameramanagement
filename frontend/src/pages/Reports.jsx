import React, { useState, useEffect } from 'react';
import { getInventoryReport, getLoansReport, getMaintenanceReport } from '../services/reportService';
import InventoryReportPrintDocument from '../components/print/InventoryReportPrintDocument';
import { formatCurrency, formatDate } from '../utils/formatters';

const Reports = () => {
  const [activeReport, setActiveReport] = useState('inventory'); // 'inventory', 'loans', 'maintenance'
  const [inventoryData, setInventoryData] = useState([]);
  const [inventorySummary, setInventorySummary] = useState(null);
  const [loansData, setLoansData] = useState([]);
  const [maintenanceData, setMaintenanceData] = useState([]);
  const [maintenanceSummary, setMaintenanceSummary] = useState(null);
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
      } else {
        const res = await getMaintenanceReport();
        if (res.data?.success) {
          setMaintenanceData(res.data.data || []);
          setMaintenanceSummary(res.data.summary || {});
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
      ) : (
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
      )}
    </div>
  );
};

export default Reports;
