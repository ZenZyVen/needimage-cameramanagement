import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { useAuth } from '../context/AuthContext';
import { getDashboardStats } from '../services/dashboardService';
import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import { formatCurrency, formatDate, formatDateTime } from '../utils/formatters';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const TIMEFRAMES = [
  { key: 'daily', label: 'Today' },
  { key: 'weekly', label: 'Past 7 Days' },
  { key: 'monthly', label: 'Past 30 Days' },
  { key: 'yearly', label: 'This Year' },
  { key: 'all', label: 'All Time' }
];

const Dashboard = () => {
  const { user, isAdmin, isStockController, isUser } = useAuth();
  const [timeframe, setTimeframe] = useState('monthly');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats(timeframe);
  }, [timeframe]);

  const fetchStats = async (selectedTimeframe = 'monthly') => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await getDashboardStats({ timeframe: selectedTimeframe });
      if (res.data?.success) {
        setData(res.data);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  const stats = data?.stats || {};
  const charts = data?.charts || {};
  const recentRequests = data?.recentRequests || [];
  const recentActivity = data?.recentActivity || [];
  const overdueLoans = data?.overdueLoans || [];
  const userStats = data?.userStats || {};

  // Studio Professional Palette
  const categoryBarData = {
    labels: charts.categoryChart?.labels || [],
    datasets: [
      {
        label: 'Stock Units',
        data: charts.categoryChart?.counts || [],
        backgroundColor: '#2563eb',
        borderRadius: 4
      }
    ]
  };

  const statusDoughnutData = {
    labels: charts.statusChart?.labels || ['Available', 'Borrowed / In Use', 'Under Maintenance', 'Damaged', 'Out of Stock'],
    datasets: [
      {
        data: charts.statusChart?.data || [0, 0, 0, 0, 0],
        backgroundColor: [
          '#10b981', // green Available
          '#f59e0b', // amber Borrowed / In Use
          '#0284c7', // blue Maintenance
          '#ef4444', // red Damaged
          '#64748b'  // slate Out of stock
        ],
        borderWidth: 1,
        borderColor: '#ffffff'
      }
    ]
  };

  return (
    <div className="pb-4">
      {/* Top Bar: Clean Title & Timeframe Controls */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <h4 className="fw-bold text-dark mb-0">Dashboard</h4>
        </div>

        {/* Timeframe selector & Quick Actions */}
        <div className="d-flex flex-wrap align-items-center gap-2">
          <div className="btn-group btn-group-sm bg-white p-1 rounded border shadow-xs" role="group">
            {TIMEFRAMES.map(tf => (
              <button
                key={tf.key}
                type="button"
                className={`btn btn-sm ${timeframe === tf.key ? 'btn-primary text-white' : 'btn-light text-dark'}`}
                style={{ fontSize: '0.74rem', fontWeight: timeframe === tf.key ? '600' : 'normal', padding: '0.25rem 0.65rem' }}
                onClick={() => setTimeframe(tf.key)}
              >
                {tf.label}
              </button>
            ))}
          </div>

          {/* Quick Action buttons */}
          {isUser && (
            <Link to="/requests" className="btn btn-primary btn-sm d-flex align-items-center gap-1 shadow-xs">
              <i className="bi bi-plus-lg"></i>
              <span>New Request</span>
            </Link>
          )}

          {(isAdmin || isStockController) && (
            <div className="d-flex align-items-center gap-2">
              <Link to="/low-stock" className="btn btn-outline-warning btn-sm d-flex align-items-center gap-1 shadow-xs text-dark" title="Low-Stock Critical Alerts">
                <i className="bi bi-exclamation-triangle-fill text-warning"></i>
                <span className="d-none d-sm-inline">Low Stock</span>
              </Link>
              <Link to="/stock-movements" className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1 shadow-xs" title="Stock Movements Log">
                <i className="bi bi-clock-history text-info"></i>
                <span className="d-none d-sm-inline">Movements</span>
              </Link>
              <Link to="/history" className="btn btn-outline-dark btn-sm d-flex align-items-center gap-1 shadow-xs" title="Complete Historical Records">
                <i className="bi bi-archive-fill"></i>
                <span className="d-none d-sm-inline">History</span>
              </Link>
              <Link to="/checkin-out?tab=checkout" className="btn btn-primary btn-sm d-flex align-items-center gap-1 shadow-xs fw-medium">
                <i className="bi bi-box-arrow-right"></i>
                <span>Fast Checkout</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="alert alert-warning py-2 small mb-4 shadow-sm">
          <i className="bi bi-exclamation-triangle me-1"></i> {errorMsg}
        </div>
      )}

      {/* OVERDUE ALERT BANNER */}
      {overdueLoans.length > 0 && (isAdmin || isStockController) && (
        <div className="alert alert-danger border-danger-subtle p-3 mb-4 shadow-sm">
          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2">
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-alarm-fill fs-5 text-danger"></i>
              <div>
                <strong className="text-danger">
                  {overdueLoans.length} Equipment Loan(s) Overdue for Return
                </strong>
                <span className="small text-muted ms-2 d-none d-md-inline">
                  Equipment has passed the scheduled return date without check-in inspection.
                </span>
              </div>
            </div>
            <Link to="/requests" className="btn btn-sm btn-outline-danger align-self-start align-self-sm-auto">
              Review Loans
            </Link>
          </div>
        </div>
      )}

      {/* 1. ADMIN & STOCK CONTROLLER METRICS (8 Key Stock Cards) */}
      {(isAdmin || isStockController) && (
        <div className="row g-3 mb-4">
          <div className="col-6 col-md-4 col-xl-3">
            <StatCard
              title="Equipment Models"
              value={stats.totalEquipment || 0}
              icon="bi-camera"
              iconBg="#eff6ff"
              iconColor="#2563eb"
              subtitle={`Total Stock: ${stats.totalStockUnits || 0} units`}
            />
          </div>
          <div className="col-6 col-md-4 col-xl-3">
            <StatCard
              title="Available in Vault"
              value={stats.availableCount || 0}
              icon="bi-check-circle"
              iconBg="#ecfdf5"
              iconColor="#059669"
              subtitle="Ready for deployment"
            />
          </div>
          <div className="col-6 col-md-4 col-xl-3">
            <StatCard
              title="Active on Loan"
              value={stats.borrowedCount || 0}
              icon="bi-box-arrow-right"
              iconBg="#fffbeb"
              iconColor="#d97706"
              subtitle={`${stats.checkedOutRequestsCount || 0} active loan(s)`}
            />
          </div>
          <div className="col-6 col-md-4 col-xl-3">
            <StatCard
              title="Pending Approvals"
              value={stats.pendingRequestsCount || 0}
              icon="bi-clock-history"
              iconBg="#f1f5f9"
              iconColor="#334155"
              subtitle={`${stats.approvedRequestsCount || 0} ready for pickup`}
            />
          </div>
          <div className="col-6 col-md-4 col-xl-3">
            <StatCard
              title="Under Maintenance"
              value={stats.maintenanceCount || 0}
              icon="bi-tools"
              iconBg="#f0f9ff"
              iconColor="#0284c7"
              subtitle="Active repair tickets"
            />
          </div>
          <div className="col-6 col-md-4 col-xl-3">
            <StatCard
              title="Damaged Assets"
              value={stats.damagedCount || 0}
              icon="bi-exclamation-triangle"
              iconBg="#fef2f2"
              iconColor="#dc2626"
              subtitle="Requires physical service"
            />
          </div>
          <div className="col-6 col-md-4 col-xl-3">
            <StatCard
              title="Overdue Returns"
              value={stats.overdueRequestsCount || overdueLoans.length || 0}
              icon="bi-alarm"
              iconBg="#fff1f2"
              iconColor="#e11d48"
              subtitle="Past scheduled shoot date"
            />
          </div>
          <div className="col-6 col-md-4 col-xl-3">
            <StatCard
              title="Stock Valuation"
              value={formatCurrency(stats.totalValuation)}
              icon="bi-cash-coin"
              iconBg="#f8fafc"
              iconColor="#0f172a"
              subtitle="Total inventory value"
            />
          </div>
        </div>
      )}

      {/* 2. NORMAL USER METRICS */}
      {isUser && (
        <div className="row g-3 mb-4">
          <div className="col-12 col-sm-4">
            <StatCard
              title="My Active Loans"
              value={userStats.myActiveLoans || 0}
              icon="bi-box-arrow-right"
              iconBg="#eff6ff"
              iconColor="#2563eb"
              subtitle="Equipment currently in field with you"
            />
          </div>
          <div className="col-12 col-sm-4">
            <StatCard
              title="My Pending Requests"
              value={userStats.myPendingRequests || 0}
              icon="bi-clock"
              iconBg="#fffbeb"
              iconColor="#d97706"
              subtitle="Awaiting vault supervisor approval"
            />
          </div>
          <div className="col-12 col-sm-4">
            <StatCard
              title="Completed Loans"
              value={userStats.myCompletedLoans || 0}
              icon="bi-check2-all"
              iconBg="#ecfdf5"
              iconColor="#059669"
              subtitle="Returned & verified"
            />
          </div>
        </div>
      )}

      {/* USER ACTIVE GEAR BANNER */}
      {isUser && userStats.myActiveBorrowList && userStats.myActiveBorrowList.length > 0 && (
        <div className="card mb-4 border-primary-subtle shadow-sm">
          <div className="card-header bg-white py-2 px-3 border-bottom d-flex justify-content-between align-items-center">
            <span className="fw-bold small text-dark">
              <i className="bi bi-box-seam me-1 text-primary"></i> Currently Checked Out to You
            </span>
            <span className="badge bg-primary">Active Loan</span>
          </div>
          <div className="card-body p-3">
            {userStats.myActiveBorrowList.map(loan => (
              <div key={loan.id} className="p-2 border rounded bg-light mb-2">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <strong>{loan.project?.title || 'Production Loan'}</strong>
                  <span className="badge bg-warning text-dark">
                    Due: {formatDate(loan.endDate)}
                  </span>
                </div>
                <div className="small text-muted mb-2">
                  Request #: <span className="fw-semibold text-dark">{loan.requestNumber}</span>
                </div>
                <div className="d-flex flex-wrap gap-1">
                  {loan.items?.map(i => (
                    <span key={i.id} className="badge bg-white text-dark border">
                      {i.equipment?.assetTag} - {i.equipment?.name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. CHARTS ROW (Admin & Stock Controller) */}
      {(isAdmin || isStockController) && (
        <div className="row g-3 mb-4">
          {/* Equipment by Category */}
          <div className="col-lg-8">
            <div className="card h-100 border-0 shadow-sm">
              <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
                <span className="fw-semibold small text-secondary">
                  Physical Stock Quantity by Category
                </span>
                <span className="badge bg-light text-secondary border">Catalog Breakdown</span>
              </div>
              <div className="card-body p-3">
                <div style={{ height: '260px' }}>
                  <Bar
                    data={categoryBarData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: { precision: 0 }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Equipment Status Distribution */}
          <div className="col-lg-4">
            <div className="card h-100 border-0 shadow-sm">
              <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
                <span className="fw-semibold small text-secondary">
                  Stock Health & Availability
                </span>
                <span className="badge bg-light text-secondary border">Live Status</span>
              </div>
              <div className="card-body p-3 d-flex align-items-center justify-content-center">
                <div style={{ height: '240px', width: '100%' }}>
                  <Doughnut
                    data={statusDoughnutData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom',
                          labels: { boxWidth: 12, font: { size: 11 } }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. DEDICATED OPERATIONS HUBS (Separated into dedicated pages) */}
      <div className="row g-3">
        {/* Hub 1: Dedicated Borrow Requests Portal */}
        <div className="col-lg-6">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-2">
                <div className="p-2 rounded bg-primary-subtle text-primary d-flex align-items-center justify-content-center" style={{ width: 32, height: 32 }}>
                  <i className="bi bi-calendar2-check-fill"></i>
                </div>
                <div>
                  <h6 className="fw-bold text-dark mb-0">Borrow Requests Operations</h6>
                  <small className="text-muted" style={{ fontSize: '0.72rem' }}>
                    {stats.pendingRequestsCount || 0} pending review • {stats.checkedOutRequestsCount || 0} in field
                  </small>
                </div>
              </div>

              <Link to="/requests" className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1 shadow-xs px-3">
                <span>Open Dedicated Page</span>
                <i className="bi bi-arrow-right"></i>
              </Link>
            </div>

            <div className="card-body p-3">
              {recentRequests.length === 0 ? (
                <div className="text-center py-4 text-muted small">
                  No active borrow requisitions for this period.
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {recentRequests.slice(0, 4).map(req => (
                    <div key={req.id} className="list-group-item px-0 py-2 d-flex justify-content-between align-items-center border-bottom">
                      <div>
                        <div className="d-flex align-items-center gap-2">
                          <span className="fw-bold text-dark small">{req.requestNumber}</span>
                          <StatusBadge status={req.status} />
                        </div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                          Requester: <strong>{req.user?.name}</strong> • Project: {req.project?.title || 'Standalone'}
                        </div>
                      </div>
                      <span className="small text-secondary font-monospace" style={{ fontSize: '0.72rem' }}>
                        {formatDate(req.startDate)} – {formatDate(req.endDate)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card-footer bg-light border-top py-2 px-3 d-flex justify-content-between align-items-center">
              <span className="text-muted small" style={{ fontSize: '0.72rem' }}>
                Full filtering by category, status, and printable vouchers available on dedicated page.
              </span>
              <Link to="/requests" className="small text-primary text-decoration-none fw-semibold">
                Manage Requests →
              </Link>
            </div>
          </div>
        </div>

        {/* Hub 2: Dedicated Handover & Return Logs Portal */}
        <div className="col-lg-6">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-2">
                <div className="p-2 rounded bg-success-subtle text-success d-flex align-items-center justify-content-center" style={{ width: 32, height: 32 }}>
                  <i className="bi bi-arrow-left-right"></i>
                </div>
                <div>
                  <h6 className="fw-bold text-dark mb-0">Handover & Return Logs</h6>
                  <small className="text-muted" style={{ fontSize: '0.72rem' }}>
                    Equipment checkout handovers & return inspection condition logs
                  </small>
                </div>
              </div>

              <Link to="/handover-logs" className="btn btn-outline-success btn-sm d-flex align-items-center gap-1 shadow-xs px-3">
                <span>Open Dedicated Page</span>
                <i className="bi bi-arrow-right"></i>
              </Link>
            </div>

            <div className="card-body p-3">
              {recentActivity.length === 0 ? (
                <div className="text-center py-4 text-muted small">
                  No handover or return activity logged for this timeframe.
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {recentActivity.slice(0, 4).map(act => (
                    <div key={act.id} className="list-group-item px-0 py-2 d-flex justify-content-between align-items-center border-bottom">
                      <div>
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <span
                            className={`badge ${act.type === 'CHECK_OUT' ? 'bg-primary' : 'bg-success'}`}
                            style={{ fontSize: '0.62rem' }}
                          >
                            {act.type === 'CHECK_OUT' ? 'HANDOVER' : 'RETURN'}
                          </span>
                          <span className="fw-bold text-dark small">
                            {act.equipment?.assetTag}
                          </span>
                          <span className="text-muted small text-truncate" style={{ maxWidth: '160px' }}>
                            {act.equipment?.name}
                          </span>
                        </div>
                        <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                          Borrower: <strong>{act.borrowerName || 'Staff Lead'}</strong> • By: {act.handledBy?.name || 'Vault Tech'}
                        </div>
                      </div>
                      <span className="text-muted small font-monospace" style={{ fontSize: '0.7rem' }}>
                        {formatDateTime(act.actionDate)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card-footer bg-light border-top py-2 px-3 d-flex justify-content-between align-items-center">
              <span className="text-muted small" style={{ fontSize: '0.72rem' }}>
                Full condition notes, CSV export, and date filtering available on dedicated page.
              </span>
              <Link to="/handover-logs" className="small text-success text-decoration-none fw-semibold">
                Browse Full Logs →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
