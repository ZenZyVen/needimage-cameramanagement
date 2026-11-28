import api from './api';

export const getRequests = (params) => api.get('/requests', { params });
export const getRequestById = (id) => api.get(`/requests/${id}`);
export const createRequest = (data) => api.post('/requests', data);
export const approveRequest = (id, data) => api.patch(`/requests/${id}/approve`, data);
export const rejectRequest = (id, data) => api.patch(`/requests/${id}/reject`, data);
export const cancelRequest = (id) => api.patch(`/requests/${id}/cancel`);
export const deleteRequest = (id) => api.delete(`/requests/${id}`);
