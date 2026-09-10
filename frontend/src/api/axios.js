import axios from 'axios';

// In local dev this stays "/api" and goes through the Vite proxy
// (vite.config.js) to http://localhost:5000. In production the frontend and
// backend are on different domains (Vercel + Railway/Render), so
// VITE_API_BASE_URL must be set at build time to the deployed backend's URL,
// e.g. https://your-backend.up.railway.app/api.
const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
