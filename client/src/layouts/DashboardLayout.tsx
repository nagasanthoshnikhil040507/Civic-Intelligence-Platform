import { Outlet } from 'react-router-dom';
import { LayoutDashboard, FileText, BarChart3, User, Settings, AlertTriangle } from 'lucide-react';
import { SidebarLayout } from '@/components/navigation/SidebarLayout';

export default function DashboardLayout() {
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Report Issue', path: '/dashboard/report', icon: AlertTriangle },
    { name: 'My Complaints', path: '/dashboard/complaints', icon: FileText },
    { name: 'Analytics', path: '/dashboard/analytics', icon: BarChart3 },
    { name: 'Profile', path: '/dashboard/profile', icon: User },
    { name: 'Settings', path: '/dashboard/settings', icon: Settings },
  ];

  return (
    <SidebarLayout navItems={navItems}>
      <Outlet />
    </SidebarLayout>
  );
}
