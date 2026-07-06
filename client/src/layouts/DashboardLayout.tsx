import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Shield, LayoutDashboard, FileText, BarChart3, User, Settings, LogOut, Menu } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { AuthService } from '@/services/auth.service';

export default function DashboardLayout() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await AuthService.logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Complaints', path: '/dashboard/complaints', icon: FileText },
    { name: 'Analytics', path: '/dashboard/analytics', icon: BarChart3 },
    { name: 'Profile', path: '/dashboard/profile', icon: User },
    { name: 'Settings', path: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 hidden md:flex flex-col flex-shrink-0">
        <div className="h-16 flex items-center px-6 gap-2 text-white border-b border-slate-800">
          <Shield className="w-6 h-6 text-indigo-400" />
          <span className="font-bold text-lg tracking-tight">Civic Intel</span>
        </div>
        
        <nav className="flex-1 py-6 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${
                  isActive 
                    ? 'bg-indigo-600/10 text-indigo-400' 
                    : 'hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-3 py-2 mb-4 rounded-lg bg-slate-800">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
              {user?.firstName?.[0] || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-slate-400 truncate capitalize">{user?.role}</p>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 md:hidden">
          <div className="flex items-center gap-2 text-slate-900">
            <Shield className="w-6 h-6 text-indigo-600" />
            <span className="font-bold text-lg tracking-tight">Civic Intel</span>
          </div>
          <button className="text-slate-500 hover:text-slate-900">
            <Menu className="w-6 h-6" />
          </button>
        </header>

        <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
