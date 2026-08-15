import { Outlet, Link, useLocation } from 'react-router-dom';
import { Shield, LayoutDashboard, User, Settings, LogOut, Menu, FileText, Users } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useLogout } from '@/hooks/useLogout';

export default function AdminLayout() {
  const { user } = useAuthStore();
  const location = useLocation();
  const handleLogout = useLogout();

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Complaints', path: '/admin/complaints', icon: FileText },
    { name: 'Citizens', path: '/admin/users/citizens', icon: Users },
    { name: 'Officers', path: '/admin/users/officers', icon: Shield },
    { name: 'Profile', path: '/admin/profile', icon: User },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans">
      {/* Sidebar - Government Style */}
      <aside className="w-64 bg-slate-900 text-slate-300 hidden md:flex flex-col flex-shrink-0 shadow-xl z-10">
        <div className="h-16 flex items-center px-6 gap-3 text-white border-b border-slate-800 bg-slate-950">
          <Shield className="w-6 h-6 text-purple-500" />
          <div className="flex flex-col">
            <span className="font-bold text-sm tracking-widest uppercase text-slate-100">Civic Intel</span>
            <span className="text-[10px] text-purple-400 font-semibold tracking-wider">ADMIN PORTAL</span>
          </div>
        </div>
        
        <nav className="flex-1 py-6 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (location.pathname.startsWith(item.path) && item.path !== '/admin');
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${
                  isActive 
                    ? 'bg-purple-600/20 text-purple-400 border-l-2 border-purple-500 rounded-l-none -ml-3 pl-5' 
                    : 'hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3 px-3 py-2 mb-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-sm">
              {user?.firstName?.[0] || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-[11px] text-purple-400 truncate uppercase font-semibold tracking-wider">
                {user?.role}
              </p>
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
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 md:hidden shadow-sm">
          <div className="flex items-center gap-2 text-slate-900">
            <Shield className="w-6 h-6 text-purple-600" />
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight leading-tight">Civic Intel</span>
              <span className="text-[10px] text-purple-600 font-bold tracking-widest leading-none">ADMIN</span>
            </div>
          </div>
          <button className="text-slate-500 hover:text-slate-900 p-2">
            <Menu className="w-6 h-6" />
          </button>
        </header>

        <main className="flex-1 p-6 sm:p-8 overflow-y-auto bg-slate-50/50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
