import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Shield, LayoutDashboard, FileText, Briefcase, User, Settings, LogOut, Menu, Inbox } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { AuthService } from '@/services/auth.service';

export default function OfficerLayout() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await AuthService.logout();
    navigate('/officer/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/officer', icon: LayoutDashboard },
    { name: 'Assigned Complaints', path: '/officer/assigned', icon: Inbox },
    { name: 'All Complaints', path: '/officer/complaints', icon: FileText },
    { name: 'Departments', path: '/officer/departments', icon: Briefcase },
    { name: 'Profile', path: '/officer/profile', icon: User },
    { name: 'Settings', path: '/officer/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans">
      {/* Sidebar - Government Style */}
      <aside className="w-64 bg-slate-900 text-slate-300 hidden md:flex flex-col flex-shrink-0 shadow-xl z-10">
        <div className="h-16 flex items-center px-6 gap-3 text-white border-b border-slate-800 bg-slate-950">
          <Shield className="w-6 h-6 text-blue-500" />
          <div className="flex flex-col">
            <span className="font-bold text-sm tracking-widest uppercase text-slate-100">Civic Intel</span>
            <span className="text-[10px] text-blue-400 font-semibold tracking-wider">OFFICER PORTAL</span>
          </div>
        </div>
        
        <nav className="flex-1 py-6 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (location.pathname.startsWith(item.path) && item.path !== '/officer');
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${
                  isActive 
                    ? 'bg-blue-600/20 text-blue-400 border-l-2 border-blue-500 rounded-l-none -ml-3 pl-5' 
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
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
              {user?.firstName?.[0] || 'O'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-[11px] text-blue-400 truncate uppercase font-semibold tracking-wider">
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
            <Shield className="w-6 h-6 text-blue-600" />
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight leading-tight">Civic Intel</span>
              <span className="text-[10px] text-blue-600 font-bold tracking-widest leading-none">OFFICER</span>
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
