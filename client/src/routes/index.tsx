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
const Dashboard = lazy(() => import('@/pages/dashboard/Dashboard'));
const Complaints = lazy(() => import('@/pages/dashboard/Complaints'));
const ComplaintDetails = lazy(() => import('@/pages/dashboard/ComplaintDetails'));
const ReportComplaint = lazy(() => import('@/pages/dashboard/ReportComplaint'));
const Analytics = lazy(() => import('@/pages/dashboard/Analytics'));
const Profile = lazy(() => import('@/pages/dashboard/Profile'));
const Settings = lazy(() => import('@/pages/dashboard/Settings'));
const NotFound = lazy(() => import('@/pages/NotFound'));
const Unauthorized = lazy(() => import('@/pages/Unauthorized'));

import OfficerLayout from '@/layouts/OfficerLayout';
const OfficerLogin = lazy(() => import('@/pages/auth/OfficerLogin'));

const OfficerDashboard = lazy(() => import('@/pages/officer/OfficerDashboard'));
const OfficerComplaints = lazy(() => import('@/pages/officer/AllComplaints'));
const OfficerAssigned = lazy(() => import('@/pages/officer/AssignedComplaints'));
const OfficerComplaintDetails = lazy(() => import('@/pages/officer/ComplaintDetails'));
// const OfficerDepartments = lazy(() => import('@/pages/officer/Departments')); // Coming soon

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
    element: <ProtectedRoute allowedRoles={['officer', 'admin']} />,
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
  { path: '*', element: withSuspense(NotFound) },
]);
