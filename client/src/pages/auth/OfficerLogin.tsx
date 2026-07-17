import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { Loader2, ShieldCheck } from 'lucide-react';
import { AuthService } from '@/services/auth.service';

const officerLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type OfficerLoginForm = z.infer<typeof officerLoginSchema>;

export default function OfficerLogin() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<OfficerLoginForm>({
    resolver: zodResolver(officerLoginSchema),
  });

  const onSubmit = async (data: OfficerLoginForm) => {
    try {
      setServerError('');
      // Send expectedRole so the backend blocks citizens from logging in here
      await AuthService.login({ ...data, expectedRole: 'officer' });
      navigate('/officer', { replace: true });
    } catch (error: any) {
      setServerError(error.response?.data?.message || 'Invalid email or password');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-md mx-auto">
      <div className="flex flex-col items-center space-y-3 text-center">
        <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-full">
          <ShieldCheck className="w-10 h-10 text-blue-700 dark:text-blue-400" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Officer Portal</h2>
        <p className="text-slate-500 dark:text-slate-400">Secure access for authorized personnel</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700">
        {serverError && (
          <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
            <span className="font-semibold">Error:</span> {serverError}
          </div>
        )}
        
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="email">Official Email</label>
            <input
              {...register('email')}
              id="email"
              type="email"
              placeholder="officer@civic.com"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900 dark:text-white"
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
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900 dark:text-white"
            />
            {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Authenticate'}
        </button>
      </form>
      
      <div className="text-center text-xs text-slate-400">
        Protected System. Unauthorized access is strictly prohibited.
      </div>
    </div>
  );
}
