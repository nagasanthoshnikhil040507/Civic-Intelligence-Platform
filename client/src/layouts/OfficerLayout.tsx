import { Outlet } from 'react-router-dom';
import { LayoutDashboard, FileText, Briefcase, User, Settings, Inbox } from 'lucide-react';
import { SidebarLayout } from '@/components/navigation/SidebarLayout';

export default function OfficerLayout() {
  const navItems = [
    { name: 'Dashboard', path: '/officer', icon: LayoutDashboard },
    { name: 'Assigned Complaints', path: '/officer/assigned', icon: Inbox },
    { name: 'All Complaints', path: '/officer/complaints', icon: FileText },
    { name: 'Profile', path: '/officer/profile', icon: User },
    { name: 'Settings', path: '/officer/settings', icon: Settings },
  ];

  return (
    <SidebarLayout navItems={navItems}>
      <Outlet />
    </SidebarLayout>
  );
}
