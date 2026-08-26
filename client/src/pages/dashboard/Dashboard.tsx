import { useAuthStore } from '@/store/authStore';
import { useEffect, useState } from 'react';
import { ComplaintService } from '@/services/complaint.service';
import { Loader2, Activity, CheckCircle2, FileEdit, Map } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { GlassCard } from '@/components/ui/GlassCard';
import { Link } from 'react-router-dom';
import Heatmap from '@/components/map/Heatmap';

export default function Dashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({ active: 0, resolved: 0, total: 0 });
  const [complaints, setComplaints] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const fetchedComplaints = await ComplaintService.getMyComplaints();
        if (Array.isArray(fetchedComplaints)) {
          const active = fetchedComplaints.filter(c => ['pending', 'in_progress', 'assigned'].includes(c.status)).length;
          const resolved = fetchedComplaints.filter(c => ['resolved', 'closed'].includes(c.status)).length;
          setStats({ active, resolved, total: fetchedComplaints.length });
          setComplaints(fetchedComplaints);
        }

      } catch (error) {
        console.error('Failed to fetch dashboard stats', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStats();
  }, []);
  
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Welcome back, {user?.firstName}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-lg">
            Here is what's happening with your civic requests today.
          </p>
        </div>
        <Link 
          to="/dashboard/report" 
          className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm shadow-indigo-200 dark:shadow-none transition-all hover:shadow-md hover:-translate-y-0.5"
        >
          Report an Issue
        </Link>
      </div>
      
      {isLoading ? (
        <GlassCard className="p-12 flex flex-col items-center justify-center min-h-[300px]">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-slate-500 mt-4 font-medium">Loading your dashboard...</p>
        </GlassCard>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard 
              title="Active Complaints" 
              value={stats.active} 
              icon={<Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />} 
              trend={stats.active > 0 ? { value: 'Requires Attention', isPositive: false } : undefined}
            />
            <StatCard 
              title="Resolved Issues" 
              value={stats.resolved} 
              icon={<CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />} 
              trend={stats.resolved > 0 ? { value: 'Great impact', isPositive: true } : undefined}
            />
            <StatCard 
              title="Total Submissions" 
              value={stats.total} 
              icon={<FileEdit className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />} 
            />
          </div>

          {/* Heatmap Area */}
          <div className="mt-8">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Civic Activity Map</h2>
            <GlassCard className="p-1 border-slate-200 dark:border-slate-800">
              <div className="w-full h-[400px] bg-slate-50 dark:bg-slate-900 rounded-xl relative overflow-hidden border border-slate-200 dark:border-slate-800">
                <Heatmap complaints={complaints} isLoading={isLoading} />
              </div>
            </GlassCard>
          </div>
        </>
      )}
    </div>
  );
}
