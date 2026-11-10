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
import EquipmentCard from '../components/equipment/EquipmentCard';
import EquipmentFormModal from '../components/equipment/EquipmentFormModal';
import EquipmentDetailModal from '../components/equipment/EquipmentDetailModal';
import QRModal from '../components/common/QRModal';
import RequestFormModal from '../components/requests/RequestFormModal';
import StatusBadge from '../components/common/StatusBadge';
import { createRequest } from '../services/requestService';
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
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedCondition, setSelectedCondition] = useState('ALL');

  // Modals state
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [viewingEquipment, setViewingEquipment] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrEquipment, setQrEquipment] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestItem, setRequestItem] = useState(null);

  const [alertMsg, setAlertMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadEquipment();
  }, [search, selectedCategory, selectedStatus, selectedCondition]);

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
        status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
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

  const handleOpenRequest = (eq) => {
    setRequestItem(eq);
    setShowRequestModal(true);
  };

  const handleSaveRequest = async (payload) => {
    await createRequest(payload);
    setAlertMsg({ type: 'success', text: 'Borrow request submitted successfully! Awaiting review.' });
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
    link.setAttribute('download', `CineVault-Equipment-Export-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      {/* Header & Main Controls */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-2">
        <div>
          <h4 className="fw-bold text-dark mb-1">Equipment Catalog</h4>
          <p className="text-muted small mb-0">
            Browse, manage, and inspect all camera, lighting, audio, and grip assets.
          </p>
        </div>

        <div className="d-flex gap-2 align-items-center">
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
            onClick={handleExportCSV}
            title="Export CSV"
          >
            <i className="bi bi-file-earmark-spreadsheet"></i>
            <span className="d-none d-sm-inline">Export CSV</span>
          </button>

          {isStaff && (
            <button
              type="button"
              className="btn btn-sm btn-primary d-flex align-items-center gap-1"
              onClick={() => {
                setEditingEquipment(null);
                setShowFormModal(true);
              }}
            >
              <i className="bi bi-plus-lg"></i>
              <span>Register Equipment</span>
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

      {/* Filter Toolbar */}
      <div className="card mb-4">
        <div className="card-body p-3">
          <div className="row g-2 align-items-center">
            {/* Search Input */}
            <div className="col-md-4">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-white border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Search tag, serial, model, brand..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={() => setSearch('')}
                  >
                    <i className="bi bi-x"></i>
                  </button>
                )}
              </div>
            </div>

            {/* Category filter */}
            <div className="col-sm-6 col-md-3">
              <select
                className="form-select form-select-sm"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="ALL">All Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Status filter */}
            <div className="col-sm-6 col-md-2">
              <select
                className="form-select form-select-sm"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="ALL">All Statuses</option>
                <option value="AVAILABLE">Available</option>
                <option value="BORROWED">Borrowed</option>
                <option value="UNDER_MAINTENANCE">Maintenance</option>
                <option value="DAMAGED">Damaged</option>
                <option value="RETIRED">Retired</option>
              </select>
            </div>

            {/* Condition filter */}
            <div className="col-sm-6 col-md-2">
              <select
                className="form-select form-select-sm"
                value={selectedCondition}
                onChange={(e) => setSelectedCondition(e.target.value)}
              >
                <option value="ALL">All Conditions</option>
                <option value="EXCELLENT">Excellent</option>
                <option value="GOOD">Good</option>
                <option value="FAIR">Fair</option>
                <option value="POOR">Poor</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="col-sm-6 col-md-1 text-md-end">
              <div className="btn-group btn-group-sm w-100">
                <button
                  type="button"
                  className={`btn ${viewMode === 'grid' ? 'btn-secondary' : 'btn-outline-secondary'}`}
                  onClick={() => setViewMode('grid')}
                  title="Grid View"
                >
                  <i className="bi bi-grid-fill"></i>
                </button>
                <button
                  type="button"
                  className={`btn ${viewMode === 'table' ? 'btn-secondary' : 'btn-outline-secondary'}`}
                  onClick={() => setViewMode('table')}
                  title="Table View"
                >
                  <i className="bi bi-list-ul"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Equipment View Content */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="text-muted small mt-2">Loading equipment...</p>
        </div>
      ) : equipmentList.length === 0 ? (
        <div className="card text-center py-5">
          <div className="card-body">
            <i className="bi bi-camera fs-1 text-muted d-block mb-2"></i>
            <h6 className="fw-bold text-dark">No equipment found</h6>
            <p className="text-muted small mb-3">
              Try adjusting your search criteria or register new equipment into the vault.
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
                Register Gear Now
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
                onRequest={isUser ? handleOpenRequest : null}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="card">
          <div className="table-responsive">
            <table className="table table-custom">
              <thead>
                <tr>
                  <th>Asset Tag</th>
                  <th>Equipment Description</th>
                  <th>Category</th>
                  <th>Serial #</th>
                  <th>Location</th>
                  <th>Condition</th>
                  <th>Status</th>
                  <th>Daily Rate</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {equipmentList.map(item => (
                  <tr key={item.id}>
                    <td className="fw-bold text-dark">{item.assetTag}</td>
                    <td>
                      <div
                        className="fw-semibold text-dark text-decoration-none"
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                          setViewingEquipment(item);
                          setShowDetailModal(true);
                        }}
                      >
                        {item.name}
                      </div>
                      <div className="small text-muted">{item.brand} {item.model}</div>
                    </td>
                    <td>{item.category?.name || 'General'}</td>
                    <td>{item.serialNumber}</td>
                    <td>{item.location || 'Vault'}</td>
                    <td>
                      <span className="badge bg-light text-secondary border">
                        {item.condition}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={item.status} />
                    </td>
                    <td>{formatCurrency(item.dailyRate)}/day</td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        <button
                          type="button"
                          className="btn btn-light border"
                          title="QR Tag"
                          onClick={() => {
                            setQrEquipment(item);
                            setShowQRModal(true);
                          }}
                        >
                          <i className="bi bi-qr-code"></i>
                        </button>
                        <button
                          type="button"
                          className="btn btn-light border"
                          title="View Details"
                          onClick={() => {
                            setViewingEquipment(item);
                            setShowDetailModal(true);
                          }}
                        >
                          <i className="bi bi-eye"></i>
                        </button>
                        {isStaff && (
                          <>
                            <button
                              type="button"
                              className="btn btn-light border"
                              title="Edit"
                              onClick={() => {
                                setEditingEquipment(item);
                                setShowFormModal(true);
                              }}
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button
                              type="button"
                              className="btn btn-light border text-danger"
                              title="Delete"
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
                            onClick={() => handleOpenRequest(item)}
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

      {/* Form Modal (Add / Edit) */}
      <EquipmentFormModal
        show={showFormModal}
        onHide={() => setShowFormModal(false)}
        onSubmit={handleCreateOrUpdate}
        equipment={editingEquipment}
        categories={categories}
      />

      {/* Detail Modal */}
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

      {/* QR Modal */}
      <QRModal
        show={showQRModal}
        onHide={() => setShowQRModal(false)}
        equipment={qrEquipment}
      />

      {/* Request Form Modal */}
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
