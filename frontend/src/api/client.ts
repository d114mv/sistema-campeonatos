import axios from 'axios';

// Leemos la URL desde el archivo .env
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const client = axios.create({
  baseURL: baseURL
});

// Interceptor para agregar el Token automáticamente
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default client;