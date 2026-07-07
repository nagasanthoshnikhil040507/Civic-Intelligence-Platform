import { useAuthStore } from '@/store/authStore';
import { useEffect, useState } from 'react';
import { ComplaintService } from '@/services/complaint.service';
import { Loader2 } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({ active: 0, resolved: 0, drafts: 0 });
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const complaints = await ComplaintService.getMyComplaints();
        if (Array.isArray(complaints)) {
          const active = complaints.filter(c => ['pending', 'in_progress', 'assigned'].includes(c.status)).length;
          const resolved = complaints.filter(c => ['resolved', 'closed'].includes(c.status)).length;
          setStats({ active, resolved, drafts: 0 });
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
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome back, {user?.firstName}</h1>
        <p className="text-slate-500 mt-1">Here is what's happening with your civic requests today.</p>
      </div>
      
      {isLoading ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-xl flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
            <h3 className="text-sm font-medium text-slate-500">Active Complaints</h3>
            <p className="text-3xl font-bold text-slate-900 mt-2">{stats.active}</p>
          </div>
          <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
            <h3 className="text-sm font-medium text-slate-500">Resolved</h3>
            <p className="text-3xl font-bold text-slate-900 mt-2">{stats.resolved}</p>
          </div>
          <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
            <h3 className="text-sm font-medium text-slate-500">Drafts</h3>
            <p className="text-3xl font-bold text-slate-900 mt-2">{stats.drafts}</p>
          </div>
        </div>
      )}
    </div>
  );
}
