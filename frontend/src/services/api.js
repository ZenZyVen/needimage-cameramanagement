import axios from 'axios';

export function resolveApiBaseUrl() {
  const raw = String(import.meta.env.VITE_API_URL || '')
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/\/+$/, '');

  if (!raw) {
    return '/api';
  }

  if (/^https?:\/\//i.test(raw) && !raw.toLowerCase().endsWith('/api')) {
    return `${raw}/api`;
  }

  return raw;
}

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to attach Authorization Bearer token to outgoing requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cinevault_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle global 401 Unauthorized responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if expired/invalid and not already on login
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('cinevault_token');
        localStorage.removeItem('cinevault_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
