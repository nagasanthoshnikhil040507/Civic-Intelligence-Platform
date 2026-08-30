import { useAuthStore } from '@/store/authStore';
import { useEffect, useState } from 'react';
import { ComplaintService } from '@/services/complaint.service';
import { Loader2, FileWarning, Inbox, RefreshCw, CheckCircle, Archive } from 'lucide-react';

export default function OfficerDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({ pending: 0, assigned: 0, in_progress: 0, resolved: 0, closed: 0 });
  const [complaintsList, setComplaintsList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch all complaints to calculate stats (in a real production app with millions of records, 
        // there would be a dedicated /stats endpoint, but for Phase 4.1 we aggregate live data via GET /complaints)
        const complaints = await ComplaintService.getMyComplaints({ limit: 1000 });
        if (Array.isArray(complaints)) {
          setComplaintsList(complaints);
          setStats({
            pending: 0,
            assigned: complaints.filter(c => c.status === 'assigned').length,
            in_progress: complaints.filter(c => c.status === 'in_progress').length,
            resolved: complaints.filter(c => c.status === 'resolved' || c.status === 'closed').length,
            closed: complaints.length, // Total Cases Handled
          });
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStats();
  }, []);
  
  const statCards = [
    { label: 'Assigned Complaints', value: stats.assigned, icon: Inbox, color: 'text-purple-600', bg: 'bg-purple-100', border: 'border-purple-200' },
    { label: 'In Progress', value: stats.in_progress, icon: RefreshCw, color: 'text-blue-600', bg: 'bg-blue-100', border: 'border-blue-200' },
    { label: 'Resolved Cases', value: stats.resolved, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', border: 'border-green-200' },
    { label: 'Total Cases Handled', value: stats.closed, icon: Archive, color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Officer Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">
          Welcome back, <span className="font-semibold text-slate-900 dark:text-slate-200">Officer {user?.firstName}</span>
        </p>
        {(user?.department || user?.requestedDepartment) && (
          <div className="mt-3 flex gap-2 items-center">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50">
              Department: {user.department === 'SANITATION' ? 'Sanitation Department' : user.department === 'ROADS' ? 'Roads Department' : 'Unassigned'}
            </div>
            {user.requestedDepartment && user.departmentStatus === 'PENDING' && (
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50">
                Pending Approval: {user.requestedDepartment}
              </div>
            )}
          </div>
        )}
      </div>
      
      {isLoading ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl flex items-center justify-center shadow-sm">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, idx) => (
            <div key={idx} className={`p-6 bg-white border ${stat.border} rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group`}>
              <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full ${stat.bg} opacity-50 group-hover:scale-110 transition-transform duration-500`} />
              <div className="relative">
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-2 rounded-lg ${stat.bg}`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{stat.label}</h3>
                  <p className="text-3xl font-bold text-slate-900 mt-1">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Real Analytics & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col">
             <h3 className="font-bold text-slate-900 mb-4">My Active Assignments</h3>
             <div className="space-y-3 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
               {complaintsList.filter((c:any) => c.status !== 'resolved' && c.status !== 'closed' && c.status !== 'rejected').length === 0 ? (
                 <div className="text-center py-10 text-slate-400 font-medium">No active assignments.</div>
               ) : (
                 complaintsList.filter((c:any) => c.status !== 'resolved' && c.status !== 'closed' && c.status !== 'rejected').slice(0, 5).map((complaint: any) => (
                   <div key={complaint._id} className="flex justify-between items-center p-3 hover:bg-slate-50 border border-slate-100 rounded-xl transition-colors">
                     <div>
                       <p className="font-semibold text-slate-800 line-clamp-1">{complaint.title}</p>
                       <p className="text-xs text-slate-500 capitalize mt-1">{complaint.category.replace('_', ' ')} • {new Date(complaint.createdAt).toLocaleDateString()}</p>
                     </div>
                     <div className="flex gap-2">
                       <span className={`px-2.5 py-1 text-xs font-semibold rounded-full capitalize ${complaint.status === 'in_progress' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>{complaint.status.replace('_', ' ')}</span>
                     </div>
                   </div>
                 ))
               )}
             </div>
          </div>
          
          <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col">
             <h3 className="font-bold text-slate-900 mb-4">Recent Resolved Cases</h3>
             <div className="space-y-3 overflow-y-auto max-h-[200px] pr-2 custom-scrollbar">
               {complaintsList.filter((c:any) => c.status === 'resolved' || c.status === 'closed').length === 0 ? (
                 <div className="text-center py-10 text-slate-400 font-medium">No resolved cases yet.</div>
               ) : (
                 complaintsList.filter((c:any) => c.status === 'resolved' || c.status === 'closed').slice(0, 5).map((complaint: any) => (
                   <div key={complaint._id} className="flex justify-between items-center p-3 hover:bg-slate-50 border border-slate-100 rounded-xl transition-colors">
                     <div>
                       <p className="font-semibold text-slate-800 line-clamp-1">{complaint.title}</p>
                       <p className="text-xs text-slate-500 capitalize mt-1">{complaint.category.replace('_', ' ')} • Resolved on {new Date(complaint.updatedAt || complaint.createdAt).toLocaleDateString()}</p>
                     </div>
                     <div className="flex gap-2">
                       <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-green-50 text-green-700 capitalize">Resolved</span>
                     </div>
                   </div>
                 ))
               )}
             </div>
          </div>
        </div>
        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col">
           <h3 className="font-bold text-slate-900 mb-4">Priority Distribution</h3>
           <div className="flex-1 flex flex-col justify-center space-y-4">
             {['critical', 'high', 'medium', 'low'].map(priority => {
               const count = complaintsList.filter((c: any) => c.priority === priority || c.aiAnalysis?.severity === priority).length;
               if (count === 0 && priority !== 'high') return null;
               const max = Math.max(1, complaintsList.length);
               const width = `${(count / max) * 100}%`;
               return (
                 <div key={priority}>
                   <div className="flex justify-between text-sm mb-1 font-semibold">
                     <span className="capitalize text-slate-700">{priority}</span>
                     <span className="text-slate-500">{count}</span>
                   </div>
                   <div className="w-full bg-slate-100 rounded-full h-2">
                     <div className={`h-full rounded-full ${priority === 'critical' ? 'bg-red-500' : priority === 'high' ? 'bg-amber-500' : priority === 'medium' ? 'bg-blue-500' : 'bg-emerald-500'}`} style={{ width }}></div>
                   </div>
                 </div>
               );
             })}
             {complaintsList.length === 0 && <div className="text-center text-slate-400 font-medium">No data</div>}
           </div>
        </div>
      </div>
    </div>
  );
}
