import { Link, useLocation } from 'react-router-dom';
import { Leaf, LogOut, Menu, X } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useLogout } from '@/hooks/useLogout';
import { useState } from 'react';
import { cn } from '../ui/GlassCard';
import { motion, AnimatePresence } from 'framer-motion';
import { NotificationBell } from '../notifications/NotificationBell';
import { LoginNotificationPopup } from '../notifications/LoginNotificationPopup';

interface NavItem {
  name: string;
  path: string;
  icon: any;
}

interface SidebarLayoutProps {
  children: React.ReactNode;
  navItems: NavItem[];
}

export function SidebarLayout({ children, navItems }: SidebarLayoutProps) {
  const { user } = useAuthStore();
  const location = useLocation();
  const handleLogout = useLogout();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <div className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path || (item.path !== '/dashboard' && item.path !== '/officer' && item.path !== '/admin' && location.pathname.startsWith(item.path));
        return (
          <Link
            key={item.name}
            to={item.path}
            onClick={onClick}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all duration-200 group",
              isActive 
                ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300" 
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-white"
            )}
          >
            <item.icon className={cn("w-5 h-5 transition-colors", isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300")} />
            {item.name}
          </Link>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-20">
        <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-200 dark:border-slate-800">
          <div className="bg-indigo-600 p-2 rounded-xl">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">
            Civic Intel
          </span>
        </div>
        
        <NavLinks />

        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 px-3 py-3 mb-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-sm">
              {user?.firstName?.[0] || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate capitalize">{user?.role}</p>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-950/30 dark:hover:text-red-400 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        
        {/* Mobile Header */}
        <header className="md:hidden h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold tracking-tight text-slate-900 dark:text-white">Civic Intel</span>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </header>

        {/* Desktop Top Nav (Only visible on MD+) */}
        <div className="hidden md:flex h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-20 items-center justify-end px-6">
          <NotificationBell />
        </div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileMenuOpen(false)}
                className="md:hidden fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40"
              />
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
                className="md:hidden fixed inset-y-0 right-0 w-72 bg-white dark:bg-slate-900 shadow-2xl z-50 flex flex-col border-l border-slate-200 dark:border-slate-800"
              >
                <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
                  <span className="font-bold text-slate-900 dark:text-white">Menu</span>
                  <button 
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <NavLinks onClick={() => setMobileMenuOpen(false)} />
                
                <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400"
                  >
                    <LogOut className="w-5 h-5" />
                    Sign out
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 dark:bg-slate-950 p-4 md:p-6 lg:p-8">
          <LoginNotificationPopup />
          {children}
        </main>
      </div>
    </div>
  );
}
