import api from './api';

export const getSettings = () => api.get('/settings');
export const updateSettings = (data) => api.put('/settings', data);
export const getAuditLogs = (params) => api.get('/settings/audit-logs', { params });
export const deleteAuditLog = (id) => api.delete(`/settings/audit-logs/${id}`);
export const clearAuditLogs = (data) => api.delete('/settings/audit-logs', { data });
export const exportBackup = () => api.get('/settings/backup');
export const uploadLogo = (formData) => api.post('/settings/upload-logo', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

export default {
  getSettings,
  updateSettings,
  getAuditLogs,
  deleteAuditLog,
  clearAuditLogs,
  exportBackup,
  uploadLogo
};
