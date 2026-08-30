import { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../ui/GlassCard';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/authStore';

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get('/notifications/unread-count');
      setUnreadCount(res.data?.data?.count || 0);
    } catch (e) {
      console.error('Failed to fetch unread count', e);
    }
  };

  const fetchLatest = async () => {
    try {
      const res = await api.get('/notifications?limit=5');
      setNotifications(res.data?.data || []);
    } catch (e) {
      console.error('Failed to fetch notifications', e);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (isOpen) {
      fetchLatest();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch('/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  const handleNotificationClick = async (n: any) => {
    if (!n.isRead) {
      try {
        await api.patch(`/notifications/${n._id}/read`);
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (e) {}
    }
    setIsOpen(false);

    const prefix = user?.role === 'admin' ? '/admin' : '/officer';
    if (n.transferRequestId) {
      navigate(`${prefix}/transfer-requests`);
    } else if (n.complaintId) {
      navigate(`${prefix}/complaints/${n.complaintId}`);
    } else {
      navigate(`${prefix}/notifications`);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-slate-300"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 border-2 border-white dark:border-slate-900 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
            <h3 className="font-semibold text-slate-900 dark:text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllAsRead}
                className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-medium flex items-center gap-1"
              >
                <CheckCircle2 className="w-3 h-3" /> Mark all read
              </button>
            )}
          </div>
          
          <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
                  <Bell className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-slate-900 dark:text-white font-medium">No notifications yet</p>
                <p className="text-sm text-slate-500 mt-1">You're all caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {notifications.map((n) => (
                  <div 
                    key={n._id}
                    onClick={() => handleNotificationClick(n)}
                    className={cn(
                      "p-4 cursor-pointer transition-colors relative hover:bg-slate-50 dark:hover:bg-slate-800/50",
                      !n.isRead && "bg-indigo-50/50 dark:bg-indigo-900/10"
                    )}
                  >
                    {!n.isRead && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />
                    )}
                    <div className="flex justify-between items-start mb-1 gap-2">
                      <h4 className={cn("font-medium text-sm", !n.isRead ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-300")}>
                        {n.title}
                      </h4>
                      <span className="text-[10px] text-slate-500 whitespace-nowrap bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                      {n.message}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className={cn(
                        "text-[10px] font-medium px-2 py-0.5 rounded-md",
                        n.priority === 'HIGH' || n.priority === 'URGENT' ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      )}>
                        {n.priority}
                      </span>
                      {!n.isRead && (
                        <button 
                          onClick={(e) => handleMarkAsRead(e, n._id)}
                          className="text-[10px] text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 px-2 py-1 rounded transition-colors"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
            <button 
              onClick={() => { setIsOpen(false); navigate(`/${user?.role === 'admin' ? 'admin' : 'officer'}/notifications`); }}
              className="w-full py-2 text-sm text-center font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
