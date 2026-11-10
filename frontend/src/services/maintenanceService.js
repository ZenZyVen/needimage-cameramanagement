import api from './api';

export const getMaintenanceTickets = (params) => api.get('/maintenance', { params });
export const createMaintenanceTicket = (data) => api.post('/maintenance', data);
export const updateMaintenanceTicket = (id, data) => api.put(`/maintenance/${id}`, data);
export const resolveMaintenanceTicket = (id, data) => api.patch(`/maintenance/${id}/resolve`, data);

export const uploadDamageImage = (file) => {
  const formData = new FormData();
  formData.append('image', file);
  return api.post('/maintenance/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export default {
  getMaintenanceTickets,
  createMaintenanceTicket,
  updateMaintenanceTicket,
  resolveMaintenanceTicket,
  uploadDamageImage
};
