import { api } from './api';
import { useAuthStore } from '../store/authStore';

export const AuthService = {
  async register(data: any) {
    const response = await api.post('/auth/register', data);
    const { user, accessToken } = response.data.data;
    useAuthStore.getState().login(user, accessToken);
    return response.data;
  },
  
  async login(credentials: any) {
    const response = await api.post('/auth/login', credentials);
    const { user, accessToken } = response.data.data;
    useAuthStore.getState().login(user, accessToken);
    return response.data;
  },
  
  async logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      useAuthStore.getState().logout();
    }
  },

  async initializeAuth() {
    try {
      const response = await api.post('/auth/refresh');
      const { accessToken, user } = response.data.data;
      useAuthStore.getState().login(user, accessToken);
    } catch (error) {
      useAuthStore.getState().logout();
    } finally {
      useAuthStore.getState().setLoading(false);
    }
  }
};
