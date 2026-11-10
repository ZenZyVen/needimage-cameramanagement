import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getEquipment,
  getCategories,
  createEquipment,
  updateEquipment,
  deleteEquipment
} from '../services/equipmentService';
import { createRequest } from '../services/requestService';
import { checkoutItems, checkinItems } from '../services/checkInOutService';

import EquipmentCard from '../components/equipment/EquipmentCard';
import EquipmentFormModal from '../components/equipment/EquipmentFormModal';
import EquipmentDetailModal from '../components/equipment/EquipmentDetailModal';
import CategoryModal from '../components/equipment/CategoryModal';
import QRModal from '../components/common/QRModal';
import QRScannerModal from '../components/common/QRScannerModal';
import RequestFormModal from '../components/requests/RequestFormModal';
import CheckoutModal from '../components/checkinout/CheckoutModal';
import CheckinModal from '../components/checkinout/CheckinModal';
import StatusBadge from '../components/common/StatusBadge';
import { formatCurrency } from '../utils/formatters';

const EquipmentList = () => {
  const { isStaff, isUser } = useAuth();
  const [searchParams] = useSearchParams();

  const [equipmentList, setEquipmentList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'

  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [activeTabFilter, setActiveTabFilter] = useState('ALL'); // 'ALL', 'AVAILABLE', 'BORROWED', 'UNDER_MAINTENANCE'
  const [selectedCondition, setSelectedCondition] = useState('ALL');

  // Modals state
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [viewingEquipment, setViewingEquipment] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrEquipment, setQrEquipment] = useState(null);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Fast Workflow Modals (Checkout, Checkin, Request)
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestItem, setRequestItem] = useState(null);
  const [fastCheckoutItem, setFastCheckoutItem] = useState(null);
  const [showFastCheckout, setShowFastCheckout] = useState(false);
  const [fastCheckinItem, setFastCheckinItem] = useState(null);
  const [showFastCheckin, setShowFastCheckin] = useState(false);

  const [alertMsg, setAlertMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadEquipment();
  }, [search, selectedCategory, activeTabFilter, selectedCondition]);

  const loadCategories = async () => {
    try {
      const res = await getCategories();
      if (res.data?.success) {
        setCategories(res.data.data || []);
      }
    } catch (err) {
      console.warn('Could not load categories:', err);
    }
  };

  const loadEquipment = async () => {
    try {
      setLoading(true);
      const params = {
        search: search.trim() || undefined,
        categoryId: selectedCategory !== 'ALL' ? selectedCategory : undefined,
        status: activeTabFilter !== 'ALL' ? activeTabFilter : undefined,
        condition: selectedCondition !== 'ALL' ? selectedCondition : undefined,
        limit: 100
      };
      const res = await getEquipment(params);
      if (res.data?.success) {
        setEquipmentList(res.data.data || []);
      }
    } catch (err) {
      setAlertMsg({ type: 'danger', text: err.response?.data?.message || 'Error loading equipment catalog.' });
    } finally {
      setLoading(false);
    }
  };

  // Inventory Stock Calculations
  const totalCount = equipmentList.length;
  const availableCount = equipmentList.filter(e => e.status === 'AVAILABLE').length;
  const borrowedCount = equipmentList.filter(e => e.status === 'BORROWED').length;
  const maintenanceCount = equipmentList.filter(e => ['UNDER_MAINTENANCE', 'DAMAGED'].includes(e.status)).length;
  const totalValuation = equipmentList.reduce((sum, item) => sum + (item.purchasePrice || 0), 0);

  const handleCreateOrUpdate = async (formData) => {
    if (editingEquipment) {
      await updateEquipment(editingEquipment.id, formData);
      setAlertMsg({ type: 'success', text: `Equipment ${formData.assetTag} updated successfully.` });
    } else {
      await createEquipment(formData);
      setAlertMsg({ type: 'success', text: `Equipment ${formData.assetTag} registered successfully.` });
    }
    loadEquipment();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this equipment item? This action cannot be undone.')) {
      try {
        await deleteEquipment(id);
        setAlertMsg({ type: 'success', text: 'Equipment item deleted successfully.' });
        loadEquipment();
      } catch (err) {
        setAlertMsg({ type: 'danger', text: err.response?.data?.message || 'Cannot delete item.' });
      }
    }
  };

  // Fast Checkout
  const handleFastCheckoutSubmit = async (payload) => {
    await checkoutItems(payload);
    setAlertMsg({ type: 'success', text: 'Equipment checkout complete! Item marked as Borrowed.' });
    loadEquipment();
  };

  // Fast Check-in
  const handleFastCheckinSubmit = async (payload) => {
    await checkinItems(payload);
    setAlertMsg({ type: 'success', text: 'Equipment check-in and quality inspection recorded.' });
    loadEquipment();
  };

  // User Request
  const handleSaveRequest = async (payload) => {
    await createRequest(payload);
    setAlertMsg({ type: 'success', text: 'Borrow request submitted successfully! Awaiting vault approval.' });
  };

  const handleExportCSV = () => {
    if (equipmentList.length === 0) return;
    const headers = ['Asset Tag', 'Name', 'Brand', 'Model', 'Serial Number', 'Category', 'Status', 'Condition', 'Daily Rate', 'Location'];
    const rows = equipmentList.map(item => [
      item.assetTag,
      `"${item.name.replace(/"/g, '""')}"`,
      item.brand,
      item.model || '',
      item.serialNumber,
      item.category?.name || '',
      item.status,
      item.condition,
      item.dailyRate || 0,
      `"${(item.location || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CineVault-Inventory-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      {/* 1. Header & Primary Command Actions */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3 gap-2">
        <div>
          <h4 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
            <i className="bi bi-box-seam-fill text-primary"></i>
            Inventory & Vault Control
          </h4>
          <p className="text-muted small mb-0">
            Real-time equipment tracking, accessories verification, storage locations, and active loans.
          </p>
        </div>

        <div className="d-flex gap-2 align-items-center flex-wrap">
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={() => setShowScannerModal(true)}
            title="Scan QR or Barcode"
          >
            <i className="bi bi-qr-code-scan text-primary me-1"></i> Scan In/Out
          </button>

          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={handleExportCSV}
            title="Export CSV"
          >
            <i className="bi bi-download me-1"></i> Export CSV
          </button>

          {isStaff && (
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={() => setShowCategoryModal(true)}
              title="Create or Remove Categories"
            >
              <i className="bi bi-tags me-1 text-primary"></i> Categories
            </button>
          )}

          {isStaff && (
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={() => {
                setEditingEquipment(null);
                setShowFormModal(true);
              }}
            >
              <i className="bi bi-plus-lg me-1"></i> Register New Gear
            </button>
          )}
        </div>
      </div>

      {alertMsg.text && (
        <div className={`alert alert-${alertMsg.type} alert-dismissible fade show py-2 small mb-3`} role="alert">
          {alertMsg.text}
          <button type="button" className="btn-close py-2" onClick={() => setAlertMsg({ type: '', text: '' })}></button>
        </div>
      )}

      {/* 2. Top Stock Overview Cards */}
      <div className="row g-2 mb-3">
        <div className="col-6 col-lg-3">
          <div className="inventory-stat-badge">
            <div className="inventory-stat-icon bg-primary-subtle text-primary">
              <i className="bi bi-camera"></i>
            </div>
            <div>
              <div className="fs-5 fw-bold text-dark">{totalCount}</div>
              <div className="small text-muted" style={{ fontSize: '0.74rem' }}>
                Total Assets ({formatCurrency(totalValuation)})
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="inventory-stat-badge">
            <div className="inventory-stat-icon bg-success-subtle text-success">
              <i className="bi bi-check-circle"></i>
            </div>
            <div>
              <div className="fs-5 fw-bold text-success">{availableCount}</div>
              <div className="small text-muted" style={{ fontSize: '0.74rem' }}>In Vault / Available</div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="inventory-stat-badge">
            <div className="inventory-stat-icon bg-warning-subtle text-warning-emphasis">
              <i className="bi bi-box-arrow-right"></i>
            </div>
            <div>
              <div className="fs-5 fw-bold text-warning-emphasis">{borrowedCount}</div>
              <div className="small text-muted" style={{ fontSize: '0.74rem' }}>On Shoot / Borrowed</div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="inventory-stat-badge">
            <div className="inventory-stat-icon bg-danger-subtle text-danger">
              <i className="bi bi-tools"></i>
            </div>
            <div>
              <div className="fs-5 fw-bold text-danger">{maintenanceCount}</div>
              <div className="small text-muted" style={{ fontSize: '0.74rem' }}>Service & Maintenance</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Filter Bar & Stock Status Tabs */}
      <div className="card mb-3">
        <div className="card-body p-3">
          {/* Stock Status Filter Tabs */}
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 pb-3 mb-3 border-bottom">
            <div className="btn-group btn-group-sm">
              <button
                type="button"
                className={`btn ${activeTabFilter === 'ALL' ? 'btn-dark' : 'btn-outline-secondary'}`}
                onClick={() => setActiveTabFilter('ALL')}
              >
                All Gear ({totalCount})
              </button>
              <button
                type="button"
                className={`btn ${activeTabFilter === 'AVAILABLE' ? 'btn-success text-white' : 'btn-outline-secondary'}`}
                onClick={() => setActiveTabFilter('AVAILABLE')}
              >
                In Vault ({availableCount})
              </button>
              <button
                type="button"
                className={`btn ${activeTabFilter === 'BORROWED' ? 'btn-warning text-dark fw-medium' : 'btn-outline-secondary'}`}
                onClick={() => setActiveTabFilter('BORROWED')}
              >
                On Loan ({borrowedCount})
              </button>
              <button
                type="button"
                className={`btn ${activeTabFilter === 'UNDER_MAINTENANCE' ? 'btn-secondary text-white' : 'btn-outline-secondary'}`}
                onClick={() => setActiveTabFilter('UNDER_MAINTENANCE')}
              >
                In Repair ({maintenanceCount})
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="btn-group btn-group-sm">
              <button
                type="button"
                className={`btn ${viewMode === 'grid' ? 'btn-secondary' : 'btn-outline-secondary'}`}
                onClick={() => setViewMode('grid')}
                title="Grid View"
              >
                <i className="bi bi-grid-fill"></i> Grid
              </button>
              <button
                type="button"
                className={`btn ${viewMode === 'table' ? 'btn-secondary' : 'btn-outline-secondary'}`}
                onClick={() => setViewMode('table')}
                title="Table Ledger View"
              >
                <i className="bi bi-list-ul"></i> Ledger
              </button>
            </div>
          </div>

          {/* Search & Filters Row */}
          <div className="row g-2 align-items-center">
            {/* Search Input */}
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search equipment..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={() => setSearch('')}
                  >
                    <i className="bi bi-x-lg"></i>
                  </button>
                )}
              </div>
            </div>

            {/* Condition filter */}
            <div className="col-sm-6 col-md-3">
              <select
                className="form-select"
                value={selectedCondition}
                onChange={(e) => setSelectedCondition(e.target.value)}
              >
                <option value="ALL">All Physical Conditions</option>
                <option value="EXCELLENT">Excellent (Like New)</option>
                <option value="GOOD">Good (Certified Normal)</option>
                <option value="FAIR">Fair (Minor Scuffs)</option>
                <option value="POOR">Poor (Needs Inspection)</option>
              </select>
            </div>

            {/* Category dropdown */}
            <div className="col-sm-6 col-md-3">
              <select
                className="form-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="ALL">All Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Category Quick Pills */}
          <div className="d-flex align-items-center gap-1 overflow-x-auto pt-3 mt-3 border-top pb-1">
            <span
              className={`category-filter-pill ${selectedCategory === 'ALL' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('ALL')}
            >
              All Categories
            </span>
            {categories.map(cat => (
              <span
                key={cat.id}
                className={`category-filter-pill ${selectedCategory === cat.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                <i className={`bi ${cat.icon || 'bi-tag'} text-muted`}></i>
                {cat.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Equipment Cards / Table Display */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="text-muted small mt-2">Loading inventory assets...</p>
        </div>
      ) : equipmentList.length === 0 ? (
        <div className="card text-center py-5">
          <div className="card-body">
            <i className="bi bi-box-seam fs-1 text-muted d-block mb-2"></i>
            <h6 className="fw-bold text-dark">No inventory items match your filters</h6>
            <p className="text-muted small mb-3">
              Try resetting your search query or registering new gear into the vault.
            </p>
            {isStaff && (
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={() => {
                  setEditingEquipment(null);
                  setShowFormModal(true);
                }}
              >
                <i className="bi bi-plus-lg me-1"></i> Register Equipment
              </button>
            )}
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="row g-3">
          {equipmentList.map(item => (
            <div key={item.id} className="col-sm-6 col-lg-4 col-xl-3">
              <EquipmentCard
                equipment={item}
                canManage={isStaff}
                onView={(eq) => {
                  setViewingEquipment(eq);
                  setShowDetailModal(true);
                }}
                onShowQR={(eq) => {
                  setQrEquipment(eq);
                  setShowQRModal(true);
                }}
                onEdit={(eq) => {
                  setEditingEquipment(eq);
                  setShowFormModal(true);
                }}
                onDelete={handleDelete}
                onRequest={isUser ? (eq) => { setRequestItem(eq); setShowRequestModal(true); } : null}
                onFastCheckout={isStaff ? (eq) => { setFastCheckoutItem(eq); setShowFastCheckout(true); } : null}
                onFastCheckin={isStaff ? (eq) => { setFastCheckinItem(eq); setShowFastCheckin(true); } : null}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="card shadow-sm border-0">
          <div className="table-responsive">
            <table className="table table-custom align-middle">
              <thead>
                <tr>
                  <th style={{ width: 50 }}>Asset</th>
                  <th>Equipment Description</th>
                  <th>Category</th>
                  <th>Serial #</th>
                  <th>Vault Location</th>
                  <th>Condition</th>
                  <th>Status</th>
                  <th>Daily Rate</th>
                  <th className="text-end">Quick Actions</th>
                </tr>
              </thead>
              <tbody>
                {equipmentList.map(item => (
                  <tr key={item.id}>
                    <td>
                      <div
                        style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', backgroundColor: '#f1f5f9' }}
                        className="border shadow-xs"
                      >
                        <img
                          src={item.imageUrl || 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=100&auto=format&fit=crop&q=80'}
                          alt={item.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
                          onClick={() => {
                            setViewingEquipment(item);
                            setShowDetailModal(true);
                          }}
                          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=100&auto=format&fit=crop&q=80'; }}
                        />
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <span className="badge bg-slate-900 text-white font-monospace" style={{ fontSize: '0.72rem' }}>
                          {item.assetTag}
                        </span>
                        <div
                          className="fw-bold text-dark"
                          style={{ cursor: 'pointer' }}
                          onClick={() => {
                            setViewingEquipment(item);
                            setShowDetailModal(true);
                          }}
                        >
                          {item.name}
                        </div>
                      </div>
                      <div className="small text-muted">{item.brand} {item.model}</div>
                    </td>
                    <td>
                      <span className="badge bg-light text-secondary border">
                        {item.category?.name || 'Vault Gear'}
                      </span>
                    </td>
                    <td className="text-nowrap font-monospace small text-secondary">{item.serialNumber}</td>
                    <td>
                      <i className="bi bi-geo-alt me-1 text-primary"></i>
                      <span className="small fw-medium text-dark">{item.location || 'Vault Main'}</span>
                    </td>
                    <td>
                      <span className="badge bg-light text-secondary border" style={{ fontSize: '0.72rem' }}>
                        {item.condition}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="fw-semibold text-dark small">{formatCurrency(item.dailyRate)}/day</td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          title="Print / View QR Tag"
                          onClick={() => {
                            setQrEquipment(item);
                            setShowQRModal(true);
                          }}
                        >
                          <i className="bi bi-qr-code"></i>
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          title="View Specifications & History"
                          onClick={() => {
                            setViewingEquipment(item);
                            setShowDetailModal(true);
                          }}
                        >
                          <i className="bi bi-eye"></i>
                        </button>

                        {isStaff && item.status === 'AVAILABLE' && (
                          <button
                            type="button"
                            className="btn btn-primary"
                            title="Fast Checkout / Handover"
                            onClick={() => {
                              setFastCheckoutItem(item);
                              setShowFastCheckout(true);
                            }}
                          >
                            <i className="bi bi-box-arrow-right"></i> Handover
                          </button>
                        )}

                        {isStaff && item.status === 'BORROWED' && (
                          <button
                            type="button"
                            className="btn btn-success text-white"
                            title="Fast Return & Quality Check"
                            onClick={() => {
                              setFastCheckinItem(item);
                              setShowFastCheckin(true);
                            }}
                          >
                            <i className="bi bi-box-arrow-in-left"></i> Return
                          </button>
                        )}

                        {isStaff && (
                          <>
                            <button
                              type="button"
                              className="btn btn-outline-secondary"
                              title="Edit Gear"
                              onClick={() => {
                                setEditingEquipment(item);
                                setShowFormModal(true);
                              }}
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-danger"
                              title="Delete Item"
                              onClick={() => handleDelete(item.id)}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </>
                        )}

                        {isUser && item.status === 'AVAILABLE' && (
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => {
                              setRequestItem(item);
                              setShowRequestModal(true);
                            }}
                          >
                            Request
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Modals */}
      {/* Equipment Intake Form Modal */}
      <EquipmentFormModal
        show={showFormModal}
        onHide={() => setShowFormModal(false)}
        onSubmit={handleCreateOrUpdate}
        equipment={editingEquipment}
        categories={categories}
      />

      {/* Equipment Detailed Inspection Modal */}
      <EquipmentDetailModal
        show={showDetailModal}
        onHide={() => setShowDetailModal(false)}
        equipment={viewingEquipment}
        onShowQR={(eq) => {
          setShowDetailModal(false);
          setQrEquipment(eq);
          setShowQRModal(true);
        }}
      />

      {/* QR Code Tag Modal */}
      <QRModal
        show={showQRModal}
        onHide={() => setShowQRModal(false)}
        equipment={qrEquipment}
      />

      {/* Live QR Scanner Modal */}
      <QRScannerModal
        show={showScannerModal}
        onHide={() => setShowScannerModal(false)}
      />

      {/* Fast Checkout Handover Modal */}
      <CheckoutModal
        show={showFastCheckout}
        onHide={() => setShowFastCheckout(false)}
        equipment={fastCheckoutItem}
        onSubmit={handleFastCheckoutSubmit}
      />

      {/* Fast Return Inspection Modal */}
      <CheckinModal
        show={showFastCheckin}
        onHide={() => setShowFastCheckin(false)}
        equipment={fastCheckinItem}
        onSubmit={handleFastCheckinSubmit}
      />

      {/* Categories Management Modal */}
      <CategoryModal
        show={showCategoryModal}
        onHide={() => setShowCategoryModal(false)}
        categories={categories}
        onCategoriesUpdated={() => {
          loadCategories();
          loadEquipment();
        }}
      />

      {/* Normal User Request Wizard */}
      <RequestFormModal
        show={showRequestModal}
        onHide={() => setShowRequestModal(false)}
        onSubmit={handleSaveRequest}
        initialEquipment={requestItem}
      />
    </div>
  );
};

export default EquipmentList;
