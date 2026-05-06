// Store de autenticação - Zustand
import { create } from 'zustand';
import api from '../services/api';

const useAuthStore = create((set) => ({
  // Estado inicial - carrega do localStorage se existir
  usuario: JSON.parse(localStorage.getItem('usuario') || 'null'),
  token: localStorage.getItem('token') || null,
  carregando: false,
  erro: null,

  // Login
  login: async (email, senha) => {
    set({ carregando: true, erro: null });
    try {
      const { data } = await api.post('/auth/login', { email, senha });
      localStorage.setItem('token', data.token);
      localStorage.setItem('usuario', JSON.stringify(data.usuario));
      set({ usuario: data.usuario, token: data.token, carregando: false });
      return true;
    } catch (erro) {
      const msg = erro.response?.data?.erro || 'Erro ao fazer login';
      set({ erro: msg, carregando: false });
      return false;
    }
  },

  // Logout - limpa tudo
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    set({ usuario: null, token: null, erro: null });
  },

  limparErro: () => set({ erro: null })
}));

export default useAuthStore;
