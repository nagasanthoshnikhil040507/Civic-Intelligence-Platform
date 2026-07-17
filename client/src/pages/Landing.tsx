import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserCircle, ShieldCheck, ArrowRight } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full space-y-12 text-center"
      >
        <div className="space-y-4">
          <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Welcome to Civic Intel
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Choose how you want to continue
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Link
            to="/login"
            className="group flex flex-col items-center justify-center gap-4 p-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 hover:border-indigo-500"
          >
            <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
              <UserCircle className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Citizen Login</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Report & track civic issues</p>
            </div>
            <ArrowRight className="w-5 h-5 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity mt-2" />
          </Link>

          <Link
            to="/officer/login"
            className="group flex flex-col items-center justify-center gap-4 p-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 hover:border-blue-500"
          >
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Officer Login</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Manage & resolve complaints</p>
            </div>
            <ArrowRight className="w-5 h-5 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity mt-2" />
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
