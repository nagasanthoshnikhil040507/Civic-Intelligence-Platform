import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserCircle, ShieldCheck, ArrowRight, Settings } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-6 pt-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-6xl w-full space-y-16 text-center"
      >
        <div className="space-y-6 max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Civic Intelligence
          </h1>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400">
            A smarter platform for reporting, managing and resolving civic waste issues.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {/* Citizen Portal Card */}
          <Link
            to="/login"
            className="group flex flex-col items-center justify-between text-center p-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 hover:border-indigo-500 h-full"
          >
            <div className="flex flex-col items-center gap-6">
              <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                <UserCircle className="w-10 h-10" />
              </div>
              <div className="space-y-3">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Citizen Portal</h2>
                <p className="text-base text-slate-500 dark:text-slate-400">
                  Report garbage issues and track complaint progress.
                </p>
              </div>
            </div>
            <div className="mt-8 flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold">
              <span>Citizen Login</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Officer Portal Card */}
          <Link
            to="/officer/login"
            className="group flex flex-col items-center justify-between text-center p-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 hover:border-blue-500 h-full"
          >
            <div className="flex flex-col items-center gap-6">
              <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-10 h-10" />
              </div>
              <div className="space-y-3">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Officer Portal</h2>
                <p className="text-base text-slate-500 dark:text-slate-400">
                  Review, manage and resolve reported garbage issues.
                </p>
              </div>
            </div>
            <div className="mt-8 flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold">
              <span>Officer Login</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Admin Portal Card */}
          <Link
            to="/admin/login"
            className="group flex flex-col items-center justify-between text-center p-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 hover:border-purple-500 h-full"
          >
            <div className="flex flex-col items-center gap-6">
              <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                <Settings className="w-10 h-10" />
              </div>
              <div className="space-y-3">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Portal</h2>
                <p className="text-base text-slate-500 dark:text-slate-400">
                  Monitor users, complaints and overall platform activity.
                </p>
              </div>
            </div>
            <div className="mt-8 flex items-center gap-2 text-purple-600 dark:text-purple-400 font-semibold">
              <span>Admin Login</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
