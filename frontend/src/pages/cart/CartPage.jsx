import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { cartApi } from '../../api/cart';
import { productsApi } from '../../api/products';
import {
  Trash2,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Store,
  Package,
  AlertCircle,
  Plus,
  Minus,
  CheckCircle2,
  ArrowLeft,
  RotateCcw,
} from 'lucide-react';
import { BrandBadge, CategoryBadge } from '../../components/ui/Badges';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { Button } from '../../components/ui/Button';

export const CartPage = () => {
  const navigate = useNavigate();
  const outletContext = useOutletContext();

  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [clearingCart, setClearingCart] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [itemToRemove, setItemToRemove] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const syncCartCount = () => {
    window.dispatchEvent(new CustomEvent('cart:updated'));
    if (outletContext?.refreshCounts) {
      outletContext.refreshCounts();
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await cartApi.getCart();
      await hydrateCart(res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login', { state: { from: { pathname: '/cart' } } });
      } else {
        setError('Unable to load your shopping cart. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  const hydrateCart = async (rawCart) => {
    const rawItems = rawCart?.items || [];
    const hydratedItems = await Promise.all(
      rawItems.map(async (item) => {
        try {
          const product = (await productsApi.getProductById(item.productId)).data;
          return { ...item, product };
        } catch {
          return item;
        }
      })
    );
    setCart({ ...rawCart, items: hydratedItems });
  };

  const handleUpdateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    setUpdatingId(itemId);
    try {
      const res = await cartApi.updateItem(itemId, newQuantity);
      await hydrateCart(res.data);
      syncCartCount();
    } catch (err) {
      showToast(err.response?.data?.message || 'Unable to update item quantity.', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemoveItem = async (itemId) => {
    setUpdatingId(itemId);
    try {
      const res = await cartApi.removeItem(itemId);
      await hydrateCart(res.data);
      syncCartCount();
      showToast('Item removed from your cart.');
    } catch (err) {
      showToast(err.response?.data?.message || 'Unable to remove item from cart.', 'error');
    } finally {
      setUpdatingId(null);
      setItemToRemove(null);
    }
  };

  const executeClearCart = async () => {
    setClearingCart(true);
    try {
      await cartApi.clearCart();
      setCart({ items: [], totalAmount: 0, totalItems: 0 });
      setConfirmClearOpen(false);
      syncCartCount();
      showToast('Shopping cart cleared successfully.');
    } catch (err) {
      showToast(err.response?.data?.message || 'Unable to clear cart.', 'error');
    } finally {
      setClearingCart(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-5 animate-pulse pb-10">
        <div className="flex justify-between items-center pb-3 border-b border-slate-200">
          <div className="space-y-1.5">
            <div className="h-6 w-36 bg-slate-200 rounded-lg" />
            <div className="h-3.5 w-56 bg-slate-100 rounded" />
          </div>
          <div className="h-8 w-28 bg-slate-200 rounded-lg" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-8 space-y-3">
            {[1, 2].map((n) => (
              <div
                key={n}
                className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 shadow-2xs"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-200 rounded-xl shrink-0" />
                <div className="space-y-2 w-full">
                  <div className="h-4 bg-slate-200 rounded w-2/3" />
                  <div className="h-3 bg-slate-100 rounded w-1/3" />
                  <div className="h-3 bg-slate-100 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
          <div className="lg:col-span-4">
            <div className="h-64 bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs" />
          </div>
        </div>
      </div>
    );
  }

  if (error && !cart) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 text-rose-500 mx-auto flex items-center justify-center shadow-2xs">
          <AlertCircle className="w-6 h-6 stroke-[2]" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-black text-slate-900 tracking-tight">Cart Error</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">{error}</p>
        </div>
        <div className="flex items-center justify-center gap-2.5 pt-1">
          <Button variant="secondary" size="sm" onClick={fetchCart}>
            <RotateCcw className="w-3.5 h-3.5 mr-1" /> Try Again
          </Button>
          <Link to="/products">
            <Button variant="primary" size="sm">
              <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Browse Catalog
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const items = cart?.items || [];

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto text-center py-16 px-4 space-y-4">
        <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-2xs border border-indigo-100">
          <ShoppingBag className="w-7 h-7 stroke-[1.8]" />
        </div>
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Your Cart is Empty
          </h1>
          <p className="text-slate-500 text-xs max-w-xs mx-auto leading-relaxed">
            Your shopping cart currently has no items. Explore our product catalog to discover items with competitive merchant offers.
          </p>
        </div>
        <div className="pt-2">
          <Link to="/products">
            <Button variant="primary" size="md" className="px-5 py-2.5 shadow-xs">
              Explore Products <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const totalItemCount = cart?.totalItems ?? items.reduce((sum, i) => sum + (i.quantity || 1), 0);
  const totalAmount = Number(cart?.totalAmount || 0);

  return (
    <div className="space-y-4 sm:space-y-5 pb-12">
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed top-6 right-6 z-50 px-4 py-2.5 rounded-xl shadow-lg text-xs font-bold flex items-center gap-2 backdrop-blur-md animate-in fade-in slide-in-from-top-2 ${
            toast.type === 'error'
              ? 'bg-rose-600 text-white'
              : 'bg-slate-900 text-white'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-200 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{toast.msg}</span>
        </div>
      )}

      <div className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200/70 flex items-center justify-center text-indigo-600 shrink-0">
            <ShoppingBag className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-none">
                Shopping Cart
              </h1>
              <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80 px-2 py-0.5 rounded-full">
                {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Review your items before proceeding to checkout
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            to="/products"
            className="text-xs font-semibold text-slate-600 hover:text-indigo-600 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 border border-slate-200/80 transition flex items-center gap-1 shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Continue Shopping
          </Link>

          <button
            type="button"
            onClick={() => setConfirmClearOpen(true)}
            disabled={clearingCart || items.length === 0}
            className="px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition flex items-center gap-1 border border-slate-200/80 hover:border-rose-200 disabled:opacity-40 shadow-2xs"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear Cart
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-start">
        <div className="lg:col-span-8 space-y-3">
          {items.map((item) => {
            const isUpdating = updatingId === item.id;
            const lineSubtotal = item.subtotal ?? Number(item.unitPrice) * item.quantity;

            return (
              <div
                key={item.id}
                className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 hover:border-slate-300 transition-all shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 group"
              >
                <div className="flex items-start sm:items-center gap-3 w-full sm:w-auto min-w-0 flex-1">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-50/80 rounded-xl flex items-center justify-center text-slate-400 shrink-0 border border-slate-100 overflow-hidden p-1">
                    {item.product?.imageUrl ? (
                      <img
                        src={item.product.imageUrl}
                        alt={item.product?.name || item.productName || 'Product'}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          if (e.target.nextSibling) e.target.nextSibling.style.display = 'block';
                        }}
                      />
                    ) : null}
                    <Package
                      className={`w-7 h-7 text-slate-300 stroke-[1.5] ${
                        item.product?.imageUrl ? 'hidden' : 'block'
                      }`}
                    />
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <Link
                      to={`/products/${item.productId}`}
                      className="font-bold text-slate-900 text-xs sm:text-sm hover:text-indigo-600 transition line-clamp-2 leading-snug"
                    >
                      {item.product?.name || item.productName || `Product #${item.productId.substring(0, 8)}`}
                    </Link>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500 flex-wrap">
                      {item.product?.category?.name && (
                        <CategoryBadge name={item.product.category.name} size="xs" />
                      )}
                      {item.product?.brand?.name && (
                        <BrandBadge name={item.product.brand.name} size="xs" />
                      )}
                      <span className="inline-flex items-center gap-1 font-mono text-[10px] bg-slate-50 border border-slate-200/80 px-1.5 py-0.5 rounded text-slate-600">
                        <Store className="w-3 h-3 text-indigo-500" />
                        Seller #{item.sellerId ? item.sellerId.substring(0, 8) : 'Direct'}
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-slate-700">
                      ₹{Number(item.unitPrice).toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{' '}
                      <span className="text-[10px] font-normal text-slate-400">each</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between w-full sm:w-auto gap-4 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
                  <div className="flex items-center border border-slate-200/90 rounded-lg overflow-hidden bg-slate-50/80 shadow-2xs">
                    <button
                      type="button"
                      disabled={item.quantity <= 1 || isUpdating}
                      onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                      className="px-2 py-1 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition text-slate-700 font-bold text-xs"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="px-2.5 py-1 text-xs font-bold text-slate-900 min-w-7 text-center">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                      className="px-2 py-1 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition text-slate-700 font-bold text-xs"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="text-right min-w-[90px]">
                    <span className="text-sm sm:text-base font-black text-slate-900 block tracking-tight">
                      ₹{Number(lineSubtotal).toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => setItemToRemove(item)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Remove item from cart"
                    aria-label={`Remove ${item.product?.name || 'item'} from cart`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="lg:col-span-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-2xs lg:sticky lg:top-20">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-100 flex items-center justify-between">
              <span>Price Details</span>
              <span className="font-semibold text-slate-500">
                {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}
              </span>
            </h2>

            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="flex justify-between items-center">
                <span>Items Subtotal</span>
                <span className="font-bold text-slate-900">
                  ₹{totalAmount.toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>

              <div className="flex justify-between items-center text-slate-500">
                <span>Shipping & Taxes</span>
                <span className="font-medium text-[11px]">Calculated at checkout</span>
              </div>

              <div className="border-t border-slate-100 pt-3 flex justify-between items-baseline">
                <span className="text-sm font-bold text-slate-900">Total Payable</span>
                <span className="text-indigo-600 text-xl font-black tracking-tight">
                  ₹{totalAmount.toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>

            <Button
              variant="primary"
              size="md"
              fullWidth
              onClick={() => navigate('/checkout')}
              className="py-3 rounded-xl shadow-xs"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-1 border-t border-slate-100">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Idempotent & Encrypted Checkout</span>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmClearOpen}
        onClose={() => setConfirmClearOpen(false)}
        onConfirm={executeClearCart}
        title="Clear Entire Cart?"
        message="Are you sure you want to remove all items from your shopping cart? This action cannot be undone."
        confirmText="Yes, Clear Cart"
        cancelText="Keep Items"
        variant="danger"
        isLoading={clearingCart}
      />

      <ConfirmModal
        isOpen={!!itemToRemove}
        onClose={() => setItemToRemove(null)}
        onConfirm={() => itemToRemove && handleRemoveItem(itemToRemove.id)}
        title="Remove Item from Cart?"
        message={`Are you sure you want to remove "${
          itemToRemove?.product?.name || itemToRemove?.productName || 'this item'
        }" from your shopping cart?`}
        confirmText="Remove Item"
        cancelText="Keep in Cart"
        variant="danger"
        isLoading={updatingId === itemToRemove?.id}
      />
    </div>
  );
};

export default CartPage;
