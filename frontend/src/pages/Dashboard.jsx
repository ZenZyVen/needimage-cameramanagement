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

const Dashboard = () => {
  const { user, isAdmin, isStockController, isUser } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await getDashboardStats();
      if (res.data?.success) {
        setData(res.data);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="text-muted mt-2 small">Loading live inventory statistics...</p>
      </div>
    );
  }

  const stats = data?.stats || {};
  const charts = data?.charts || {};
  const recentRequests = data?.recentRequests || [];
  const recentActivity = data?.recentActivity || [];
  const overdueLoans = data?.overdueLoans || [];
  const userStats = data?.userStats || {};

  // Chart configs using our blue-grey professional palette (strictly NO purple/neon)
  const categoryBarData = {
    labels: charts.categoryChart?.labels || [],
    datasets: [
      {
        label: 'Total Equipment Items',
        data: charts.categoryChart?.counts || [],
        backgroundColor: '#3b82f6',
        borderRadius: 4
      }
    ]
  };

  const statusDoughnutData = {
    labels: charts.statusChart?.labels || ['Available', 'Borrowed', 'Under Maintenance', 'Damaged', 'Retired'],
    datasets: [
      {
        data: charts.statusChart?.data || [0, 0, 0, 0, 0],
        backgroundColor: [
          '#10b981', // green Available
          '#f59e0b', // amber Borrowed
          '#64748b', // slate Maintenance
          '#ef4444', // red Damaged
          '#94a3b8'  // grey Retired
        ],
        borderWidth: 1,
        borderColor: '#ffffff'
      }
    ]
  };

  return (
    <div>
      {/* Top Banner / Welcome */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-2">
        <div>
          <h4 className="fw-bold text-dark mb-1">
            Welcome back, {user?.name}
          </h4>
          <p className="text-muted small mb-0">
            {isAdmin && 'Administrator Overview & System Health'}
            {isStockController && 'Gear Vault Logistics & Intake/Handover Control'}
            {isUser && 'Cinematography & Production Equipment Dashboard'}
          </p>
        </div>

        {/* Quick Action buttons according to role */}
        <div className="d-flex gap-2">
          {isUser && (
            <Link to="/requests" className="btn btn-primary btn-sm d-flex align-items-center gap-1">
              <i className="bi bi-plus-lg"></i>
              <span>New Gear Request</span>
            </Link>
          )}
          {(isAdmin || isStockController) && (
            <>
              <Link to="/checkin-out?tab=checkout" className="btn btn-primary btn-sm d-flex align-items-center gap-1">
                <i className="bi bi-box-arrow-right"></i>
                <span>Fast Checkout</span>
              </Link>
              <Link to="/checkin-out?tab=checkin" className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1">
                <i className="bi bi-box-arrow-in-left"></i>
                <span>Fast Check-in</span>
              </Link>
            </>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="alert alert-warning py-2 small mb-4">
          <i className="bi bi-exclamation-triangle me-1"></i> {errorMsg}
        </div>
      )}

      {/* OVERDUE ALERT BANNER */}
      {overdueLoans.length > 0 && (isAdmin || isStockController) && (
        <div className="alert alert-danger border-danger-subtle p-3 mb-4 shadow-sm">
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-alarm-fill fs-5 text-danger"></i>
              <div>
                <strong className="text-danger">
                  {overdueLoans.length} Equipment Loan(s) Overdue for Return!
                </strong>
                <p className="small text-muted mb-0">
                  Equipment has passed the scheduled return date without check-in inspection.
                </p>
              </div>
            </div>
            <Link to="/checkin-out" className="btn btn-sm btn-outline-danger">
              Inspect & Check-in
            </Link>
          </div>
        </div>
      )}

      {/* 1. ADMIN & STOCK CONTROLLER METRICS */}
      {(isAdmin || isStockController) && (
        <div className="row g-3 mb-4">
          <div className="col-sm-6 col-xl-3">
            <StatCard
              title="Total Assets"
              value={stats.totalEquipment || 0}
              icon="bi-camera"
              iconBg="#eff6ff"
              iconColor="#2563eb"
              subtitle={`Valued at ${formatCurrency(stats.totalValuation)}`}
            />
          </div>
          <div className="col-sm-6 col-xl-3">
            <StatCard
              title="Available in Vault"
              value={stats.availableCount || 0}
              icon="bi-check-circle"
              iconBg="#ecfdf5"
              iconColor="#059669"
              subtitle="Ready for deployment"
            />
          </div>
          <div className="col-sm-6 col-xl-3">
            <StatCard
              title="Active on Loan"
              value={stats.borrowedCount || 0}
              icon="bi-box-arrow-right"
              iconBg="#fffbeb"
              iconColor="#d97706"
              subtitle={`${stats.checkedOutRequestsCount || 0} active project loan(s)`}
            />
          </div>
          <div className="col-sm-6 col-xl-3">
            <StatCard
              title="Pending Approvals"
              value={stats.pendingRequestsCount || 0}
              icon="bi-clock-history"
              iconBg="#f1f5f9"
              iconColor="#334155"
              subtitle={`${stats.maintenanceCount || 0} in maintenance`}
            />
          </div>
        </div>
      )}

      {/* 2. NORMAL USER METRICS */}
      {isUser && (
        <div className="row g-3 mb-4">
          <div className="col-sm-4">
            <StatCard
              title="My Active Loans"
              value={userStats.myActiveLoans || 0}
              icon="bi-box-arrow-right"
              iconBg="#eff6ff"
              iconColor="#2563eb"
              subtitle="Equipment currently with you"
            />
          </div>
          <div className="col-sm-4">
            <StatCard
              title="My Pending Requests"
              value={userStats.myPendingRequests || 0}
              icon="bi-clock"
              iconBg="#fffbeb"
              iconColor="#d97706"
              subtitle="Awaiting vault approval"
            />
          </div>
          <div className="col-sm-4">
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
        <div className="card mb-4 border-primary-subtle">
          <div className="card-header bg-white py-2 px-3 border-bottom d-flex justify-content-between align-items-center">
            <span className="fw-bold small text-dark">
              <i className="bi bi-box-seam me-1 text-primary"></i> Currently Checked Out to You
            </span>
            <span className="badge bg-primary">Active</span>
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
            <div className="card h-100">
              <div className="card-header d-flex justify-content-between align-items-center">
                <span className="fw-semibold small text-secondary">
                  Equipment Count by Category
                </span>
                <span className="badge bg-light text-secondary border">Catalog Distribution</span>
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
            <div className="card h-100">
              <div className="card-header d-flex justify-content-between align-items-center">
                <span className="fw-semibold small text-secondary">
                  Inventory Status Health
                </span>
                <span className="badge bg-light text-secondary border">Real-time</span>
              </div>
              <div className="card-body p-3 d-flex align-items-center justify-content-center">
                <div style={{ height: '230px', width: '100%' }}>
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

      {/* 4. TABLES ROW: Recent Requests & Activity Feed */}
      <div className="row g-3">
        {/* Recent Requests */}
        <div className="col-lg-7">
          <div className="card h-100">
            <div className="card-header d-flex justify-content-between align-items-center">
              <span className="fw-semibold small text-secondary">
                Recent Equipment Borrow Requests
              </span>
              <Link to="/requests" className="small text-primary text-decoration-none">
                View All
              </Link>
            </div>
            <div className="table-responsive">
              <table className="table table-custom">
                <thead>
                  <tr>
                    <th>Request #</th>
                    <th>Requester</th>
                    <th>Project</th>
                    <th>Dates</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRequests.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-4 text-muted small">
                        No requests submitted yet.
                      </td>
                    </tr>
                  ) : (
                    recentRequests.map(req => (
                      <tr key={req.id}>
                        <td className="fw-bold">{req.requestNumber}</td>
                        <td>{req.user?.name}</td>
                        <td className="text-truncate" style={{ maxWidth: '140px' }}>
                          {req.project?.title || 'Standalone'}
                        </td>
                        <td className="small text-nowrap">
                          {formatDate(req.startDate)} - {formatDate(req.endDate)}
                        </td>
                        <td>
                          <StatusBadge status={req.status} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Handover & Check-in Activity Feed */}
        <div className="col-lg-5">
          <div className="card h-100">
            <div className="card-header d-flex justify-content-between align-items-center">
              <span className="fw-semibold small text-secondary">
                Vault Handover & Return Logs
              </span>
              {(isAdmin || isStockController) && (
                <Link to="/checkin-out" className="small text-primary text-decoration-none">
                  Full History
                </Link>
              )}
            </div>
            <div className="card-body p-0">
              {recentActivity.length === 0 ? (
                <div className="text-center py-4 text-muted small">
                  No check-out or return actions logged yet.
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {recentActivity.map(act => (
                    <div key={act.id} className="list-group-item p-3">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span
                          className={`badge ${
                            act.type === 'CHECK_OUT'
                              ? 'bg-primary'
                              : 'bg-success'
                          }`}
                          style={{ fontSize: '0.65rem' }}
                        >
                          {act.type === 'CHECK_OUT' ? 'HANDOVER' : 'RETURN'}
                        </span>
                        <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                          {formatDateTime(act.actionDate)}
                        </span>
                      </div>
                      <div className="fw-semibold text-dark small">
                        {act.equipment?.assetTag} - {act.equipment?.name}
                      </div>
                      <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                        Borrower: <strong>{act.borrowerName || 'Staff'}</strong> • Handled by: {act.handledBy?.name}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
