// Serviço Axios - configuração central com interceptors de autenticação
import axios from 'axios';

const api = axios.create({
  // Em produção, a API estará na mesma origem (Ex: http://192.168.1.5:3001/api)
  // No dev mode, usa a porta 3001 da máquina atual
  baseURL: import.meta.env.PROD ? '/api' : `http://${window.location.hostname}:3001/api`,
  timeout: 10000,
});

// Interceptor de requisição - adiciona token JWT automaticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de resposta - trata 401 (sessão expirada)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
