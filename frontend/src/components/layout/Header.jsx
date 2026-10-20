import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ShoppingCart,
  Heart,
  Search,
  User,
  LogOut,
  Package,
  Shield,
  Store,
  Bell,
  X,
  Menu,
  ChevronDown,
  Sparkles,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { NotificationBell } from '../notifications/NotificationBell';
import { productsApi } from '../../api/products';

export const Header = ({
  user,
  cartCount = 0,
  wishlistCount = 0,
  onLogout,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchParam = params.get('search');
    if (searchParam !== null) {
      setSearchQuery(searchParam);
    }
  }, [location.search]);

  useEffect(() => {
    setDropdownOpen(false);
    setMobileDrawerOpen(false);
    setMobileSearchOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    let isMounted = true;
    productsApi
      .getCategories()
      .then((res) => {
        if (!isMounted) return;
        const cats = Array.isArray(res.data) ? res.data : [];
        setCategories(cats);
      })
      .catch(() => {
        if (isMounted) setCategories([]);
      })
      .finally(() => {
        if (isMounted) setCategoriesLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setDropdownOpen(false);
        setMobileDrawerOpen(false);
        setMobileSearchOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [dropdownOpen]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      navigate(`/products?search=${encodeURIComponent(query)}`);
    } else {
      navigate('/products');
    }
    setMobileSearchOpen(false);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const userInitial = user?.fullName
    ? user.fullName[0].toUpperCase()
    : user?.email
    ? user.email[0].toUpperCase()
    : '?';

  const displayName = user?.fullName || user?.email?.split('@')[0] || 'User';
  const roleLabel = user?.role?.replace('ROLE_', '') || 'CUSTOMER';

  return (
    <header
      className={`sticky top-0 z-50 bg-white transition-shadow duration-200 ${
        scrolled ? 'shadow-xs border-b border-slate-200' : 'border-b border-slate-200/80'
      }`}
    >
      <div className="bg-slate-900 text-slate-300 text-[11px] py-1 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 text-slate-300">
            <Sparkles className="w-3 h-3 text-indigo-400 shrink-0" />
            <span className="font-medium truncate">
              Multi-Vendor Marketplace — Compare independent seller offers on canonical products
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-3 shrink-0 text-[11px] font-semibold">
            {(user?.role === 'ROLE_SELLER' || user?.role === 'SELLER') && (
              <Link
                to="/seller"
                className="text-amber-400 hover:text-amber-300 flex items-center gap-1 transition"
              >
                <Store className="w-3 h-3" /> Seller Hub
              </Link>
            )}
            {(user?.role === 'ROLE_ADMIN' || user?.role === 'ADMIN') && (
              <Link
                to="/admin"
                className="text-rose-400 hover:text-rose-300 flex items-center gap-1 transition"
              >
                <Shield className="w-3 h-3" /> Admin Workspace
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-2.5">
        <div className="flex items-center justify-between gap-3 md:gap-6">
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="lg:hidden p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
              aria-label="Open navigation menu"
              aria-expanded={mobileDrawerOpen}
            >
              <Menu className="w-5 h-5" />
            </button>

            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-base shadow-xs group-hover:bg-indigo-700 transition">
                N
              </div>
              <div className="hidden sm:block">
                <span className="text-base font-black tracking-tight text-slate-900 leading-none block">
                  Nexus<span className="text-indigo-600">Market</span>
                </span>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none block mt-0.5">
                  Marketplace
                </span>
              </div>
            </Link>
          </div>

          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-2xl hidden md:block">
            <div className="relative group">
              <Search className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 absolute left-3 top-1/2 -translate-y-1/2 transition-colors pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search products, brands, specifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-20 py-2 bg-slate-50/90 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 h-9"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-16 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-md transition"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="submit"
                className="absolute right-1 top-1/2 -translate-y-1/2 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-xs h-7 flex items-center justify-center"
              >
                Search
              </button>
            </div>
          </form>

          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="md:hidden w-8 h-8 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
              aria-label="Toggle mobile search"
            >
              <Search className="w-4 h-4" />
            </button>

            <NotificationBell />

            <Link
              to="/wishlist"
              className="relative w-9 h-9 flex items-center justify-center text-slate-700 hover:text-rose-600 hover:bg-slate-100 rounded-xl transition-colors"
              title="Wishlist"
              aria-label="Wishlist"
            >
              <Heart className="w-4 h-4" />
              {wishlistCount > 0 && (
                <span className="absolute top-1 right-1 bg-rose-600 text-white text-[9px] font-black rounded-full min-w-4 h-4 px-1 flex items-center justify-center shadow-2xs ring-1 ring-white">
                  {wishlistCount > 99 ? '99+' : wishlistCount}
                </span>
              )}
            </Link>

            <Link
              to="/cart"
              className="relative w-9 h-9 flex items-center justify-center text-slate-700 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-colors"
              title="Shopping Cart"
              aria-label="Shopping Cart"
            >
              <ShoppingCart className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 bg-indigo-600 text-white text-[9px] font-black rounded-full min-w-4 h-4 px-1 flex items-center justify-center shadow-2xs ring-1 ring-white">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>

            {user ? (
              <div className="relative ml-0.5 sm:ml-1" ref={dropdownRef}>
                <button
                  type="button"
                  id="header-user-menu-btn"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-1.5 pl-1 pr-2 py-1 h-9 rounded-xl hover:bg-slate-100 transition text-slate-700"
                  aria-expanded={dropdownOpen}
                  aria-haspopup="true"
                >
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow-xs overflow-hidden">
                    {user?.profilePictureUrl ? (
                      <img
                        src={user.profilePictureUrl}
                        alt={displayName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      userInitial
                    )}
                  </div>
                  <span className="hidden lg:inline text-xs font-bold text-slate-800 max-w-[85px] truncate">
                    {displayName}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                      dropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 overflow-hidden animate-in fade-in duration-150">
                    <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/70">
                      <p className="text-xs font-extrabold text-slate-900 truncate">{displayName}</p>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{user.email}</p>
                      <span className="inline-block mt-1 px-1.5 py-0.2 bg-indigo-100/70 text-indigo-700 rounded text-[9px] font-bold">
                        {roleLabel}
                      </span>
                    </div>

                    <div className="py-1 text-xs">
                      <Link
                        to="/orders"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 gap-2.5 transition font-medium"
                      >
                        <Package className="w-4 h-4 text-slate-400" />
                        <span>My Orders</span>
                      </Link>

                      <Link
                        to="/wishlist"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-rose-600 gap-2.5 transition font-medium"
                      >
                        <Heart className="w-4 h-4 text-slate-400" />
                        <span>My Wishlist</span>
                      </Link>

                      <Link
                        to="/profile"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 gap-2.5 transition font-medium"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        <span>Profile Settings</span>
                      </Link>

                      {(user.role === 'ROLE_SELLER' || user.role === 'SELLER') && (
                        <Link
                          to="/seller"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center px-4 py-2 text-amber-800 hover:bg-amber-50 gap-2.5 transition font-bold"
                        >
                          <Store className="w-4 h-4 text-amber-600" />
                          <span>Seller Dashboard</span>
                        </Link>
                      )}

                      {(user.role === 'ROLE_ADMIN' || user.role === 'ADMIN') && (
                        <Link
                          to="/admin"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center px-4 py-2 text-rose-800 hover:bg-rose-50 gap-2.5 transition font-bold"
                        >
                          <Shield className="w-4 h-4 text-rose-600" />
                          <span>Admin Dashboard</span>
                        </Link>
                      )}
                    </div>

                    <div className="border-t border-slate-100 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setDropdownOpen(false);
                          onLogout?.();
                        }}
                        className="w-full flex items-center px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 gap-2.5 font-bold transition"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 ml-1">
                <Link
                  to="/login"
                  className="px-3 py-1.5 h-8 flex items-center justify-center text-xs font-bold text-slate-700 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-1.5 h-8 flex items-center justify-center text-xs font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-xs"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>

        {mobileSearchOpen && (
          <div className="md:hidden pt-2 pb-1 border-t border-slate-100 mt-2">
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-indigo-500 h-8"
                />
              </div>
              <button
                type="submit"
                className="px-3.5 py-1 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition shrink-0 h-8 flex items-center"
              >
                Go
              </button>
            </form>
          </div>
        )}
      </div>

      <nav
        aria-label="Product categories"
        className="border-t border-b border-slate-200/80 bg-white px-3 sm:px-6 overflow-x-auto scrollbar-none"
      >
        <div className="max-w-7xl mx-auto flex items-center gap-1 py-1 whitespace-nowrap text-xs">
          <Link
            to="/products"
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              location.pathname === '/products' && !location.search.includes('category=')
                ? 'text-indigo-700 bg-indigo-50'
                : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
            }`}
          >
            All Products
          </Link>

          {categories.map((cat) => {
            const isCatActive = location.search.includes(`category=${encodeURIComponent(cat.name)}`);
            return (
              <Link
                key={cat.id || cat.name}
                to={`/products?category=${encodeURIComponent(cat.name)}`}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  isCatActive
                    ? 'text-indigo-700 bg-indigo-50 font-bold'
                    : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
                }`}
              >
                {cat.name}
              </Link>
            );
          })}
        </div>
      </nav>

      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
          />

          <div className="fixed inset-y-0 left-0 w-full max-w-xs bg-white shadow-xl flex flex-col z-10 overflow-y-auto">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <Link
                to="/"
                onClick={() => setMobileDrawerOpen(false)}
                className="flex items-center gap-2"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-sm">
                  N
                </div>
                <span className="font-black text-slate-900 text-base">NexusMarket</span>
              </Link>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                aria-label="Close navigation menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-slate-100 bg-slate-50">
              {user ? (
                <div>
                  <p className="text-xs font-bold text-slate-900 truncate">{displayName}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                  <span className="inline-block mt-1 px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[9px] font-bold">
                    {roleLabel}
                  </span>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-slate-500">Sign in to manage orders and track shipments.</p>
                  <div className="flex gap-2">
                    <Link
                      to="/login"
                      onClick={() => setMobileDrawerOpen(false)}
                      className="flex-1 text-center py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileDrawerOpen(false)}
                      className="flex-1 text-center py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-bold"
                    >
                      Register
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 space-y-4 flex-1 text-xs">
              <div>
                <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-2">
                  Storefront Navigation
                </p>
                <div className="space-y-1">
                  <Link
                    to="/products"
                    onClick={() => setMobileDrawerOpen(false)}
                    className="flex items-center justify-between py-2 px-2.5 rounded-lg text-slate-700 hover:bg-slate-100 font-semibold"
                  >
                    <span>All Products</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </Link>
                  <Link
                    to="/cart"
                    onClick={() => setMobileDrawerOpen(false)}
                    className="flex items-center justify-between py-2 px-2.5 rounded-lg text-slate-700 hover:bg-slate-100 font-semibold"
                  >
                    <span>Shopping Cart</span>
                    {cartCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold">
                        {cartCount}
                      </span>
                    )}
                  </Link>
                  <Link
                    to="/wishlist"
                    onClick={() => setMobileDrawerOpen(false)}
                    className="flex items-center justify-between py-2 px-2.5 rounded-lg text-slate-700 hover:bg-slate-100 font-semibold"
                  >
                    <span>Wishlist</span>
                    {wishlistCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold">
                        {wishlistCount}
                      </span>
                    )}
                  </Link>
                  {user && (
                    <Link
                      to="/orders"
                      onClick={() => setMobileDrawerOpen(false)}
                      className="flex items-center justify-between py-2 px-2.5 rounded-lg text-slate-700 hover:bg-slate-100 font-semibold"
                    >
                      <span>My Orders</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    </Link>
                  )}
                </div>
              </div>

              {categories.length > 0 && (
                <div>
                  <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-2">
                    Browse Categories
                  </p>
                  <div className="space-y-1">
                    {categories.map((cat) => (
                      <Link
                        key={cat.id || cat.name}
                        to={`/products?category=${encodeURIComponent(cat.name)}`}
                        onClick={() => setMobileDrawerOpen(false)}
                        className="block py-1.5 px-2.5 rounded-lg text-slate-600 hover:bg-slate-100 font-medium"
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {user && (user.role === 'ROLE_SELLER' || user.role === 'SELLER' || user.role === 'ROLE_ADMIN' || user.role === 'ADMIN') && (
                <div className="pt-2 border-t border-slate-100">
                  <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-2">
                    Portals
                  </p>
                  {(user.role === 'ROLE_SELLER' || user.role === 'SELLER') && (
                    <Link
                      to="/seller"
                      onClick={() => setMobileDrawerOpen(false)}
                      className="flex items-center gap-2 py-2 px-2.5 rounded-lg text-amber-800 bg-amber-50 font-bold mb-1"
                    >
                      <Store className="w-4 h-4 text-amber-600" />
                      <span>Seller Dashboard</span>
                    </Link>
                  )}
                  {(user.role === 'ROLE_ADMIN' || user.role === 'ADMIN') && (
                    <Link
                      to="/admin"
                      onClick={() => setMobileDrawerOpen(false)}
                      className="flex items-center gap-2 py-2 px-2.5 rounded-lg text-rose-800 bg-rose-50 font-bold"
                    >
                      <Shield className="w-4 h-4 text-rose-600" />
                      <span>Admin Dashboard</span>
                    </Link>
                  )}
                </div>
              )}
            </div>

            {user && (
              <div className="p-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setMobileDrawerOpen(false);
                    onLogout?.();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-xs font-bold transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
