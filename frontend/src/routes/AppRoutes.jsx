import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { CustomerLayout } from '../components/layout/CustomerLayout';
import { AuthLayout } from '../components/layout/AuthLayout';
import { SellerLayout } from '../components/layout/SellerLayout';
import { AdminLayout } from '../components/layout/AdminLayout';
import { HomePage } from '../pages/home/HomePage';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { ProfilePage } from '../pages/profile/ProfilePage';
import { NotFoundPage } from '../pages/common/NotFoundPage';
import { AccessDeniedPage } from '../pages/common/AccessDeniedPage';
import { PageLoader } from '../components/common/PageLoader';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';

const CatalogPage = lazy(() => import('../pages/catalog/CatalogPage').then((m) => ({ default: m.CatalogPage })));
const ProductDetailPage = lazy(() => import('../pages/catalog/ProductDetailPage').then((m) => ({ default: m.ProductDetailPage })));
const CartPage = lazy(() => import('../pages/cart/CartPage').then((m) => ({ default: m.CartPage })));
const CheckoutPage = lazy(() => import('../pages/checkout/CheckoutPage').then((m) => ({ default: m.CheckoutPage })));
const WishlistPage = lazy(() => import('../pages/wishlist/WishlistPage').then((m) => ({ default: m.WishlistPage })));
const OrdersPage = lazy(() => import('../pages/orders/OrdersPage').then((m) => ({ default: m.OrdersPage })));
const OrderDetailPage = lazy(() => import('../pages/orders/OrderDetailPage').then((m) => ({ default: m.OrderDetailPage })));
const NotificationsPage = lazy(() => import('../pages/notifications/NotificationsPage').then((m) => ({ default: m.NotificationsPage })));
const SellerDashboardPage = lazy(() => import('../pages/seller/SellerDashboardPage').then((m) => ({ default: m.SellerDashboardPage })));
const AdminDashboardPage = lazy(() => import('../pages/admin/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage })));

export const AppRoutes = () => {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
      </Route>

      <Route
        path="seller"
        element={
          <ProtectedRoute allowedRoles={['ROLE_SELLER', 'ROLE_ADMIN', 'SELLER', 'ADMIN']}>
            <SellerLayout />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={
            <Suspense fallback={<PageLoader type="table" />}>
              <SellerDashboardPage />
            </Suspense>
          }
        />
        <Route
          path="*"
          element={
            <Suspense fallback={<PageLoader type="table" />}>
              <SellerDashboardPage />
            </Suspense>
          }
        />
      </Route>

      <Route
        path="admin"
        element={
          <ProtectedRoute allowedRoles={['ROLE_ADMIN', 'ADMIN']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={
            <Suspense fallback={<PageLoader type="table" />}>
              <AdminDashboardPage />
            </Suspense>
          }
        />
        <Route
          path="*"
          element={
            <Suspense fallback={<PageLoader type="table" />}>
              <AdminDashboardPage />
            </Suspense>
          }
        />
      </Route>

      <Route path="/" element={<CustomerLayout />}>
        <Route index element={<HomePage />} />

        <Route
          path="products"
          element={
            <Suspense fallback={<PageLoader type="cards" />}>
              <CatalogPage />
            </Suspense>
          }
        />
        <Route
          path="products/:productId"
          element={
            <Suspense fallback={<PageLoader type="page" />}>
              <ProductDetailPage />
            </Suspense>
          }
        />

        <Route
          path="cart"
          element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader type="page" />}>
                <CartPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="checkout"
          element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader type="page" />}>
                <CheckoutPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="orders"
          element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader type="table" />}>
                <OrdersPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="orders/:orderId"
          element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader type="page" />}>
                <OrderDetailPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="wishlist"
          element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader type="cards" />}>
                <WishlistPage />
              </Suspense>
            </ProtectedRoute>
          }
        />

        <Route
          path="profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="notifications"
          element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader type="page" />}>
                <NotificationsPage />
              </Suspense>
            </ProtectedRoute>
          }
        />

        <Route path="unauthorized" element={<AccessDeniedPage />} />
        <Route path="forbidden" element={<AccessDeniedPage />} />
        <Route path="403" element={<AccessDeniedPage />} />
        <Route path="404" element={<NotFoundPage />} />

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
