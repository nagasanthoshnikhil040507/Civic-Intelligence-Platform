import { useAuthStore } from '@/store/authStore';
import { useEffect, useState } from 'react';
import { ComplaintService } from '@/services/complaint.service';
import { AdminService } from '@/services/admin.service';
import { GlassCard } from '@/components/ui/GlassCard';
import { UserCircle, Mail, Phone, Shield, Building, Loader2, CheckCircle2, Activity } from 'lucide-react';

export default function Profile() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        if (user?.role === 'admin') {
          const sysStats = await AdminService.getSystemStats();
          setStats(sysStats);
        } else {
          const complaints = await ComplaintService.getMyComplaints({ limit: 1000 });
          if (Array.isArray(complaints)) {
            const active = complaints.filter(c => ['pending', 'in_progress', 'assigned'].includes(c.status)).length;
            const resolved = complaints.filter(c => ['resolved', 'closed'].includes(c.status)).length;
            setStats({ active, resolved, total: complaints.length });
          }
        }
      } catch (err) {
        console.error('Failed to fetch profile stats', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      fetchStats();
    }
  }, [user]);

  if (!user) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-inner border border-indigo-200 dark:border-indigo-800">
            <UserCircle className="w-12 h-12" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {user.firstName} {user.lastName}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                user.role === 'admin' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400' :
                user.role === 'officer' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400' :
                'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400'
              }`}>
                {user.role}
              </span>
              <span className="text-slate-500 dark:text-slate-400 text-sm font-medium flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Active Account
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Info */}
        <div className="lg:col-span-1">
          <GlassCard className="p-6 space-y-6">
            <h3 className="font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">Contact Information</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Email Address</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Phone Number</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{user.phone || 'Not provided'}</p>
                </div>
              </div>
              {user.department && (
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <Building className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Department</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {user.department === 'SANITATION' ? 'Sanitation Department' : 
                       user.department === 'ROADS' ? 'Roads Department' : 'Unassigned'}
                    </p>
                    {user.requestedDepartment && user.departmentStatus === 'PENDING' && (
                      <p className="text-xs font-semibold text-amber-600 mt-1">Requested: {user.requestedDepartment} (Pending Approval)</p>
                    )}
                  </div>
                </div>
              )}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Account Created</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                  </p>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Activity Summary */}
        <div className="lg:col-span-2">
          <GlassCard className="p-6 h-full flex flex-col">
            <h3 className="font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 mb-6">Activity Summary</h3>
            
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                <p className="text-sm text-slate-500 font-medium">Loading activity stats...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                {user.role === 'admin' ? (
                  <>
                    <div className="p-6 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50 rounded-xl flex flex-col items-center text-center justify-center">
                      <Shield className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mb-2" />
                      <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">{stats?.totalUsers || 0}</p>
                      <p className="text-sm font-semibold text-emerald-600/80 dark:text-emerald-400/80 uppercase tracking-wider">Total Platform Users</p>
                    </div>
                    <div className="p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-xl flex flex-col items-center text-center justify-center">
                      <Activity className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-2" />
                      <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{stats?.totalComplaints || 0}</p>
                      <p className="text-sm font-semibold text-blue-600/80 dark:text-blue-400/80 uppercase tracking-wider">Total Platform Reports</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50 rounded-xl flex flex-col items-center text-center justify-center">
                      <Activity className="w-8 h-8 text-amber-600 dark:text-amber-400 mb-2" />
                      <p className="text-3xl font-bold text-amber-700 dark:text-amber-300">{stats?.active || 0}</p>
                      <p className="text-sm font-semibold text-amber-600/80 dark:text-amber-400/80 uppercase tracking-wider">Active {user.role === 'officer' ? 'Assignments' : 'Reports'}</p>
                    </div>
                    <div className="p-6 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50 rounded-xl flex flex-col items-center text-center justify-center">
                      <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mb-2" />
                      <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">{stats?.resolved || 0}</p>
                      <p className="text-sm font-semibold text-emerald-600/80 dark:text-emerald-400/80 uppercase tracking-wider">Resolved {user.role === 'officer' ? 'Cases' : 'Issues'}</p>
                    </div>
                  </>
                )}
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
