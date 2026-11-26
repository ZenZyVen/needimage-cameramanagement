import api from './api';

export const getProjects = (params) => api.get('/projects', { params });
export const getNextProjectCode = () => api.get('/projects/next-code');
export const getCrewCandidates = () => api.get('/projects/crew-candidates');
export const getProjectById = (id) => api.get(`/projects/${id}`);
export const createProject = (data) => api.post('/projects', data);
export const updateProject = (id, data) => api.put(`/projects/${id}`, data);
export const deleteProject = (id) => api.delete(`/projects/${id}`);

export const getProjectCrew = (id) => api.get(`/projects/${id}/crew`);
export const addProjectCrewMember = (id, data) => api.post(`/projects/${id}/crew`, data);
export const removeProjectCrewMember = (id, crewId) => api.delete(`/projects/${id}/crew/${crewId}`);
