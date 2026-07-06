import { Outlet } from 'react-router-dom';
import { Shield } from 'lucide-react';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left side - Dynamic Brand Image / Gradient */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-indigo-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 opacity-90" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay opacity-30" />
        
        <div className="relative z-10 w-full p-12 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-white">
            <Shield className="w-8 h-8 text-indigo-400" />
            <span className="font-bold text-xl tracking-tight">Civic Intel</span>
          </div>
          
          <div className="space-y-6">
            <h1 className="text-4xl font-bold text-white leading-tight">
              Empowering citizens.<br />
              <span className="text-indigo-400">Streamlining governance.</span>
            </h1>
            <p className="text-indigo-100/80 text-lg max-w-md">
              Join thousands of citizens actively improving their communities through transparent, AI-driven reporting.
            </p>
          </div>
          
          <div className="flex gap-4 text-sm text-indigo-200/60">
            <span>© 2026 Civic Intelligence Platform</span>
            <span>•</span>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <span>•</span>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
          </div>
        </div>
      </div>

      {/* Right side - Forms */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24">
        <div className="w-full max-w-sm">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
