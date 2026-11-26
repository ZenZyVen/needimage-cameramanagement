import api from './api';

export const getEquipment = (params) => api.get('/equipment', { params });
export const getNextEquipmentCodes = () => api.get('/equipment/next-codes');
export const getEquipmentById = (id) => api.get(`/equipment/${id}`);
export const lookupEquipment = (code) => api.get(`/equipment/lookup/${encodeURIComponent(code)}`);
export const getStockDashboard = (params) => api.get('/equipment/stock-dashboard', { params });
export const createEquipment = (data) => api.post('/equipment', data);
export const updateEquipment = (id, data) => api.put(`/equipment/${id}`, data);
export const deleteEquipment = (id, params) => api.delete(`/equipment/${id}`, { params });
export const restoreEquipment = (id) => api.post(`/equipment/${id}/restore`);
export const adjustStock = (id, data) => api.post(`/equipment/${id}/adjust-stock`, data);
export const getStockMovements = (params) => api.get('/equipment/stock-movements', { params });

export const getCategories = () => api.get('/equipment/categories');
export const createCategory = (data) => api.post('/equipment/categories', data);
export const deleteCategory = (id) => api.delete(`/equipment/categories/${id}`);

export const uploadEquipmentImage = (file) => {
  const formData = new FormData();
  formData.append('image', file);
  return api.post('/equipment/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export default {
  getEquipment,
  getNextEquipmentCodes,
  getEquipmentById,
  lookupEquipment,
  getStockDashboard,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  restoreEquipment,
  adjustStock,
  getCategories,
  createCategory,
  deleteCategory,
  uploadEquipmentImage
};
