import { useAuthStore } from '@/store/authStore';

export default function Dashboard() {
  const { user } = useAuthStore();
  
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome back, {user?.firstName}</h1>
        <p className="text-slate-500 mt-1">Here is what's happening with your civic requests today.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Placeholder cards for future data */}
        <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
          <h3 className="text-sm font-medium text-slate-500">Active Complaints</h3>
          <p className="text-3xl font-bold text-slate-900 mt-2">0</p>
        </div>
        <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
          <h3 className="text-sm font-medium text-slate-500">Resolved</h3>
          <p className="text-3xl font-bold text-slate-900 mt-2">0</p>
        </div>
        <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
          <h3 className="text-sm font-medium text-slate-500">Drafts</h3>
          <p className="text-3xl font-bold text-slate-900 mt-2">0</p>
        </div>
      </div>
    </div>
  );
}
