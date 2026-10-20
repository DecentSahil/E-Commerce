import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { NotificationBell } from '../notifications/NotificationBell';
import {
  Shield,
  Boxes,
  Tags,
  ShoppingBag,
  Store,
  ExternalLink,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

export const AdminLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const displayName = user?.fullName || user?.email?.split('@')[0] || 'Administrator';
  const initial = displayName[0]?.toUpperCase() || 'A';

  const currentTab = new URLSearchParams(location.search).get('tab') || 'products';

  const navItems = [
    {
      label: 'Catalog Products',
      icon: Boxes,
      to: '/admin?tab=products',
      active: currentTab === 'products' || (!location.search.includes('tab=categories_brands') && !location.search.includes('tab=orders') && !location.search.includes('tab=sellers')),
    },
    {
      label: 'Categories & Brands',
      icon: Tags,
      to: '/admin?tab=categories_brands',
      active: currentTab === 'categories_brands',
    },
    {
      label: 'Platform Orders',
      icon: ShoppingBag,
      to: '/admin?tab=orders',
      active: currentTab === 'orders',
    },
    {
      label: 'Seller Approvals',
      icon: Store,
      to: '/admin?tab=sellers',
      active: currentTab === 'sellers',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans">
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90 shadow-2xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition"
              aria-label="Toggle navigation"
            >
              {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link to="/admin" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center font-black text-base shadow-xs shadow-rose-200">
                <Shield className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-black tracking-tight text-slate-900 leading-none">
                  Admin<span className="text-rose-600 font-extrabold">Console</span>
                </span>
                <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase mt-0.5">
                  Platform Operations
                </span>
              </div>
            </Link>

            <span className="hidden sm:inline-flex items-center gap-1 ml-2.5 px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 border border-rose-200 text-[10px] font-extrabold uppercase tracking-wide">
              {user?.role || 'ROLE_ADMIN'}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/products"
              target="_blank"
              rel="noreferrer"
              className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/50 transition shadow-2xs"
              title="Open public marketplace catalog in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              <span>View Storefront</span>
            </Link>

            <NotificationBell />

            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center font-extrabold text-xs">
                {initial}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-slate-900 leading-tight">{displayName}</div>
                <div className="text-[10px] text-slate-400 truncate max-w-[120px]">{user?.email}</div>
              </div>
              <button
                onClick={logout}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition ml-0.5"
                title="Sign out of admin account"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-grow flex max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-3.5 sm:py-5 gap-5">
        <aside className="hidden lg:flex flex-col w-56 shrink-0 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs space-y-0.5">
            <div className="px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
              Platform Controls
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    item.active
                      ? 'bg-rose-600 text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 stroke-[2]" />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </Link>
              );
            })}
          </div>

          <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-2 shadow-xs">
            <div className="flex items-center gap-1.5 text-rose-400">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-[11px] font-extrabold uppercase tracking-wider">System Governance</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Canonical products and catalog taxonomy changes apply platform-wide across all competing seller listings.
            </p>
          </div>
        </aside>

        {mobileSidebarOpen && (
          <div
            className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm lg:hidden flex"
            onClick={() => setMobileSidebarOpen(false)}
          >
            <div
              className="w-72 bg-white h-full p-6 space-y-6 shadow-2xl animate-in slide-in-from-left duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-rose-600" />
                  <span className="font-extrabold text-sm text-slate-900">Admin Console</span>
                </div>
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.label}
                      to={item.to}
                      onClick={() => setMobileSidebarOpen(false)}
                      className={`flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition ${
                        item.active
                          ? 'bg-rose-600 text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                    </Link>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-slate-100">
                <Link
                  to="/products"
                  className="flex items-center gap-2 text-xs font-bold text-indigo-600 hover:underline"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>View Customer Storefront</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
