import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { wishlistApi } from '../../api/wishlist';
import { cartApi } from '../../api/cart';
import { productsApi } from '../../api/products';
import {
  Heart,
  Trash2,
  ShoppingCart,
  ArrowRight,
  AlertCircle,
  Package,
  CheckCircle2,
  ArrowLeft,
  RotateCcw,
} from 'lucide-react';
import { BrandBadge, CategoryBadge, ConditionBadge } from '../../components/ui/Badges';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { Button } from '../../components/ui/Button';

export const WishlistPage = () => {
  const navigate = useNavigate();
  const outletContext = useOutletContext();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [movingIds, setMovingIds] = useState(new Set());
  const [removingIds, setRemovingIds] = useState(new Set());
  const [itemToRemove, setItemToRemove] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const syncWishlistAndCart = () => {
    window.dispatchEvent(new CustomEvent('wishlist:updated'));
    window.dispatchEvent(new CustomEvent('cart:updated'));
    if (outletContext?.refreshCounts) {
      outletContext.refreshCounts();
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await wishlistApi.getWishlist();
      const rawData = res.data?.data || res.data || {};
      const wishlistItems = rawData.items || rawData || [];
      const rawItems = Array.isArray(wishlistItems) ? wishlistItems : [];

      const hydratedItems = await Promise.all(
        rawItems.map(async (item) => {
          const productId = item.productId || item.id;
          try {
            const [prodRes, listRes] = await Promise.all([
              productsApi.getProductById(productId).catch(() => null),
              productsApi.getListingsByProductId(productId).catch(() => ({ data: [] })),
            ]);

            const product = prodRes?.data || null;
            const listings = Array.isArray(listRes?.data)
              ? listRes.data
              : listRes?.data?.content || [];

            const activeList = listings
              .filter((l) => l.status === 'ACTIVE' && Number(l.stockQuantity) > 0)
              .sort((a, b) => Number(a.sellingPrice) - Number(b.sellingPrice));

            const minPrice = activeList.length > 0 ? Number(activeList[0].sellingPrice) : null;
            const topListing = activeList.length > 0 ? activeList[0] : null;

            return {
              ...item,
              productId,
              product,
              minPrice,
              topListing,
              hasStock: activeList.length > 0,
              offerCount: activeList.length,
            };
          } catch {
            return { ...item, productId };
          }
        })
      );
      setItems(hydratedItems);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login', { state: { from: { pathname: '/wishlist' } } });
      } else {
        setError('Unable to load your saved wishlist items.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (productId) => {
    setRemovingIds((prev) => new Set(prev).add(productId));
    try {
      await wishlistApi.removeItem(productId);
      setItems((prev) => prev.filter((i) => i.productId !== productId));
      syncWishlistAndCart();
      showToast('Item removed from your wishlist.');
    } catch {
      showToast('Failed to remove item from wishlist.', 'error');
    } finally {
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
      setItemToRemove(null);
    }
  };

  const handleMoveToCart = async (item) => {
    const productId = item.productId;
    setMovingIds((prev) => new Set(prev).add(productId));

    try {
      let targetListing = item.topListing;
      if (!targetListing) {
        const listingRes = await productsApi.getListingsByProductId(productId);
        const listings = Array.isArray(listingRes.data)
          ? listingRes.data
          : listingRes.data?.content || [];
        const available = listings
          .filter((l) => l.status === 'ACTIVE' && Number(l.stockQuantity) > 0)
          .sort((a, b) => Number(a.sellingPrice) - Number(b.sellingPrice));

        if (available.length === 0) {
          showToast('No active seller offers available in stock for this product.', 'error');
          return;
        }
        targetListing = available[0];
      }

      await cartApi.addItem(productId, targetListing.id, 1);
      await wishlistApi.removeItem(productId);
      setItems((prev) => prev.filter((i) => i.productId !== productId));
      syncWishlistAndCart();
      showToast('Item moved to your shopping cart!');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to transfer item to cart.', 'error');
    } finally {
      setMovingIds((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse pb-10">
        <div className="flex justify-between items-center pb-3 border-b border-slate-200">
          <div className="space-y-1.5">
            <div className="h-6 w-36 bg-slate-200 rounded-lg" />
            <div className="h-3.5 w-56 bg-slate-100 rounded" />
          </div>
          <div className="h-8 w-28 bg-slate-200 rounded-lg" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {[1, 2, 3, 4, 5].map((n) => (
            <div
              key={n}
              className="bg-white border border-slate-200/90 rounded-2xl p-3 space-y-2.5 shadow-2xs"
            >
              <div className="aspect-square bg-slate-100 rounded-xl" />
              <div className="h-3 bg-slate-100 rounded w-1/3" />
              <div className="h-3.5 bg-slate-100 rounded w-3/4" />
              <div className="h-6 bg-slate-100 rounded-lg w-full pt-1" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error && items.length === 0) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 text-rose-500 mx-auto flex items-center justify-center shadow-2xs">
          <AlertCircle className="w-6 h-6 stroke-[2]" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-black text-slate-900 tracking-tight">Wishlist Error</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">{error}</p>
        </div>
        <div className="flex items-center justify-center gap-2.5 pt-1">
          <Button variant="secondary" size="sm" onClick={fetchWishlist}>
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
          <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200/70 flex items-center justify-center text-rose-500 shrink-0">
            <Heart className="w-4 h-4 fill-rose-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-none">
                My Wishlist
              </h1>
              <span className="text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200/80 px-2 py-0.5 rounded-full">
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Saved products to track pricing and quickly transfer to your cart
            </p>
          </div>
        </div>

        <Link to="/products" className="self-start sm:self-auto">
          <Button variant="secondary" size="sm" className="shadow-2xs">
            Browse Catalog <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-8 sm:p-12 text-center space-y-3 shadow-2xs max-w-md mx-auto my-6">
          <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center mx-auto border border-rose-100 shadow-2xs">
            <Heart className="w-6 h-6 stroke-[1.8]" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-black text-slate-900">Your Wishlist is Empty</h2>
            <p className="text-slate-500 text-xs leading-relaxed max-w-xs mx-auto">
              Save canonical products while exploring to compare live merchant offers and purchase when ready.
            </p>
          </div>
          <div className="pt-1">
            <Link to="/products">
              <Button variant="primary" size="md" className="px-5 py-2.5 shadow-xs">
                Explore Catalog <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {items.map((item) => {
            const prod = item.product || {};
            const productId = item.productId;
            const isMoving = movingIds.has(productId);
            const isRemoving = removingIds.has(productId);

            return (
              <div
                key={item.id || productId}
                className="bg-white border border-slate-200/90 rounded-2xl p-3 hover:border-indigo-300 hover:shadow-card-hover transition-all flex flex-col justify-between group relative shadow-2xs"
              >
                <Link
                  to={`/products/${productId}`}
                  className="block flex-1 cursor-pointer focus:outline-none"
                >
                  <div className="relative aspect-square bg-slate-50/80 rounded-xl border border-slate-100 p-2.5 mb-2 flex items-center justify-center overflow-hidden">
                    {prod.imageUrl ? (
                      <img
                        src={prod.imageUrl}
                        alt={prod.name || 'Product'}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          if (e.target.nextSibling) e.target.nextSibling.style.display = 'block';
                        }}
                      />
                    ) : null}
                    <Package
                      className={`w-10 h-10 text-slate-300 stroke-[1.5] group-hover:scale-105 transition-transform ${
                        prod.imageUrl ? 'hidden' : 'block'
                      }`}
                    />

                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setItemToRemove(item);
                      }}
                      disabled={isRemoving || isMoving}
                      aria-label="Remove from wishlist"
                      title="Remove from wishlist"
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 text-slate-400 hover:text-rose-600 hover:bg-white border border-slate-200/80 shadow-2xs transition-all disabled:opacity-40 z-10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    {!item.hasStock && (
                      <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-[9px] font-bold shadow-2xs">
                        Out of stock
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 flex-wrap mb-1.5">
                    {prod.category?.name && (
                      <CategoryBadge name={prod.category.name} size="xs" />
                    )}
                    {prod.brand?.name && (
                      <BrandBadge name={prod.brand.name} size="xs" />
                    )}
                  </div>

                  <h3 className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-indigo-600 transition line-clamp-2 leading-snug min-h-[2rem] sm:min-h-[2.5rem]">
                    {prod.name || `Product #${productId.substring(0, 8)}`}
                  </h3>
                </Link>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-1.5">
                  <div className="min-w-0">
                    {item.minPrice ? (
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold leading-tight">
                          {item.topListing?.condition || 'Available From'}
                        </span>
                        <span className="text-xs sm:text-sm font-black text-slate-900 leading-tight truncate block">
                          ₹{item.minPrice.toLocaleString('en-IN')}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11px] font-semibold text-slate-400 block leading-tight">
                        Offers pending
                      </span>
                    )}
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleMoveToCart(item)}
                    isLoading={isMoving}
                    disabled={!item.hasStock || isMoving || isRemoving}
                    className="rounded-lg shadow-2xs text-xs px-2.5 py-1.5"
                    title={!item.hasStock ? 'Product is currently out of stock' : 'Move item to shopping cart'}
                  >
                    <ShoppingCart className="w-3 h-3 mr-1" />
                    <span>{isMoving ? 'Moving...' : !item.hasStock ? 'Out of Stock' : 'Move to Cart'}</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmModal
        isOpen={!!itemToRemove}
        onClose={() => setItemToRemove(null)}
        onConfirm={() => itemToRemove && handleRemove(itemToRemove.productId)}
        title="Remove Saved Item?"
        message={`Are you sure you want to remove "${
          itemToRemove?.product?.name || 'this product'
        }" from your wishlist?`}
        confirmText="Remove Item"
        cancelText="Keep Saved"
        variant="danger"
        isLoading={removingIds.has(itemToRemove?.productId)}
      />
    </div>
  );
};

export default WishlistPage;
