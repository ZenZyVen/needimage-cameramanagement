import api from './api';

export const getInventoryReport = (params) => api.get('/reports/inventory', { params });
export const getLoansReport = (params) => api.get('/reports/loans', { params });
export const getMaintenanceReport = (params) => api.get('/reports/maintenance', { params });
