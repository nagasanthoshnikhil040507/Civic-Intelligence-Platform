import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 lg:px-12 sticky top-0 z-50">
      <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
        <Shield className="w-8 h-8 text-blue-600 dark:text-blue-500" />
        <div className="flex flex-col justify-center">
          <span className="font-bold text-lg leading-tight tracking-tight text-slate-900 dark:text-white">Civic Intelligence</span>
          <span className="text-[10px] uppercase font-bold tracking-widest text-blue-600 dark:text-blue-500 leading-none">Platform</span>
        </div>
      </Link>
      <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
        <Link to="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Home</Link>
        <Link to="/about" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">About</Link>
        <Link to="/login" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Citizen Portal</Link>
      </div>
    </nav>
  );
}
