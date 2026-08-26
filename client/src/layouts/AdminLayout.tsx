import { Outlet } from 'react-router-dom';
import { Shield, LayoutDashboard, User, Settings, FileText, Users, BrainCircuit } from 'lucide-react';
import { SidebarLayout } from '@/components/navigation/SidebarLayout';

export default function AdminLayout() {
  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'AI Insights', path: '/admin/insights', icon: BrainCircuit },
    { name: 'Complaints', path: '/admin/complaints', icon: FileText },
    { name: 'Citizens', path: '/admin/users/citizens', icon: Users },
    { name: 'Officers', path: '/admin/users/officers', icon: Shield },
    { name: 'Profile', path: '/admin/profile', icon: User },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <SidebarLayout navItems={navItems}>
      <Outlet />
    </SidebarLayout>
  );
}
