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
const Analytics = lazy(() => import('@/pages/dashboard/Analytics'));
const Profile = lazy(() => import('@/pages/dashboard/Profile'));
const Settings = lazy(() => import('@/pages/dashboard/Settings'));
const NotFound = lazy(() => import('@/pages/NotFound'));

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
    path: '/dashboard',
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { index: true, element: withSuspense(Dashboard) },
          { path: 'complaints', element: withSuspense(Complaints) },
          { path: 'analytics', element: withSuspense(Analytics) },
          { path: 'profile', element: withSuspense(Profile) },
          { path: 'settings', element: withSuspense(Settings) },
        ]
      }
    ],
  },
  { path: '*', element: withSuspense(NotFound) },
]);
