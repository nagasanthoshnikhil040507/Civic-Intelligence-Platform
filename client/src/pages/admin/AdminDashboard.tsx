import { useState, useEffect } from 'react';
import { Users, FileText, CheckCircle, Clock, AlertTriangle, XCircle, Loader2, Server, Map as MapIcon, ShieldCheck, Activity } from 'lucide-react';
import { AdminService } from '@/services/admin.service';
import { GlassCard } from '@/components/ui/GlassCard';
import { StatCard } from '@/components/ui/StatCard';
import Heatmap from '@/components/map/Heatmap';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsData, complaintsData] = await Promise.all([
          AdminService.getSystemStats(),
          AdminService.getComplaints({ limit: 500 }) // get up to 500 recent complaints for the heatmap
        ]);
        
        setStats(statsData);
        setComplaints(complaintsData.complaints || []);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load system data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 animate-in fade-in duration-500">
        <div className="relative">
          <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full animate-pulse" />
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin relative z-10" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Loading Dashboard</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Fetching platform statistics and map data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] animate-in fade-in duration-500">
        <GlassCard variant="alert" className="p-8 flex flex-col items-center text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-600 mb-4" />
          <h3 className="font-bold text-xl text-slate-900 dark:text-white mb-2">Failed to load Dashboard</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-xl font-semibold hover:bg-slate-800 dark:hover:bg-slate-200 transition-all hover:shadow-md"
          >
            Retry
          </button>
        </GlassCard>
      </div>
    );
  }

  const activeIssues = (stats?.statusOverview?.pending || 0) + (stats?.statusOverview?.inProgress || 0) + (stats?.statusOverview?.assigned || 0);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            Platform Command Center
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">System overview, metrics, and live geographical analysis.</p>
        </div>
        
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-400 text-sm font-bold shadow-sm">
          <Server className="w-4 h-4" />
          System Normal
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          icon={<Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
          trend={{ value: `${stats?.totalCitizens || 0} Citizens, ${stats?.totalOfficers || 0} Officers`, isPositive: true }}
        />
        <StatCard
          title="Total Reports"
          value={stats?.totalComplaints || 0}
          icon={<FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
        />
        <StatCard
          title="Active Issues"
          value={activeIssues}
          icon={<Activity className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
        />
        <StatCard
          title="Resolved"
          value={stats?.statusOverview?.resolved || 0}
          icon={<CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <GlassCard className="p-0 h-[500px] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <MapIcon className="w-5 h-5 text-indigo-500" />
                  Live Incident Heatmap
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Geographical distribution of civic issues</p>
              </div>
              <span className="bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase">
                {complaints.length} Points
              </span>
            </div>
            <div className="flex-1 bg-slate-50 dark:bg-slate-900 relative">
              <Heatmap complaints={complaints} isLoading={loading} />
            </div>
          </GlassCard>
        </div>

        <div>
          <GlassCard className="p-6 h-full flex flex-col">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Status Breakdown</h2>
            <div className="space-y-5 flex-1">
              {[
                { label: 'Pending', count: stats?.statusOverview?.pending || 0, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/50' },
                { label: 'Assigned', count: stats?.statusOverview?.assigned || 0, icon: AlertTriangle, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/50' },
                { label: 'In Progress', count: stats?.statusOverview?.inProgress || 0, icon: Loader2, color: 'text-indigo-500', bg: 'bg-indigo-100 dark:bg-indigo-900/50' },
                { label: 'Resolved', count: stats?.statusOverview?.resolved || 0, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/50' },
                { label: 'Rejected', count: stats?.statusOverview?.rejected || 0, icon: XCircle, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/50' },
              ].map((status, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${status.bg}`}>
                      <status.icon className={`w-4 h-4 ${status.color}`} />
                    </div>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{status.label}</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white font-mono text-lg">{status.count}</span>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-100 dark:border-emerald-800/50">
                <div className="flex items-center gap-2 mb-2">
                  <Server className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="font-bold text-emerald-900 dark:text-emerald-300">System Performance</h3>
                </div>
                <p className="text-xs text-emerald-800 dark:text-emerald-400 font-medium">
                  All microservices operational. Live connection to AI analysis endpoints is stable.
                </p>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
