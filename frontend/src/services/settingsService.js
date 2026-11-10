import api from './api';

export const getSettings = () => api.get('/settings');
export const updateSettings = (data) => api.put('/settings', data);
export const getAuditLogs = (params) => api.get('/settings/audit-logs', { params });
export const exportBackup = () => api.get('/settings/backup');
export const uploadLogo = (formData) => api.post('/settings/upload-logo', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

export default {
  getSettings,
  updateSettings,
  getAuditLogs,
  exportBackup,
  uploadLogo
};
