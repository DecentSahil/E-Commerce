import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link, useOutletContext } from 'react-router-dom';
import { productsApi } from '../../api/products';
import { cartApi } from '../../api/cart';
import { wishlistApi } from '../../api/wishlist';
import { useAuth } from '../../context/AuthContext';
import {
  CategoryBadge,
  BrandBadge,
  StatusBadge,
  ConditionBadge,
  SpecificationChips,
} from '../../components/ui/Badges';
import {
  ShoppingCart,
  Heart,
  Check,
  AlertCircle,
  ShieldCheck,
  Truck,
  ArrowLeft,
  Store,
  Tag,
  CheckCircle2,
  Package,
  Sparkles,
  Clock,
  ChevronRight,
  ChevronLeft,
  SlidersHorizontal,
  Zap,
  RotateCcw,
  Boxes,
  HelpCircle,
} from 'lucide-react';

export const ProductDetailPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const outletContext = useOutletContext();

  const [product, setProduct] = useState(null);
  const [listings, setListings] = useState([]);
  const [selectedListing, setSelectedListing] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageError, setImageError] = useState(false);

  const [cartSuccess, setCartSuccess] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const [buyNowLoading, setBuyNowLoading] = useState(false);

  const [wishlistedIds, setWishlistedIds] = useState(new Set());
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const [toast, setToast] = useState(null);

  const [similarProducts, setSimilarProducts] = useState([]);
  const [similarLoading, setSimilarLoading] = useState(true);
  const [similarPricing, setSimilarPricing] = useState({});
  const carouselRef = useRef(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchWishlist = async () => {
    if (!isAuthenticated) {
      setWishlistedIds(new Set());
      return;
    }
    try {
      const res = await wishlistApi.getWishlist();
      const rawWish = res.data?.data || res.data;
      const items = rawWish?.items || (Array.isArray(rawWish) ? rawWish : []);
      setWishlistedIds(new Set(items.map((i) => i.productId)));
    } catch {}
  };

  useEffect(() => {
    fetchWishlist();
  }, [isAuthenticated]);

  useEffect(() => {
    let isCancelled = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const loadData = async () => {
      setLoading(true);
      setError(null);
      setImageError(false);
      setSimilarLoading(true);
      setSimilarProducts([]);
      setSimilarPricing({});

      try {
        const [prodRes, listingsRes] = await Promise.all([
          productsApi.getProductById(productId),
          productsApi.getListingsByProductId(productId).catch(() => ({ data: [] })),
        ]);

        if (isCancelled) return;

        const prod = prodRes.data;
        setProduct(prod);

        const rawList = Array.isArray(listingsRes.data)
          ? listingsRes.data
          : listingsRes.data?.content || [];
        setListings(rawList);

        const inStockActive = rawList
          .filter((l) => l.status === 'ACTIVE' && l.stockQuantity > 0)
          .sort((a, b) => Number(a.sellingPrice) - Number(b.sellingPrice));

        setSelectedListing(inStockActive[0] || rawList[0] || null);
        setQuantity(1);
        setLoading(false);

        fetchSimilar(prod, isCancelled);
      } catch (err) {
        if (!isCancelled) {
          setError(
            err.response?.data?.message ||
              'Unable to load product specifications and seller offers. Please try again.'
          );
          setLoading(false);
          setSimilarLoading(false);
        }
      }
    };

    const fetchSimilar = async (currentProd, cancelled) => {
      try {
        const catName = currentProd.category?.name;
        const brandName = currentProd.brand?.name;

        if (!catName && !brandName) {
          if (!cancelled) setSimilarLoading(false);
          return;
        }

        const promises = [];
        if (catName) {
          promises.push(
            productsApi
              .getProducts({ category: catName, status: 'ACTIVE', size: 20 })
              .then((res) => ({
                type: 'category',
                items: res.data?.content || (Array.isArray(res.data) ? res.data : []),
              }))
              .catch(() => ({ type: 'category', items: [] }))
          );
        }
        if (brandName) {
          promises.push(
            productsApi
              .getProducts({ brand: brandName, status: 'ACTIVE', size: 20 })
              .then((res) => ({
                type: 'brand',
                items: res.data?.content || (Array.isArray(res.data) ? res.data : []),
              }))
              .catch(() => ({ type: 'brand', items: [] }))
          );
        }

        const results = await Promise.all(promises);
        if (cancelled) return;

        let catItems = [];
        let brandItems = [];

        for (const r of results) {
          if (r.type === 'category') catItems = r.items;
          if (r.type === 'brand') brandItems = r.items;
        }

        catItems = catItems.filter((p) => p.id !== currentProd.id);
        brandItems = brandItems.filter((p) => p.id !== currentProd.id);

        const normCat = catName?.trim().toLowerCase();
        const normBrand = brandName?.trim().toLowerCase();

        const bothMatch = [];
        const catMatch = [];
        const brandMatch = [];
        const seenIds = new Set();

        const isBothMatch = (p) => {
          const pCat = p.category?.name?.trim().toLowerCase();
          const pBrand = p.brand?.name?.trim().toLowerCase();
          return normCat && normBrand && pCat === normCat && pBrand === normBrand;
        };

        for (const p of catItems) {
          if (seenIds.has(p.id)) continue;
          if (isBothMatch(p)) {
            seenIds.add(p.id);
            bothMatch.push({ ...p, matchType: 'both', matchLabel: 'Same Category & Brand' });
          } else {
            seenIds.add(p.id);
            catMatch.push({ ...p, matchType: 'category', matchLabel: `In ${catName}` });
          }
        }

        for (const p of brandItems) {
          if (seenIds.has(p.id)) continue;
          if (isBothMatch(p)) {
            seenIds.add(p.id);
            bothMatch.push({ ...p, matchType: 'both', matchLabel: 'Same Category & Brand' });
          } else {
            seenIds.add(p.id);
            brandMatch.push({ ...p, matchType: 'brand', matchLabel: `From ${brandName}` });
          }
        }

        const mixed = [...bothMatch, ...catMatch, ...brandMatch].slice(0, 12);

        if (!cancelled) {
          setSimilarProducts(mixed);
          setSimilarLoading(false);
        }

        if (mixed.length > 0) {
          mixed.forEach(async (p) => {
            try {
              const listRes = await productsApi.getListingsByProductId(p.id);
              const list = Array.isArray(listRes.data) ? listRes.data : listRes.data?.content || [];
              const activeList = list.filter((l) => l.status === 'ACTIVE' && l.stockQuantity > 0);
              if (activeList.length > 0) {
                const prices = activeList
                  .map((l) => Number(l.sellingPrice))
                  .filter((pr) => !isNaN(pr));
                if (prices.length > 0) {
                  const minPrice = Math.min(...prices);
                  if (!cancelled) {
                    setSimilarPricing((prev) => ({
                      ...prev,
                      [p.id]: { minPrice, offerCount: activeList.length },
                    }));
                  }
                }
              }
            } catch {}
          });
        }
      } catch {
        if (!cancelled) {
          setSimilarLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isCancelled = true;
    };
  }, [productId]);

  const lowestActiveListingId = useMemo(() => {
    const inStock = listings
      .filter((l) => l.status === 'ACTIVE' && l.stockQuantity > 0)
      .sort((a, b) => Number(a.sellingPrice) - Number(b.sellingPrice));
    return inStock[0]?.id || null;
  }, [listings]);

  const activeListingsCount = useMemo(() => {
    return listings.filter((l) => l.status === 'ACTIVE' && Number(l.stockQuantity) > 0).length;
  }, [listings]);

  const handleSelectListing = (listing) => {
    setSelectedListing(listing);
    setQuantity(1);
  };

  const handleToggleWishlist = async (targetProductId, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/products/${productId}` } } });
      return;
    }

    setWishlistLoading(true);
    const isCurrentlyWishlisted = wishlistedIds.has(targetProductId);
    try {
      if (isCurrentlyWishlisted) {
        await wishlistApi.removeItem(targetProductId);
        setWishlistedIds((prev) => {
          const next = new Set(prev);
          next.delete(targetProductId);
          return next;
        });
        showToast('Removed from your saved wishlist', 'success');
      } else {
        await wishlistApi.addItem(targetProductId);
        setWishlistedIds((prev) => {
          const next = new Set(prev);
          next.add(targetProductId);
          return next;
        });
        showToast('Saved to your wishlist', 'success');
      }

      window.dispatchEvent(new CustomEvent('wishlist:updated'));
      if (outletContext?.refreshCounts) {
        outletContext.refreshCounts();
      }
    } catch {
      showToast('Unable to update wishlist at this time', 'error');
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/products/${productId}` } } });
      return;
    }
    if (!selectedListing || selectedListing.stockQuantity <= 0) return;

    setCartLoading(true);
    setCartSuccess(false);
    try {
      await cartApi.addItem(productId, selectedListing.id, quantity);
      setCartSuccess(true);
      showToast('Item successfully added to your shopping cart!', 'success');

      window.dispatchEvent(new CustomEvent('cart:updated'));
      if (outletContext?.refreshCounts) {
        outletContext.refreshCounts();
      }

      setTimeout(() => setCartSuccess(false), 4500);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to add item to cart. Please try again.';
      showToast(msg, 'error');
    } finally {
      setCartLoading(false);
    }
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/products/${productId}` } } });
      return;
    }
    if (!selectedListing || selectedListing.stockQuantity <= 0) return;

    setBuyNowLoading(true);
    try {
      await cartApi.addItem(productId, selectedListing.id, quantity);
      window.dispatchEvent(new CustomEvent('cart:updated'));
      if (outletContext?.refreshCounts) {
        outletContext.refreshCounts();
      }
      navigate('/cart');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to process purchase. Please try again.';
      showToast(msg, 'error');
    } finally {
      setBuyNowLoading(false);
    }
  };

  const scrollCarousel = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 animate-pulse">
        <div className="flex items-center gap-2">
          <div className="h-4 w-16 bg-slate-200 rounded" />
          <div className="h-4 w-4 bg-slate-200 rounded" />
          <div className="h-4 w-24 bg-slate-200 rounded" />
          <div className="h-4 w-4 bg-slate-200 rounded" />
          <div className="h-4 w-40 bg-slate-200 rounded" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 space-y-4">
            <div className="w-full aspect-square bg-slate-200 rounded-2xl" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-12 bg-slate-200 rounded-xl" />
              <div className="h-12 bg-slate-200 rounded-xl" />
            </div>
          </div>
          <div className="lg:col-span-7 space-y-5">
            <div className="flex gap-2">
              <div className="h-6 w-24 bg-slate-200 rounded-lg" />
              <div className="h-6 w-20 bg-slate-200 rounded-lg" />
            </div>
            <div className="h-8 w-3/4 bg-slate-200 rounded-xl" />
            <div className="h-24 w-full bg-slate-100 rounded-2xl" />
            <div className="h-48 w-full bg-slate-200 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-xl mx-auto py-24 px-4 text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-500 mx-auto flex items-center justify-center shadow-sm">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {error || 'Product Not Found'}
          </h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            The canonical product you requested might have been discontinued, unpublished, or the link may be outdated.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition shadow-2xs"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" /> Retry Loading
          </button>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition shadow-sm shadow-indigo-200"
          >
            <ArrowLeft className="w-4 h-4" /> Browse Catalog
          </Link>
        </div>
      </div>
    );
  }

  const isCurrentWishlisted = wishlistedIds.has(productId);

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-14">
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed top-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-xl text-xs sm:text-sm font-bold flex items-center gap-2.5 backdrop-blur-md transition-all animate-in fade-in slide-in-from-top-3 ${
            toast.type === 'error'
              ? 'bg-rose-600/95 text-white shadow-rose-200'
              : 'bg-slate-900/95 text-white shadow-slate-300'
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

      <nav aria-label="Breadcrumb" className="flex items-center flex-wrap gap-2 text-xs text-slate-500 font-medium">
        <Link to="/" className="hover:text-indigo-600 transition flex items-center gap-1">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <Link to="/products" className="hover:text-indigo-600 transition">
          Catalog
        </Link>
        {product.category?.name && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <Link
              to={`/products?category=${encodeURIComponent(product.category.name)}`}
              className="hover:text-indigo-600 transition font-medium"
            >
              {product.category.name}
            </Link>
          </>
        )}
        {product.brand?.name && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <Link
              to={`/products?brand=${encodeURIComponent(product.brand.name)}`}
              className="hover:text-indigo-600 transition font-medium"
            >
              {product.brand.name}
            </Link>
          </>
        )}
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span className="text-slate-900 font-bold truncate max-w-[200px] sm:max-w-xs md:max-w-sm">
          {product.name}
        </span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
          <div className="w-full aspect-square bg-white rounded-2xl border border-slate-200/90 flex items-center justify-center p-6 relative overflow-hidden shadow-xs group">
            {product.imageUrl && !imageError ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-contain drop-shadow-sm transition-transform duration-500 group-hover:scale-105 select-none"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-400 space-y-2 p-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                  <Package className="w-8 h-8 text-slate-400 stroke-1" />
                </div>
                <span className="text-xs font-semibold text-slate-400">
                  {imageError ? 'Product Image Unavailable' : 'No Official Image Uploaded'}
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={(e) => handleToggleWishlist(productId, e)}
              disabled={wishlistLoading}
              aria-label={isCurrentWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
              title={isCurrentWishlisted ? 'Saved to Wishlist' : 'Save to Wishlist'}
              className={`absolute top-3.5 right-3.5 p-2.5 rounded-2xl transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 ${
                isCurrentWishlisted
                  ? 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100'
                  : 'bg-white/95 backdrop-blur-sm text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200'
              }`}
            >
              <Heart
                className={`w-5 h-5 transition-transform active:scale-90 ${
                  isCurrentWishlisted ? 'fill-rose-500 text-rose-500' : ''
                } ${wishlistLoading ? 'animate-pulse' : ''}`}
              />
            </button>

            {product.status && (
              <div className="absolute bottom-3.5 left-3.5">
                <StatusBadge status={product.status} size="xs" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={cartLoading || !selectedListing || selectedListing.stockQuantity <= 0}
              className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white rounded-xl text-xs sm:text-sm font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm shadow-indigo-100 transition-all active:scale-[0.98]"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>{cartLoading ? 'Adding...' : 'Add to Cart'}</span>
            </button>

            <button
              type="button"
              onClick={handleBuyNow}
              disabled={buyNowLoading || !selectedListing || selectedListing.stockQuantity <= 0}
              className="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:hover:bg-amber-500 text-white rounded-xl text-xs sm:text-sm font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm shadow-amber-100 transition-all active:scale-[0.98]"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>{buyNowLoading ? 'Processing...' : 'Buy Now'}</span>
            </button>
          </div>

          {cartSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Added to shopping cart!</span>
              </div>
              <Link to="/cart" className="underline font-extrabold text-indigo-700 hover:text-indigo-900">
                View Cart →
              </Link>
            </div>
          )}

          {activeListingsCount > 1 && (
            <div className="flex items-center gap-2.5 p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs text-indigo-900 shadow-2xs">
              <Store className="w-4 h-4 text-indigo-600 shrink-0" />
              <div className="min-w-0">
                <span className="font-bold block leading-tight">Multi-Seller Product</span>
                <span className="text-[11px] text-indigo-700 block mt-0.5">
                  {activeListingsCount} independent merchant offers available for this item.
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-7 space-y-5">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              {product.category?.name && (
                <Link
                  to={`/products?category=${encodeURIComponent(product.category.name)}`}
                  className="transition hover:opacity-90"
                >
                  <CategoryBadge name={product.category.name} size="xs" />
                </Link>
              )}
              {product.brand?.name && (
                <Link
                  to={`/products?brand=${encodeURIComponent(product.brand.name)}`}
                  className="transition hover:opacity-90"
                >
                  <BrandBadge name={product.brand.name} size="xs" />
                </Link>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
              {product.name}
            </h1>

            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                {Array.from(product.tags).map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-semibold flex items-center gap-1 border border-slate-200"
                  >
                    <Tag className="w-3 h-3 text-slate-400" /> {t}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-extrabold text-indigo-700 tracking-wider uppercase bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                    Selected Offer
                  </span>
                  {selectedListing?.id === lowestActiveListingId && (
                    <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                      <Zap className="w-3 h-3 fill-emerald-500 text-emerald-500" /> Lowest Price
                    </span>
                  )}
                </div>

                {selectedListing ? (
                  <div className="flex items-baseline gap-2.5">
                    <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                      ₹{Number(selectedListing.sellingPrice).toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      (incl. of all taxes)
                    </span>
                  </div>
                ) : (
                  <span className="text-lg font-bold text-slate-400">Currently Unavailable</span>
                )}
              </div>

              {selectedListing && (
                <div className="flex flex-col sm:items-end gap-1">
                  <ConditionBadge condition={selectedListing.condition} size="xs" />
                  <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                    <Store className="w-3.5 h-3.5 text-indigo-500" />
                    Seller #{selectedListing.sellerId.substring(0, 8)}
                  </span>
                </div>
              )}
            </div>

            {selectedListing ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="font-bold text-slate-700">Availability:</span>
                  {selectedListing.stockQuantity > 0 ? (
                    <span className="text-emerald-700 font-extrabold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      In Stock ({selectedListing.stockQuantity} units available)
                    </span>
                  ) : (
                    <span className="text-rose-700 font-extrabold bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                      Out of Stock
                    </span>
                  )}
                </div>

                {selectedListing.stockQuantity > 0 && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div>
                      <label htmlFor="pdp-quantity" className="block text-xs font-extrabold text-slate-800">
                        Quantity
                      </label>
                      <span className="text-[11px] text-slate-500">
                        Max {selectedListing.stockQuantity} units
                      </span>
                    </div>

                    <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        disabled={quantity <= 1 || cartLoading || buyNowLoading}
                        aria-label="Decrease quantity"
                        className="px-3 py-1.5 text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition font-extrabold select-none text-xs sm:text-sm"
                      >
                        −
                      </button>
                      <input
                        id="pdp-quantity"
                        type="number"
                        min="1"
                        max={selectedListing.stockQuantity}
                        value={quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val)) {
                            setQuantity(Math.min(selectedListing.stockQuantity, Math.max(1, val)));
                          }
                        }}
                        className="w-12 text-center text-xs sm:text-sm font-bold bg-transparent outline-none py-1.5 text-slate-900 border-x border-slate-200"
                      />
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.min(selectedListing.stockQuantity, q + 1))}
                        disabled={quantity >= selectedListing.stockQuantity || cartLoading || buyNowLoading}
                        aria-label="Increase quantity"
                        className="px-3 py-1.5 text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition font-extrabold select-none text-xs sm:text-sm"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}

                {listings.length > 1 && (
                  <div className="pt-2">
                    <a
                      href="#seller-offers"
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      <span>Compare {listings.length} seller offers for this product</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-6 px-4 text-center text-xs text-slate-500 space-y-2 bg-slate-50 rounded-xl border border-slate-200">
                <Boxes className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="font-bold text-slate-800 text-sm">No Active Seller Offers</p>
                <p className="text-slate-500 max-w-sm mx-auto">
                  There are currently no active merchant listings available for this catalog product.
                </p>
                {(user?.role === 'ROLE_SELLER' || user?.role === 'SELLER') && (
                  <Link
                    to="/seller"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg transition shadow-xs text-xs mt-1"
                  >
                    <Store className="w-3.5 h-3.5" /> Create Listing in Seller Hub
                  </Link>
                )}
              </div>
            )}
          </div>

          {product.specifications && product.specifications.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Product Highlights
              </span>
              <SpecificationChips
                specifications={product.specifications}
                initialLimit={4}
                allowExpand={false}
              />
            </div>
          )}

          <div className="space-y-1.5 pt-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              About this item
            </span>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {product.description || 'Canonical product catalog item.'}
            </p>
          </div>

          {product.specifications && product.specifications.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                  Technical Specifications
                </h3>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                <dl className="divide-y divide-slate-100 text-xs sm:text-sm">
                  {product.specifications.map((spec, i) => (
                    <div
                      key={spec.id || i}
                      className="px-4 py-2.5 grid grid-cols-1 sm:grid-cols-3 gap-1.5 hover:bg-slate-50/70 transition-colors"
                    >
                      <dt className="font-bold text-slate-500 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                        {spec.key}
                      </dt>
                      <dd className="sm:col-span-2 text-slate-900 font-semibold">{spec.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          )}
        </div>
      </div>

      <section id="seller-offers" className="space-y-4 pt-6 border-t border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-indigo-600" />
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                Compare All Seller Offers ({listings.length})
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Select your preferred independent seller offer based on pricing, item condition, and immediate availability.
            </p>
          </div>

          {listings.length > 0 && (
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 self-start sm:self-auto">
              {listings.filter((l) => l.status === 'ACTIVE' && l.stockQuantity > 0).length} in-stock offer(s)
            </span>
          )}
        </div>

        {listings.length === 0 ? (
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center text-xs text-slate-500 space-y-1.5">
            <Package className="w-6 h-6 text-slate-400 mx-auto" />
            <p className="font-semibold text-slate-700">No seller offers registered</p>
            <p>Approved sellers can submit competitive offers for this canonical product at any time.</p>
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Seller ID</th>
                    <th className="py-3 px-4">Condition</th>
                    <th className="py-3 px-4">Available Stock</th>
                    <th className="py-3 px-4">Unit Price (INR)</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Selection</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {listings.map((l) => {
                    const isSelected = selectedListing?.id === l.id;
                    const isLowest = l.id === lowestActiveListingId;
                    const isAvailable = l.status === 'ACTIVE' && l.stockQuantity > 0;

                    return (
                      <tr
                        key={l.id}
                        onClick={() => isAvailable && handleSelectListing(l)}
                        className={`transition-colors ${
                          isSelected
                            ? 'bg-indigo-50/70 font-semibold'
                            : isAvailable
                            ? 'hover:bg-slate-50/80 cursor-pointer'
                            : 'opacity-50 bg-slate-50/40 cursor-not-allowed'
                        }`}
                      >
                        <td className="py-3.5 px-4 text-slate-900">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px]">
                              <Store className="w-3 h-3" />
                            </div>
                            <div>
                              <span className="font-bold text-slate-900">
                                Seller #{l.sellerId.substring(0, 8)}
                              </span>
                              {isLowest && (
                                <span className="ml-2 inline-flex items-center text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                  Lowest Price
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <ConditionBadge condition={l.condition} size="xs" />
                        </td>

                        <td className="py-3.5 px-4">
                          {l.stockQuantity > 0 ? (
                            <span className="inline-flex items-center gap-1.5 text-emerald-700 font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              {l.stockQuantity} in stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-rose-600 font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              Out of stock
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 font-black text-slate-900 text-sm">
                          ₹{Number(l.sellingPrice).toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>

                        <td className="py-3.5 px-4">
                          <StatusBadge status={l.status} size="xs" />
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          {isSelected ? (
                            <span className="inline-flex items-center gap-1 text-xs font-extrabold text-indigo-700 px-3 py-1 bg-white rounded-lg border border-indigo-200 shadow-2xs">
                              <Check className="w-3.5 h-3.5 text-indigo-600 stroke-[3]" /> Active Offer
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectListing(l);
                              }}
                              disabled={!isAvailable}
                              className="px-3 py-1 bg-slate-100 hover:bg-indigo-600 hover:text-white disabled:opacity-40 text-slate-700 rounded-lg text-xs font-bold transition shadow-2xs"
                            >
                              Select Offer
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 gap-2.5 md:hidden">
              {listings.map((l) => {
                const isSelected = selectedListing?.id === l.id;
                const isLowest = l.id === lowestActiveListingId;
                const isAvailable = l.status === 'ACTIVE' && l.stockQuantity > 0;

                return (
                  <div
                    key={l.id}
                    onClick={() => isAvailable && handleSelectListing(l)}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/40 shadow-xs'
                        : isAvailable
                        ? 'border-slate-200 bg-white hover:border-slate-300'
                        : 'border-slate-200 bg-slate-50/60 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <Store className="w-3.5 h-3.5 text-indigo-600" />
                        <span className="font-bold text-slate-900 text-xs">
                          Seller #{l.sellerId.substring(0, 8)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {isLowest && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200">
                            Lowest
                          </span>
                        )}
                        <ConditionBadge condition={l.condition} size="xs" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-2.5">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Price
                        </span>
                        <span className="text-lg font-black text-slate-900">
                          ₹{Number(l.sellingPrice).toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Stock
                        </span>
                        {l.stockQuantity > 0 ? (
                          <span className="text-xs font-bold text-emerald-700">
                            {l.stockQuantity} available
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-rose-600">Out of stock</span>
                        )}
                      </div>
                    </div>

                    <div className="pt-1">
                      {isSelected ? (
                        <div className="w-full py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Active Buy Box Offer
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectListing(l);
                          }}
                          disabled={!isAvailable}
                          className="w-full py-1.5 bg-slate-100 hover:bg-indigo-600 hover:text-white disabled:opacity-40 text-slate-700 rounded-lg text-xs font-bold transition"
                        >
                          {isAvailable ? 'Select This Offer' : 'Offer Unavailable'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>

      <section className="pt-10 border-t border-slate-200 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Similar Products You May Like
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Curated alternatives matching category and brand from independent sellers
            </p>
          </div>

          {similarProducts.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => scrollCarousel('left')}
                className="p-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-indigo-600 transition shadow-2xs"
                aria-label="Scroll recommendations left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollCarousel('right')}
                className="p-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-indigo-600 transition shadow-2xs"
                aria-label="Scroll recommendations right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {similarLoading ? (
          <div className="flex gap-4 overflow-hidden pb-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-64 sm:w-72 shrink-0 bg-white border border-slate-200/90 rounded-2xl p-4 space-y-3 animate-pulse shadow-2xs"
              >
                <div className="aspect-square bg-slate-100 rounded-xl" />
                <div className="h-4 bg-slate-100 rounded-md w-3/4" />
                <div className="h-3 bg-slate-100 rounded-md w-1/2" />
                <div className="h-6 bg-slate-100 rounded-md w-24 pt-2" />
              </div>
            ))}
          </div>
        ) : similarProducts.length === 0 ? (
          <div className="p-8 bg-slate-50 rounded-2xl border border-slate-200 text-center text-xs text-slate-500 space-y-2">
            <Package className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="font-bold text-slate-700">No Similar Products Found</p>
            <p>There are no other active products matching this category or brand yet.</p>
          </div>
        ) : (
          <div
            ref={carouselRef}
            className="flex gap-4 overflow-x-auto scrollbar-none scroll-smooth pb-4 px-1 snap-x snap-mandatory"
          >
            {similarProducts.map((p) => {
              const pricing = similarPricing[p.id];
              const isItemWishlisted = wishlistedIds.has(p.id);

              return (
                <div
                  key={p.id}
                  className="w-64 sm:w-72 shrink-0 snap-start flex flex-col justify-between bg-white border border-slate-200/90 rounded-2xl p-4 hover:border-indigo-300 hover:shadow-card-hover transition-all group"
                >
                  <Link
                    to={`/products/${p.id}`}
                    className="block flex-1 cursor-pointer focus:outline-none"
                  >
                    <div className="relative aspect-square bg-slate-50/70 rounded-xl border border-slate-100 p-3 mb-3.5 flex items-center justify-center overflow-hidden">
                      {p.imageUrl ? (
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            if (e.target.nextSibling) {
                              e.target.nextSibling.style.display = 'block';
                            }
                          }}
                        />
                      ) : null}
                      <Package
                        className={`w-12 h-12 text-slate-300 stroke-1 group-hover:scale-105 transition-transform ${
                          p.imageUrl ? 'hidden' : 'block'
                        }`}
                      />

                      <button
                        type="button"
                        onClick={(e) => handleToggleWishlist(p.id, e)}
                        className={`absolute top-2.5 right-2.5 p-2 rounded-full transition-all shadow-2xs z-10 ${
                          isItemWishlisted
                            ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                            : 'bg-white/90 text-slate-400 hover:text-rose-600 hover:bg-white'
                        }`}
                        title={isItemWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                        aria-label={isItemWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                      >
                        <Heart className={`w-4 h-4 ${isItemWishlisted ? 'fill-rose-500' : ''}`} />
                      </button>

                      <span
                        className={`absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold shadow-2xs border ${
                          p.matchType === 'both'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : p.matchType === 'category'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {p.matchLabel}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap mb-2">
                      {p.category?.name && <CategoryBadge name={p.category.name} size="xs" />}
                      {p.brand?.name && <BrandBadge name={p.brand.name} size="xs" />}
                    </div>

                    <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm group-hover:text-indigo-600 transition line-clamp-2 leading-snug">
                      {p.name}
                    </h3>

                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed group-hover:text-slate-600 transition">
                      {p.description || 'Canonical product specifications.'}
                    </p>

                    {p.specifications && p.specifications.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100">
                        <SpecificationChips
                          specifications={p.specifications}
                          initialLimit={2}
                          allowExpand={false}
                        />
                      </div>
                    )}
                  </Link>

                  <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">
                        {pricing?.offerCount ? `${pricing.offerCount} Seller Offers` : 'Pricing'}
                      </span>
                      <span className="text-xs sm:text-sm font-black text-slate-900">
                        {pricing?.minPrice
                          ? `From ₹${pricing.minPrice.toLocaleString('en-IN')}`
                          : 'Compare Offers'}
                      </span>
                    </div>

                    <Link
                      to={`/products/${p.id}`}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                    >
                      View <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default ProductDetailPage;
