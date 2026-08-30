import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { GlassCard } from '@/components/ui/GlassCard';
import { Bell, CheckCircle2, AlertCircle, RefreshCw, Trash2, ShieldCheck, MapPin, Check, FileText } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';

export default function Notifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications?limit=100');
      setNotifications(res.data?.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAll = async () => {
    await api.patch('/notifications/mark-all-read');
    fetchNotifications();
  };

  const handleClick = async (n: any) => {
    if (!n.isRead) {
      await api.patch(`/notifications/${n._id}/read`);
    }
    const prefix = user?.role === 'admin' ? '/admin' : '/officer';
    if (n.transferRequestId) {
      navigate(`${prefix}/transfer-requests`);
    } else if (n.complaintId) {
      navigate(`${prefix}/complaints/${n.complaintId}`);
    } else {
      fetchNotifications();
    }
  };

  const getIcon = (type: string) => {
    if (type.includes('TRANSFER')) return <RefreshCw className="w-5 h-5 text-indigo-500" />;
    if (type.includes('COMPLETED') || type.includes('RESOLVED')) return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
    if (type.includes('REJECTED')) return <AlertCircle className="w-5 h-5 text-red-500" />;
    if (type.includes('DEPARTMENT')) return <ShieldCheck className="w-5 h-5 text-blue-500" />;
    return <FileText className="w-5 h-5 text-slate-500" />;
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Notifications</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your system alerts and updates.</p>
        </div>
        <button
          onClick={handleMarkAll}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 dark:text-indigo-300 rounded-xl font-medium transition-colors"
        >
          <CheckCircle2 className="w-4 h-4" /> Mark all read
        </button>
      </div>

      <GlassCard className="p-0 overflow-hidden border border-slate-200 dark:border-slate-800">
        {loading ? (
          <div className="flex justify-center p-12"><RefreshCw className="w-8 h-8 animate-spin text-slate-400" /></div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">🎉 You're all caught up!</h3>
            <p className="text-slate-500 max-w-sm">No new notifications. When something important happens, you'll see it here.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {notifications.map((n) => (
              <div 
                key={n._id}
                onClick={() => handleClick(n)}
                className={`p-5 flex items-start gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${!n.isRead ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''}`}
              >
                <div className={`p-2 rounded-xl shrink-0 ${!n.isRead ? 'bg-white dark:bg-slate-800 shadow-sm' : 'bg-slate-100 dark:bg-slate-800/50'}`}>
                  {getIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className={`font-semibold text-base ${!n.isRead ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                      {n.title}
                    </h4>
                    <span className="text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg shrink-0">
                      {new Date(n.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>
                  <p className={`mt-1 text-sm ${!n.isRead ? 'text-slate-700 dark:text-slate-300' : 'text-slate-500 dark:text-slate-400'} whitespace-pre-wrap`}>
                    {n.message}
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <span className={`text-[10px] font-bold tracking-wider uppercase px-2 py-1 rounded-md ${
                      n.priority === 'HIGH' || n.priority === 'URGENT' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {n.priority}
                    </span>
                    {!n.isRead && (
                      <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-indigo-600 dark:text-indigo-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" /> New
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
