import api from './api';

export const getEquipment = (params) => api.get('/equipment', { params });
export const getEquipmentById = (id) => api.get(`/equipment/${id}`);
export const lookupEquipment = (code) => api.get(`/equipment/lookup/${encodeURIComponent(code)}`);
export const createEquipment = (data) => api.post('/equipment', data);
export const updateEquipment = (id, data) => api.put(`/equipment/${id}`, data);
export const deleteEquipment = (id) => api.delete(`/equipment/${id}`);

export const getCategories = () => api.get('/equipment/categories');
export const createCategory = (data) => api.post('/equipment/categories', data);

export const uploadEquipmentImage = (file) => {
  const formData = new FormData();
  formData.append('image', file);
  return api.post('/equipment/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};
