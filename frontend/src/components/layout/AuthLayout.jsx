import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

export const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 relative overflow-hidden">
      <div className="absolute top-0 right-1/4 -mt-20 w-96 h-96 bg-indigo-100/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 -mb-20 w-96 h-96 bg-slate-200/50 rounded-full blur-3xl pointer-events-none" />

      <header className="relative z-10 border-b border-slate-200/90 bg-white/80 backdrop-blur-md sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-base shadow-xs group-hover:bg-indigo-700 transition">
              N
            </div>
            <span className="text-base font-black tracking-tight text-slate-900">
              Nexus<span className="text-indigo-600">Market</span>
            </span>
          </Link>

          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Marketplace</span>
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex-grow flex items-center justify-center py-6 px-4 sm:px-6">
        <div className="w-full max-w-5xl my-auto">
          <Outlet />
        </div>
      </main>

      <footer className="relative z-10 py-3.5 border-t border-slate-200/90 bg-white text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-slate-500 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Secure Authentication & Session Protection</span>
          </div>
          <div>
            &copy; {new Date().getFullYear()} Nexus Marketplace. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AuthLayout;
