import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2, Settings, ArrowLeft } from 'lucide-react';
import { AuthService } from '@/services/auth.service';

const adminLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type AdminLoginForm = z.infer<typeof adminLoginSchema>;

export default function AdminLogin() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<AdminLoginForm>({
    resolver: zodResolver(adminLoginSchema),
  });

  const onSubmit = async (data: AdminLoginForm) => {
    try {
      setServerError('');
      // Send expectedRole if backend supports it, otherwise we check on client
      const response = await AuthService.login({ ...data, expectedRole: 'admin' });
      const userRole = response.data?.user?.role;
      
      if (userRole === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        // Fallback check in case the backend allowed it without returning 403
        await AuthService.logout();
        setServerError('This account does not have administrator access.');
      }
    } catch (error: any) {
      if (error.response?.status === 403) {
        setServerError('This account does not have administrator access.');
      } else {
        setServerError(error.response?.data?.message || 'Invalid email or password');
      }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col items-center space-y-3 text-center">
        <div className="p-3 bg-purple-100 dark:bg-purple-900/40 rounded-full">
          <Settings className="w-10 h-10 text-purple-700 dark:text-purple-400" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Admin Portal</h2>
        <p className="text-slate-500 dark:text-slate-400">Secure system administration access</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {serverError && (
          <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
            <span className="font-semibold">Error:</span> {serverError}
          </div>
        )}
        
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="email">Admin Email</label>
            <input
              {...register('email')}
              id="email"
              type="email"
              placeholder="admin@civic.com"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-slate-900 dark:text-white"
            />
            {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="password">Password</label>
            </div>
            <input
              {...register('password')}
              id="password"
              type="password"
              placeholder="••••••••"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-slate-900 dark:text-white"
            />
            {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-purple-700 hover:bg-purple-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign in as Admin'}
        </button>
      </form>
      
      <div className="text-center text-sm text-slate-500">
        Administrator accounts are provisioned internally. <br/>
        <span className="text-slate-600 font-medium">Please contact system management for access.</span>
      </div>

      <div className="pt-4 flex justify-center border-t border-slate-200">
        <Link to="/" className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Return to Main Portal
        </Link>
      </div>
      
      <div className="text-center text-xs text-slate-400">
        Protected System. Unauthorized access is strictly prohibited.
      </div>
    </div>
  );
}
