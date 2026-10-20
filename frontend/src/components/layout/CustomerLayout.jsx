import React, { useState, useEffect, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { useAuth } from '../../context/AuthContext';
import { cartApi } from '../../api/cart';
import { wishlistApi } from '../../api/wishlist';

export const CustomerLayout = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  const refreshCounts = useCallback(async () => {
    if (!isAuthenticated) {
      setCartCount(0);
      setWishlistCount(0);
      return;
    }

    try {
      const [cartRes, wishRes] = await Promise.allSettled([
        cartApi.getCart(),
        wishlistApi.getWishlist(),
      ]);

      if (cartRes.status === 'fulfilled' && cartRes.value?.data) {
        const rawCart = cartRes.value.data?.data || cartRes.value.data;
        const items = rawCart?.items || [];
        const totalQty = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
        setCartCount(totalQty);
      }

      if (wishRes.status === 'fulfilled' && wishRes.value?.data) {
        const rawWish = wishRes.value.data?.data || wishRes.value.data;
        const items = rawWish?.items || (Array.isArray(rawWish) ? rawWish : []);
        setWishlistCount(items.length);
      }
    } catch {}
  }, [isAuthenticated]);

  useEffect(() => {
    refreshCounts();

    window.addEventListener('focus', refreshCounts);
    window.addEventListener('cart:updated', refreshCounts);
    window.addEventListener('wishlist:updated', refreshCounts);

    return () => {
      window.removeEventListener('focus', refreshCounts);
      window.removeEventListener('cart:updated', refreshCounts);
      window.removeEventListener('wishlist:updated', refreshCounts);
    };
  }, [refreshCounts]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      <Header
        user={user}
        cartCount={cartCount}
        wishlistCount={wishlistCount}
        onLogout={logout}
      />
      <main className="flex-grow max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-3.5 sm:py-5">
        <Outlet context={{ setCartCount, setWishlistCount, refreshCounts }} />
      </main>
      <Footer />
    </div>
  );
};

export default CustomerLayout;
