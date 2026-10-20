import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldAlert,
  ArrowLeft,
  Home,
  LogOut,
  LogIn,
  ShoppingBag,
} from 'lucide-react';

export const AccessDeniedPage = ({ allowedRoles = [] }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSwitchAccount = async () => {
    try {
      await logout();
    } catch {}
    navigate('/login', { state: { from: location } });
  };

  const formattedRequiredRoles = allowedRoles && allowedRoles.length > 0
    ? allowedRoles.map((r) => r.replace('ROLE_', '')).join(' or ')
    : 'Administrative';

  return (
    <div className="py-12 sm:py-20 px-4 max-w-xl mx-auto text-center space-y-6 animate-in fade-in duration-150">
      <div className="w-20 h-20 rounded-3xl bg-rose-50 border border-rose-100/90 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
        <ShieldAlert className="w-10 h-10 stroke-[1.6]" />
      </div>

      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200/80 text-rose-800 text-[11px] font-black tracking-wider uppercase">
          Error 403 • Access Restricted
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Privileged Workspace
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-md mx-auto">
          {isAuthenticated ? (
            <>
              You are currently signed in as{' '}
              <span className="font-bold text-slate-800">{user?.email || 'Customer'}</span> with role{' '}
              <span className="font-mono font-bold bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-xs">
                {user?.role || 'ROLE_CUSTOMER'}
              </span>
              . This operational portal requires <span className="font-bold text-slate-800">{formattedRequiredRoles}</span> privileges.
            </>
          ) : (
            <>
              This operational workspace requires merchant or administrative authentication. Please sign in with an authorized account.
            </>
          )}
        </p>
      </div>

      {isAuthenticated && (
        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl max-w-sm mx-auto text-xs text-slate-600 flex items-center justify-between">
          <span className="text-slate-400 font-bold uppercase text-[10px]">Active Session</span>
          <span className="font-mono text-slate-700 font-bold">{user?.email}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Link
          to="/"
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs shadow-indigo-100"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Return to Storefront</span>
        </Link>

        {isAuthenticated ? (
          <button
            type="button"
            onClick={handleSwitchAccount}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-400" />
            <span>Switch Account</span>
          </button>
        ) : (
          <Link
            to="/login"
            state={{ from: location }}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
          >
            <LogIn className="w-3.5 h-3.5 text-indigo-600" />
            <span>Sign In</span>
          </Link>
        )}

        <Link
          to="/products"
          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Browse Catalog</span>
        </Link>
      </div>
    </div>
  );
};

export default AccessDeniedPage;
