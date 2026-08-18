import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';

import PublicLayout from '@/layouts/PublicLayout';
import AuthLayout from '@/layouts/AuthLayout';
import DashboardLayout from '@/layouts/DashboardLayout';
import LoadingScreen from '@/components/LoadingScreen';
import { ProtectedRoute } from '@/components/ProtectedRoute';

const Landing = lazy(() => import('@/pages/Landing'));
const Login = lazy(() => import('@/pages/auth/Login'));
const Register = lazy(() => import('@/pages/auth/Register'));
const OfficerLogin = lazy(() => import('@/pages/auth/OfficerLogin'));
const OfficerRegister = lazy(() => import('@/pages/auth/OfficerRegister'));
const AdminLogin = lazy(() => import('@/pages/auth/AdminLogin'));
const AdminRegister = lazy(() => import('@/pages/auth/AdminRegister'));
const Unauthorized = lazy(() => import('@/pages/Unauthorized'));

const Dashboard = lazy(() => import('@/pages/dashboard/Dashboard'));
const Complaints = lazy(() => import('@/pages/dashboard/Complaints'));
const ComplaintDetails = lazy(() => import('@/pages/dashboard/ComplaintDetails'));
const ReportComplaint = lazy(() => import('@/pages/dashboard/ReportComplaint'));
const Analytics = lazy(() => import('@/pages/dashboard/Analytics'));
const Profile = lazy(() => import('@/pages/dashboard/Profile'));
const Settings = lazy(() => import('@/pages/dashboard/Settings'));
const NotFound = lazy(() => import('@/pages/NotFound'));

import OfficerLayout from '@/layouts/OfficerLayout';
const OfficerDashboard = lazy(() => import('@/pages/officer/OfficerDashboard'));
const OfficerComplaints = lazy(() => import('@/pages/officer/AllComplaints'));
const OfficerAssigned = lazy(() => import('@/pages/officer/AssignedComplaints'));
const OfficerComplaintDetails = lazy(() => import('@/pages/officer/ComplaintDetails'));
// const OfficerDepartments = lazy(() => import('@/pages/officer/Departments')); // Coming soon

import AdminLayout from '@/layouts/AdminLayout';
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const AdminComplaints = lazy(() => import('@/pages/admin/AdminComplaints'));
const AdminComplaintDetails = lazy(() => import('@/pages/admin/AdminComplaintDetails'));
const AdminUsersList = lazy(() => import('@/pages/admin/AdminUsersList'));
const AdminUserDetails = lazy(() => import('@/pages/admin/AdminUserDetails'));
const AdminInsights = lazy(() => import('@/pages/admin/AdminInsights'));

const withSuspense = (Component: React.ComponentType) => (
  <Suspense fallback={<LoadingScreen />}>
    <Component />
  </Suspense>
);

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: withSuspense(Landing) },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: withSuspense(Login) },
      { path: '/register', element: withSuspense(Register) },
    ],
  },
  {
    path: '/officer/login',
    element: <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">{withSuspense(OfficerLogin)}</div>,
  },
  {
    path: '/officer/register',
    element: <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">{withSuspense(OfficerRegister)}</div>,
  },
  {
    path: '/admin/login',
    element: <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">{withSuspense(AdminLogin)}</div>,
  },
  {
    path: '/admin/register',
    element: <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">{withSuspense(AdminRegister)}</div>,
  },
  { path: '/unauthorized', element: withSuspense(Unauthorized) },
  {
    path: '/dashboard',
    element: <ProtectedRoute allowedRoles={['citizen']} />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { index: true, element: withSuspense(Dashboard) },
          { path: 'complaints', element: withSuspense(Complaints) },
          { path: 'complaints/:id', element: withSuspense(ComplaintDetails) },
          { path: 'report', element: withSuspense(ReportComplaint) },
          { path: 'analytics', element: withSuspense(Analytics) },
          { path: 'profile', element: withSuspense(Profile) },
          { path: 'settings', element: withSuspense(Settings) },
        ]
      }
    ],
  },
  {
    path: '/officer',
    element: <ProtectedRoute allowedRoles={['officer']} />,
    children: [
      {
        element: <OfficerLayout />,
        children: [
          { index: true, element: withSuspense(OfficerDashboard) },
          { path: 'complaints', element: withSuspense(OfficerComplaints) },
          { path: 'assigned', element: withSuspense(OfficerAssigned) },
          { path: 'complaints/:id', element: withSuspense(OfficerComplaintDetails) },
          { path: 'profile', element: withSuspense(Profile) },
          { path: 'settings', element: withSuspense(Settings) },
        ]
      }
    ]
  },
  {
    path: '/admin',
    element: <ProtectedRoute allowedRoles={['admin']} />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: withSuspense(AdminDashboard) },
          { path: 'complaints', element: withSuspense(AdminComplaints) },
          { path: 'complaints/:id', element: withSuspense(AdminComplaintDetails) },
          { path: 'users/citizens', element: withSuspense(AdminUsersList) },
          { path: 'users/officers', element: withSuspense(AdminUsersList) },
          { path: 'users/:id', element: withSuspense(AdminUserDetails) },
          { path: 'insights', element: withSuspense(AdminInsights) },
          { path: 'profile', element: withSuspense(Profile) },
          { path: 'settings', element: withSuspense(Settings) },
        ]
      }
    ]
  },
  { path: '*', element: withSuspense(NotFound) },
]);
