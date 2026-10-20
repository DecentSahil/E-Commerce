import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { NotificationBell } from '../notifications/NotificationBell';
import {
  Store,
  Boxes,
  ShoppingBag,
  ExternalLink,
  LogOut,
  Menu,
  X,
  Sparkles,
  ChevronRight,
  LayoutDashboard,
} from 'lucide-react';

export const SellerLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const displayName = user?.fullName || user?.email?.split('@')[0] || 'Merchant';
  const initial = displayName[0]?.toUpperCase() || 'M';

  const currentTab = new URLSearchParams(location.search).get('tab') || 'overview';

  const navItems = [
    {
      label: 'Dashboard Overview',
      icon: LayoutDashboard,
      to: '/seller?tab=overview',
      active: currentTab === 'overview' || (!location.search.includes('tab=listings') && !location.search.includes('tab=orders')),
    },
    {
      label: 'Product Listings',
      icon: Boxes,
      to: '/seller?tab=listings',
      active: currentTab === 'listings',
    },
    {
      label: 'Customer Orders',
      icon: ShoppingBag,
      to: '/seller?tab=orders',
      active: currentTab === 'orders',
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
              aria-label="Toggle navigation menu"
            >
              {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link to="/seller" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-base shadow-xs shadow-indigo-200">
                <Store className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-black tracking-tight text-slate-900 leading-none">
                  Nexus<span className="text-indigo-600 font-extrabold">SellerHub</span>
                </span>
                <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase mt-0.5">
                  Merchant Workspace
                </span>
              </div>
            </Link>

            <span className="hidden sm:inline-flex items-center gap-1.5 ml-2.5 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/90 text-[10px] font-bold uppercase tracking-wider">
              {user?.role === 'ROLE_ADMIN' || user?.role === 'ADMIN' ? 'Admin View' : 'Seller Account'}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/products"
              target="_blank"
              rel="noreferrer"
              className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 px-2.5 py-1.5 rounded-lg border border-slate-200/90 hover:border-indigo-200 hover:bg-indigo-50/50 transition shadow-2xs"
              title="Open public marketplace storefront in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              <span>View Storefront</span>
            </Link>

            <NotificationBell />

            <div className="flex items-center gap-2 pl-2 border-l border-slate-200/90">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-black text-xs shadow-2xs">
                {initial}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[140px]">
                  {displayName}
                </div>
                <div className="text-[10px] text-slate-400 truncate max-w-[140px] font-mono">
                  {user?.role || 'ROLE_SELLER'}
                </div>
              </div>
              <button
                type="button"
                onClick={logout}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition ml-0.5"
                title="Sign out of seller account"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-grow flex max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-3.5 sm:py-5 gap-5">
        <aside className="hidden lg:flex flex-col w-56 shrink-0 space-y-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-3 shadow-xs space-y-0.5">
            <div className="px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
              Merchant Navigation
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    item.active
                      ? 'bg-indigo-600 text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 stroke-[2]" />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 ${item.active ? 'text-indigo-200' : 'opacity-40'}`} />
                </Link>
              );
            })}
          </div>

          <div className="bg-indigo-50/50 border border-indigo-100/90 rounded-2xl p-4 space-y-2.5 shadow-2xs">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900">Competitive Buy Box</h4>
              <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                Maintain adequate inventory stock and competitive pricing to win the primary Buy Box for customer orders.
              </p>
            </div>
            <Link
              to="/products"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-extrabold text-indigo-700 hover:text-indigo-900"
            >
              Browse Catalog <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </aside>

        {mobileSidebarOpen && (
          <div
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs lg:hidden flex animate-in fade-in duration-150"
            onClick={() => setMobileSidebarOpen(false)}
          >
            <div
              className="w-72 bg-white h-full p-6 space-y-6 shadow-2xl animate-in slide-in-from-left duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Store className="w-5 h-5 text-indigo-600" />
                  <span className="font-extrabold text-sm text-slate-900">Merchant Workspace</span>
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
                          ? 'bg-indigo-600 text-white shadow-xs'
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
                  <span>View Public Catalog</span>
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

export default SellerLayout;
