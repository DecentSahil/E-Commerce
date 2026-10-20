import React from 'react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 mt-8 sm:mt-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-9">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-xs">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Shop & Browse
            </h3>
            <ul className="space-y-2">
              <li>
                <Link to="/products" className="hover:text-white transition">
                  All Products
                </Link>
              </li>
              <li>
                <Link to="/cart" className="hover:text-white transition">
                  Shopping Cart
                </Link>
              </li>
              <li>
                <Link to="/wishlist" className="hover:text-white transition">
                  My Wishlist
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Merchant Hub
            </h3>
            <ul className="space-y-2">
              <li>
                <Link to="/seller" className="hover:text-white transition">
                  Seller Dashboard
                </Link>
              </li>
              <li>
                <Link to="/seller?tab=listings" className="hover:text-white transition">
                  Manage Listings
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-white transition">
                  Register as Seller
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Account & Orders
            </h3>
            <ul className="space-y-2">
              <li>
                <Link to="/orders" className="hover:text-white transition">
                  Track Orders
                </Link>
              </li>
              <li>
                <Link to="/profile" className="hover:text-white transition">
                  Profile Settings
                </Link>
              </li>
              <li>
                <Link to="/notifications" className="hover:text-white transition">
                  Notifications
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-xs">
                N
              </div>
              <span className="font-extrabold text-sm text-white">Nexus Marketplace</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px] sm:text-xs">
              A modern multi-vendor commerce platform pairing canonical product catalogs with independent seller competition.
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="px-2 py-0.5 bg-slate-800 rounded text-[10px] text-slate-300 font-mono">
                Marketplace
              </span>
              <span className="px-2 py-0.5 bg-slate-800 rounded text-[10px] text-slate-300 font-mono">
                Buy Box
              </span>
              <span className="px-2 py-0.5 bg-slate-800 rounded text-[10px] text-slate-300 font-mono">
                Order History
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 gap-3">
          <p>&copy; {new Date().getFullYear()} Nexus Marketplace. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="text-slate-400 text-[11px]">Multi-Vendor E-Commerce Platform</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
