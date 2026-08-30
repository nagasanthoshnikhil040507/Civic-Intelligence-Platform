import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, ChevronRight, CheckCircle2, ShieldCheck, FileText, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';

export function LoginNotificationPopup() {
  const [show, setShow] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Only show once per session
    const hasShown = sessionStorage.getItem(`notifications_shown_${user?._id}`);
    if (hasShown || !user) return;

    const fetchUnread = async () => {
      try {
        const res = await api.get('/notifications?limit=5');
        const unread = (res.data?.data || []).filter((n: any) => !n.isRead);
        
        if (unread.length > 0) {
          setNotifications(unread);
          setShow(true);
          sessionStorage.setItem(`notifications_shown_${user._id}`, 'true');
        }
      } catch (e) {
        console.error('Failed to fetch login notifications', e);
      }
    };

    fetchUnread();
  }, [user]);

  const getIcon = (type: string) => {
    if (type.includes('TRANSFER')) return <RefreshCw className="w-4 h-4 text-indigo-500" />;
    if (type.includes('COMPLETED') || type.includes('RESOLVED')) return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    if (type.includes('REJECTED')) return <AlertCircle className="w-4 h-4 text-red-500" />;
    if (type.includes('DEPARTMENT')) return <ShieldCheck className="w-4 h-4 text-blue-500" />;
    return <FileText className="w-4 h-4 text-slate-500" />;
  };

  const handleNotificationClick = async (n: any) => {
    if (!n.isRead) {
      try {
        await api.patch(`/notifications/${n._id}/read`);
      } catch (e) {}
    }
    setShow(false);

    const prefix = user?.role === 'admin' ? '/admin' : '/officer';
    if (n.transferRequestId) {
      navigate(`${prefix}/transfer-requests`);
    } else if (n.complaintId) {
      navigate(`${prefix}/complaints/${n.complaintId}`);
    } else {
      navigate(`${prefix}/notifications`);
    }
  };

  const handleViewAll = () => {
    setShow(false);
    navigate(`/${user?.role === 'admin' ? 'admin' : 'officer'}/notifications`);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20, x: 20 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: 'spring', bounce: 0.3, duration: 0.6 }}
          className="fixed top-20 right-6 z-50 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-indigo-600">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-white" />
              <h3 className="font-semibold text-white">Notifications</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-white/90 bg-white/20 px-2 py-0.5 rounded-full">
                {notifications.length} New
              </span>
              <button 
                onClick={() => setShow(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto custom-scrollbar divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
            {notifications.map((n) => (
              <div 
                key={n._id}
                onClick={() => handleNotificationClick(n)}
                className="p-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-start gap-3"
              >
                <div className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 shrink-0">
                  {getIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <h4 className="font-medium text-sm text-slate-900 dark:text-white truncate">
                    {n.title}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-0.5">
                    {n.message}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
            <button 
              onClick={handleViewAll}
              className="w-full py-2 text-sm text-center font-medium text-indigo-600 dark:text-indigo-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              View all notifications <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
