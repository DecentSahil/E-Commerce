import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Compass,
  ArrowLeft,
  Search,
  ShoppingBag,
  Home,
  ChevronRight,
} from 'lucide-react';

export const NotFoundPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/products');
    }
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate('/');
    }
  };

  return (
    <div className="py-12 sm:py-20 px-4 max-w-xl mx-auto text-center space-y-6 animate-in fade-in duration-150">
      <div className="w-20 h-20 rounded-3xl bg-indigo-50 border border-indigo-100/80 text-indigo-600 flex items-center justify-center mx-auto shadow-xs">
        <Compass className="w-10 h-10 stroke-[1.6] animate-pulse" />
      </div>

      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-black tracking-wider uppercase">
          Error 404 • Resource Not Found
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Lost in the Marketplace?
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-md mx-auto">
          The page or product link you visited doesn't exist, has been removed by the merchant, or has moved to an updated URL.
        </p>
      </div>

      <form onSubmit={handleSearchSubmit} className="max-w-md mx-auto relative">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products, brands, or categories..."
            className="w-full pl-10 pr-24 py-3 bg-white border border-slate-200/90 rounded-2xl text-xs font-semibold text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 shadow-2xs transition"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            Search
          </button>
        </div>
      </form>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <button
          type="button"
          onClick={handleGoBack}
          className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Go Back</span>
        </button>

        <Link
          to="/"
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs shadow-indigo-100"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Return to Storefront</span>
        </Link>

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

export default NotFoundPage;
