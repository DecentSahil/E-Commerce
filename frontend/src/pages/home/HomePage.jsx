import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import {
  ArrowRight,
  Tag,
  Scale,
  Store,
  ChevronRight,
  Heart,
  Laptop,
  Headphones,
  Smartphone,
  Watch,
  Gamepad2,
  Tv,
  Cpu,
  Package,
  CheckCircle2,
  LayoutGrid,
  Check,
  PackageCheck,
  ShoppingBag,
} from 'lucide-react';
import { productsApi } from '../../api/products';
import { wishlistApi } from '../../api/wishlist';
import { useAuth } from '../../context/AuthContext';
import { CategoryBadge, BrandBadge } from '../../components/ui/Badges';

export const HomePage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const outletContext = useOutletContext();

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wishlistedIds, setWishlistedIds] = useState(new Set());
  const [productPricing, setProductPricing] = useState({});

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      productsApi.getCategories().catch(() => ({ data: [] })),
      productsApi.getProducts({ status: 'ACTIVE', size: 15 }).catch(() => ({ data: { content: [] } })),
    ])
      .then(async ([categoryResponse, productResponse]) => {
        if (!isMounted) return;

        const cats = Array.isArray(categoryResponse.data) ? categoryResponse.data : [];
        const prods =
          productResponse.data?.content ||
          (Array.isArray(productResponse.data) ? productResponse.data : []);

        setCategories(cats);
        setProducts(prods);

        if (prods.length > 0) {
          const pricingMap = {};
          await Promise.all(
            prods.map(async (p) => {
              try {
                const listingRes = await productsApi.getListingsByProductId(p.id);
                const list = Array.isArray(listingRes.data) ? listingRes.data : [];
                const activeList = list
                  .filter((l) => l.status === 'ACTIVE' && Number(l.stockQuantity) > 0)
                  .sort((a, b) => Number(a.sellingPrice) - Number(b.sellingPrice));

                if (activeList.length > 0) {
                  const minPrice = Number(activeList[0].sellingPrice);
                  if (!isNaN(minPrice)) {
                    pricingMap[p.id] = {
                      minPrice,
                      offerCount: activeList.length,
                      topListing: activeList[0],
                    };
                  }
                }
              } catch {}
            })
          );

          if (isMounted) {
            setProductPricing(pricingMap);
          }
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      wishlistApi
        .getWishlist()
        .then((res) => {
          const items = res.data?.items || (Array.isArray(res.data) ? res.data : []);
          if (items.length > 0) {
            setWishlistedIds(new Set(items.map((i) => i.productId)));
          }
        })
        .catch(() => {});
    } else {
      setWishlistedIds(new Set());
    }
  }, [isAuthenticated]);

  const toggleWishlist = async (e, productId) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: '/' } } });
      return;
    }

    try {
      if (wishlistedIds.has(productId)) {
        await wishlistApi.removeItem(productId);
        setWishlistedIds((prev) => {
          const next = new Set(prev);
          next.delete(productId);
          outletContext?.setWishlistCount?.(next.size);
          return next;
        });
      } else {
        await wishlistApi.addItem(productId);
        setWishlistedIds((prev) => {
          const next = new Set(prev);
          next.add(productId);
          outletContext?.setWishlistCount?.(next.size);
          return next;
        });
      }
    } catch {}
  };

  const getCategoryIcon = (categoryName = '') => {
    const lower = categoryName.toLowerCase();
    if (lower.includes('laptop') || lower.includes('computer') || lower.includes('pc')) return Laptop;
    if (lower.includes('audio') || lower.includes('headphone') || lower.includes('sound')) return Headphones;
    if (lower.includes('phone') || lower.includes('mobile') || lower.includes('tablet')) return Smartphone;
    if (lower.includes('watch') || lower.includes('wearable')) return Watch;
    if (lower.includes('gaming') || lower.includes('console')) return Gamepad2;
    if (lower.includes('tv') || lower.includes('display') || lower.includes('monitor')) return Tv;
    if (lower.includes('component') || lower.includes('cpu') || lower.includes('hardware')) return Cpu;
    return Tag;
  };

  const featuredProducts = products.slice(0, 10);
  const secondaryProducts = products.length > 10 ? products.slice(10, 15) : [];

  return (
    <div className="space-y-5 sm:space-y-7 pb-10">
      {loading ? (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3 shadow-2xs">
          <div className="flex items-center gap-4 overflow-x-auto scrollbar-none py-1">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 shrink-0 w-16">
                <div className="w-11 h-11 rounded-xl bg-slate-100 animate-pulse" />
                <div className="w-12 h-2.5 rounded bg-slate-100 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      ) : categories.length > 0 ? (
        <section
          aria-label="Product department categories"
          className="bg-white border border-slate-200/90 rounded-2xl p-3 shadow-2xs"
        >
          <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-4 overflow-x-auto scrollbar-none py-1">
            <Link
              to="/products"
              className="group flex flex-col items-center shrink-0 w-16 sm:w-20 text-center transition"
            >
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-indigo-50/80 border border-indigo-100/80 text-indigo-600 flex items-center justify-center group-hover:scale-105 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-2xs mb-1.5">
                <LayoutGrid className="w-5 h-5 stroke-[2]" />
              </div>
              <span className="text-[11px] font-bold text-slate-700 group-hover:text-indigo-600 transition truncate max-w-[70px]">
                All Items
              </span>
            </Link>

            {categories.map((cat) => {
              const IconComponent = getCategoryIcon(cat.name);
              return (
                <Link
                  key={cat.id || cat.name}
                  to={`/products?category=${encodeURIComponent(cat.name)}`}
                  className="group flex flex-col items-center shrink-0 w-16 sm:w-20 text-center transition"
                >
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-600 flex items-center justify-center group-hover:scale-105 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all shadow-2xs mb-1.5">
                    <IconComponent className="w-5 h-5 stroke-[1.8]" />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-700 group-hover:text-indigo-600 transition truncate max-w-[72px]">
                    {cat.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="space-y-3.5 sm:space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Featured Marketplace Products</span>
              {products.length > 0 && (
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                  {products.length} Items
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Canonical product specifications with live merchant inventory.
            </p>
          </div>
          <Link
            to="/products"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 hover:underline shrink-0"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="bg-white border border-slate-200/90 rounded-2xl p-3 space-y-2 animate-pulse shadow-2xs"
              >
                <div className="aspect-square bg-slate-100 rounded-xl" />
                <div className="w-1/2 h-3 bg-slate-100 rounded" />
                <div className="w-3/4 h-3.5 bg-slate-100 rounded" />
                <div className="w-1/3 h-4 bg-slate-100 rounded pt-2" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="p-8 sm:p-12 bg-white border border-slate-200/90 rounded-2xl text-center space-y-3 shadow-2xs">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mx-auto">
              <Package className="w-6 h-6 stroke-[1.8]" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                Catalog in Preparation
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                No active canonical products are currently indexed. Once items are cataloged by platform administrators, authorized merchants will publish competing offers.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2.5 pt-1">
              <Link
                to="/products"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition shadow-xs"
              >
                Browse Catalog
              </Link>
              <Link
                to="/seller"
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
              >
                Seller Hub
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {featuredProducts.map((p) => {
              const pricing = productPricing[p.id];
              const isWishlisted = wishlistedIds.has(p.id);

              return (
                <div
                  key={p.id}
                  className="bg-white border border-slate-200/90 rounded-2xl p-3 hover:border-indigo-300 hover:shadow-card-hover transition-all flex flex-col justify-between group relative"
                >
                  <Link
                    to={`/products/${p.id}`}
                    className="block flex-1 cursor-pointer focus:outline-none"
                  >
                    <div className="relative aspect-square bg-slate-50/80 rounded-xl border border-slate-100 p-2.5 mb-2.5 flex items-center justify-center overflow-hidden">
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
                        className={`w-10 h-10 text-slate-300 stroke-[1.5] group-hover:scale-105 transition-transform ${
                          p.imageUrl ? 'hidden' : 'block'
                        }`}
                      />

                      <button
                        type="button"
                        onClick={(e) => toggleWishlist(e, p.id)}
                        className={`absolute top-2 right-2 p-1.5 rounded-full transition-all shadow-2xs z-10 ${
                          isWishlisted
                            ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                            : 'bg-white/90 text-slate-400 hover:text-rose-600 hover:bg-white'
                        }`}
                        title={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-rose-500' : ''}`} />
                      </button>

                      {pricing?.offerCount && pricing.offerCount > 1 ? (
                        <span className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-white/95 backdrop-blur-xs text-indigo-700 border border-indigo-200/80 rounded-md text-[9px] font-bold shadow-2xs">
                          {pricing.offerCount} Offers
                        </span>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-1 flex-wrap mb-1.5">
                      {p.category?.name && <CategoryBadge name={p.category.name} size="xs" />}
                      {p.brand?.name && <BrandBadge name={p.brand.name} size="xs" />}
                    </div>

                    <h3 className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-indigo-600 transition line-clamp-2 leading-snug min-h-[2rem] sm:min-h-[2.5rem]">
                      {p.name}
                    </h3>

                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1 leading-normal">
                      {p.description || 'Canonical product catalog item.'}
                    </p>
                  </Link>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-1.5">
                    <div className="min-w-0">
                      {pricing?.minPrice ? (
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold leading-tight">
                            {pricing.topListing?.condition || 'Available From'}
                          </span>
                          <span className="text-xs sm:text-sm font-black text-slate-900 leading-tight truncate block">
                            ₹{pricing.minPrice.toLocaleString()}
                          </span>
                        </div>
                      ) : (
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold leading-tight">
                            Marketplace
                          </span>
                          <span className="text-xs font-semibold text-slate-500 leading-tight block">
                            Offers pending
                          </span>
                        </div>
                      )}
                    </div>

                    <Link
                      to={`/products/${p.id}`}
                      className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0 shadow-2xs"
                    >
                      <span>View</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {secondaryProducts.length > 0 && (
        <section className="space-y-3.5 sm:space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                More Catalog Additions
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Explore newly indexed items with independent merchant listings.
              </p>
            </div>
            <Link
              to="/products"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 hover:underline shrink-0"
            >
              <span>Explore All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {secondaryProducts.map((p) => {
              const pricing = productPricing[p.id];
              const isWishlisted = wishlistedIds.has(p.id);

              return (
                <div
                  key={p.id}
                  className="bg-white border border-slate-200/90 rounded-2xl p-3 hover:border-indigo-300 hover:shadow-card-hover transition-all flex flex-col justify-between group relative"
                >
                  <Link
                    to={`/products/${p.id}`}
                    className="block flex-1 cursor-pointer focus:outline-none"
                  >
                    <div className="relative aspect-square bg-slate-50/80 rounded-xl border border-slate-100 p-2.5 mb-2.5 flex items-center justify-center overflow-hidden">
                      {p.imageUrl ? (
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : null}
                      <Package
                        className={`w-10 h-10 text-slate-300 stroke-[1.5] group-hover:scale-105 transition-transform ${
                          p.imageUrl ? 'hidden' : 'block'
                        }`}
                      />

                      <button
                        type="button"
                        onClick={(e) => toggleWishlist(e, p.id)}
                        className={`absolute top-2 right-2 p-1.5 rounded-full transition-all shadow-2xs z-10 ${
                          isWishlisted
                            ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                            : 'bg-white/90 text-slate-400 hover:text-rose-600 hover:bg-white'
                        }`}
                        title={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-rose-500' : ''}`} />
                      </button>
                    </div>

                    <div className="flex items-center gap-1 flex-wrap mb-1.5">
                      {p.category?.name && <CategoryBadge name={p.category.name} size="xs" />}
                    </div>

                    <h3 className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-indigo-600 transition line-clamp-2 leading-snug min-h-[2rem] sm:min-h-[2.5rem]">
                      {p.name}
                    </h3>
                  </Link>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-1.5">
                    <div className="min-w-0">
                      {pricing?.minPrice ? (
                        <span className="text-xs sm:text-sm font-black text-slate-900 leading-tight truncate block">
                          ₹{pricing.minPrice.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-slate-500 leading-tight block">
                          Offers pending
                        </span>
                      )}
                    </div>

                    <Link
                      to={`/products/${p.id}`}
                      className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0 shadow-2xs"
                    >
                      <span>View</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-2xs">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6 items-center">
          <div className="md:col-span-5 space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 block">
              Marketplace Model
            </span>
            <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-snug">
              Why Nexus Canonical Product Architecture?
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              Instead of scattering dozens of duplicate listings for the same gadget, Nexus unifies all merchant inventory on single canonical product pages with transparent Buy Box pricing.
            </p>
          </div>

          <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-white border border-slate-200/80 rounded-xl shadow-2xs space-y-1">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Check className="w-4 h-4 stroke-[2.5]" />
              </div>
              <h4 className="text-xs font-bold text-slate-900">Approved Merchants</h4>
              <p className="text-[11px] text-slate-500 leading-tight">
                Independent sellers approved on the platform.
              </p>
            </div>

            <div className="p-3 bg-white border border-slate-200/80 rounded-xl shadow-2xs space-y-1">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Scale className="w-4 h-4 stroke-[2.5]" />
              </div>
              <h4 className="text-xs font-bold text-slate-900">Fair Buy Box</h4>
              <p className="text-[11px] text-slate-500 leading-tight">
                Lowest active in-stock offer gets primary placement.
              </p>
            </div>

            <div className="p-3 bg-white border border-slate-200/80 rounded-xl shadow-2xs space-y-1">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <PackageCheck className="w-4 h-4 stroke-[2.5]" />
              </div>
              <h4 className="text-xs font-bold text-slate-900">Live Inventory</h4>
              <p className="text-[11px] text-slate-500 leading-tight">
                Direct stock reservation backed by backend services.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
