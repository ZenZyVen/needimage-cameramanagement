import api from './api';

export const checkoutItems = (data) => api.post('/checkinout/checkout', data);
export const checkinItems = (data) => api.post('/checkinout/checkin', data);
export const getCheckInOutHistory = (params) => api.get('/checkinout/history', { params });
export const deleteCheckInOutRecord = (id) => api.delete(`/checkinout/${id}`);
