import { api } from './api';

export const AdminService = {
  getSystemStats: async () => {
    const res = await api.get('/admin/stats');
    return res.data.data;
  },

  getAiInsights: async (period?: string) => {
    const res = await api.get('/admin/ai-insights', { params: { period } });
    return res.data.data;
  },

  getAnalytics: async (period?: string) => {
    const res = await api.get('/admin/analytics', { params: { period } });
    return res.data.data;
  },

  getComplaints: async (params?: { page?: number; limit?: number; status?: string; category?: string; search?: string; period?: string; region?: string }) => {
    const res = await api.get('/admin/complaints', { params });
    return res.data.data;
  },

  getComplaintDetails: async (id: string) => {
    const res = await api.get(`/admin/complaints/${id}`);
    return res.data.data;
  },

  assignComplaint: async (complaintId: string, officerId: string) => {
    const res = await api.patch(`/admin/complaints/${complaintId}/assign`, { officerId });
    return res.data.data;
  },

  getUsers: async (params?: { page?: number; limit?: number; role?: string; status?: string; search?: string }) => {
    const res = await api.get('/admin/users', { params });
    return res.data.data;
  },

  getUserDetails: async (id: string) => {
    const res = await api.get(`/admin/users/${id}`);
    return res.data.data;
  },

  updateUserStatus: async (id: string, status: 'active' | 'inactive' | 'suspended') => {
    const res = await api.patch(`/admin/users/${id}/status`, { status });
    return res.data.data;
  }
};
