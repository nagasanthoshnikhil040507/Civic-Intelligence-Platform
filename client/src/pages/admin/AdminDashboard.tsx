import { useState, useEffect } from 'react';
import { Users, FileText, CheckCircle, Clock, AlertTriangle, XCircle, Loader2, Server } from 'lucide-react';
import { api } from '@/services/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/admin/stats');
        setStats(res.data.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load system stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Platform Management</h1>
        <p className="text-slate-500 mt-1">System overview and platform statistics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Users</p>
              <p className="text-2xl font-bold text-slate-900">{stats?.totalUsers || 0}</p>
            </div>
          </div>
          <div className="mt-4 flex gap-4 text-xs text-slate-500">
            <span>Citizens: <strong className="text-slate-700">{stats?.totalCitizens || 0}</strong></span>
            <span>Officers: <strong className="text-slate-700">{stats?.totalOfficers || 0}</strong></span>
          </div>
        </div>

        {/* Total Complaints */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Complaints</p>
              <p className="text-2xl font-bold text-slate-900">{stats?.totalComplaints || 0}</p>
            </div>
          </div>
        </div>

        {/* Resolved Complaints */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 text-green-600 rounded-lg">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Resolved</p>
              <p className="text-2xl font-bold text-slate-900">{stats?.statusOverview?.resolved || 0}</p>
            </div>
          </div>
        </div>

        {/* Pending / In Progress */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-100 text-orange-600 rounded-lg">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Pending</p>
              <p className="text-2xl font-bold text-slate-900">{stats?.statusOverview?.pending || 0}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Complaint Status Breakdown</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-600">
                <Clock className="w-4 h-4 text-orange-500" /> Pending
              </div>
              <span className="font-semibold text-slate-900">{stats?.statusOverview?.pending || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-600">
                <AlertTriangle className="w-4 h-4 text-blue-500" /> Assigned
              </div>
              <span className="font-semibold text-slate-900">{stats?.statusOverview?.assigned || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-600">
                <Loader2 className="w-4 h-4 text-indigo-500" /> In Progress
              </div>
              <span className="font-semibold text-slate-900">{stats?.statusOverview?.inProgress || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-600">
                <CheckCircle className="w-4 h-4 text-green-500" /> Resolved
              </div>
              <span className="font-semibold text-slate-900">{stats?.statusOverview?.resolved || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-600">
                <XCircle className="w-4 h-4 text-red-500" /> Rejected
              </div>
              <span className="font-semibold text-slate-900">{stats?.statusOverview?.rejected || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
          <Server className="w-12 h-12 text-slate-300 mb-3" />
          <h3 className="text-lg font-medium text-slate-900">System Healthy</h3>
          <p className="text-sm text-slate-500 max-w-sm mt-2">
            All services are running normally. Active connections to AI processing endpoints are stable.
          </p>
        </div>
      </div>
    </div>
  );
}
