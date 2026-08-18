import { api } from './api';

export const AdminService = {
  getSystemStats: async () => {
    const res = await api.get('/admin/stats');
    return res.data;
  },

  getAiInsights: async () => {
    const res = await api.get('/admin/ai-insights');
    return res.data;
  },

  getComplaints: async (params?: { page?: number; limit?: number; status?: string; category?: string; search?: string }) => {
    const res = await api.get('/admin/complaints', { params });
    return res.data;
  },

  getComplaintDetails: async (id: string) => {
    const res = await api.get(`/admin/complaints/${id}`);
    return res.data;
  },

  assignComplaint: async (complaintId: string, officerId: string) => {
    const res = await api.patch(`/admin/complaints/${complaintId}/assign`, { officerId });
    return res.data;
  },

  getUsers: async (params?: { page?: number; limit?: number; role?: string; status?: string; search?: string }) => {
    const res = await api.get('/admin/users', { params });
    return res.data;
  },

  getUserDetails: async (id: string) => {
    const res = await api.get(`/admin/users/${id}`);
    return res.data;
  },

  updateUserStatus: async (id: string, status: 'active' | 'inactive' | 'suspended') => {
    const res = await api.patch(`/admin/users/${id}/status`, { status });
    return res.data;
  }
};
