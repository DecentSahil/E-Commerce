import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate, useOutletContext } from 'react-router-dom';
import { productsApi } from '../../api/products';
import { wishlistApi } from '../../api/wishlist';
import {
  Search,
  Heart,
  ArrowRight,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
  Package,
  ChevronDown,
  Check,
  RotateCcw,
  LayoutGrid,
  AlertCircle,
  Folder,
  Tag,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  CategoryBadge,
  BrandBadge,
  SpecificationChips,
} from '../../components/ui/Badges';

export const CatalogPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const outletContext = useOutletContext();
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [productPricing, setProductPricing] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wishlistedIds, setWishlistedIds] = useState(new Set());
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const currentSearch = searchParams.get('search') || '';
  const currentCategory = searchParams.get('category') || '';
  const currentBrand = searchParams.get('brand') || '';
  const currentSort = searchParams.get('sort') || 'createdAt,desc';

  const [searchInput, setSearchInput] = useState(currentSearch);

  useEffect(() => {
    setSearchInput(currentSearch);
  }, [currentSearch]);

  useEffect(() => {
    productsApi
      .getCategories()
      .then((res) => setCategories(Array.isArray(res.data) ? res.data : []))
      .catch(() => setCategories([]));

    productsApi
      .getBrands()
      .then((res) => setBrands(Array.isArray(res.data) ? res.data : []))
      .catch(() => setBrands([]));
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

  useEffect(() => {
    fetchProducts();
  }, [searchParams, page, pageSize]);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        status: 'ACTIVE',
        page,
        size: pageSize,
      };

      if (currentSearch) params.search = currentSearch;
      if (currentCategory) params.category = currentCategory;
      if (currentBrand) params.brand = currentBrand;
      if (currentSort) params.sort = currentSort;

      const res = await productsApi.getProducts(params);
      const data = res.data;

      const items = data?.content || (Array.isArray(data) ? data : []);
      setProducts(items);
      setTotalPages(data?.totalPages || 1);
      setTotalElements(data?.totalElements ?? items.length);

      if (items.length > 0) {
        items.forEach(async (p) => {
          try {
            const listRes = await productsApi.getListingsByProductId(p.id);
            const list = Array.isArray(listRes.data) ? listRes.data : [];
            const activeList = list
              .filter((l) => l.status === 'ACTIVE' && Number(l.stockQuantity) > 0)
              .sort((a, b) => Number(a.sellingPrice) - Number(b.sellingPrice));

            if (activeList.length > 0) {
              const minPrice = Number(activeList[0].sellingPrice);
              if (!isNaN(minPrice)) {
                setProductPricing((prev) => ({
                  ...prev,
                  [p.id]: {
                    minPrice,
                    offerCount: activeList.length,
                    topListing: activeList[0],
                  },
                }));
              }
            }
          } catch {}
        });
      }
    } catch (err) {
      setError('Unable to load catalog products. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    const trimmed = searchInput.trim();
    if (trimmed) {
      newParams.set('search', trimmed);
    } else {
      newParams.delete('search');
    }
    setPage(0);
    setSearchParams(newParams);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('search');
    setPage(0);
    setSearchParams(newParams);
  };

  const updateParam = (key, val) => {
    const newParams = new URLSearchParams(searchParams);
    if (!val) {
      newParams.delete(key);
    } else {
      newParams.set(key, val);
    }
    setPage(0);
    setSearchParams(newParams);
  };

  const clearAllFilters = () => {
    setSearchInput('');
    setPage(0);
    setSearchParams(new URLSearchParams());
  };

  const toggleWishlist = async (e, productId) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: '/products' } } });
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

  const hasActiveFilters = Boolean(currentSearch || currentCategory || currentBrand);
  const activeFilterCount = [currentSearch, currentCategory, currentBrand].filter(Boolean).length;

  const startItemIndex = totalElements === 0 ? 0 : page * pageSize + 1;
  const endItemIndex = Math.min((page + 1) * pageSize, totalElements);

  return (
    <div className="space-y-4 sm:space-y-5 pb-10">
      <div className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-4 shadow-2xs space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <nav aria-label="Breadcrumb navigation" className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
              <Link to="/" className="hover:text-indigo-600 transition">
                Home
              </Link>
              <span>/</span>
              <span className="text-slate-800 font-bold">Catalog</span>
              {currentCategory && (
                <>
                  <span>/</span>
                  <span className="text-indigo-600 font-bold">{currentCategory}</span>
                </>
              )}
            </nav>

            <div className="flex items-baseline gap-2 mt-1">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                {currentSearch
                  ? `Results for "${currentSearch}"`
                  : currentCategory
                  ? `${currentCategory} Products`
                  : currentBrand
                  ? `${currentBrand} Products`
                  : 'All Marketplace Products'}
              </h1>
              <span className="text-xs text-slate-500 font-medium">
                ({totalElements} {totalElements === 1 ? 'item' : 'items'})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/90 rounded-xl text-xs font-bold text-slate-700 transition shadow-2xs"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="px-1.5 py-0.2 bg-indigo-600 text-white rounded-full text-[10px] font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>

            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500">
              <span className="text-[11px] font-semibold text-slate-400">Show:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(0);
                }}
                className="text-xs font-bold bg-slate-50 border border-slate-200/90 rounded-lg px-2 py-1 text-slate-800 outline-none cursor-pointer focus:border-indigo-500"
              >
                <option value={12}>12</option>
                <option value={24}>24</option>
                <option value={36}>36</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <label htmlFor="catalog-sort-select" className="text-[11px] font-semibold text-slate-400 whitespace-nowrap hidden sm:inline">
                Sort:
              </label>
              <div className="relative">
                <select
                  id="catalog-sort-select"
                  value={currentSort}
                  onChange={(e) => updateParam('sort', e.target.value)}
                  className="appearance-none text-xs font-bold bg-slate-50 border border-slate-200/90 rounded-xl pl-3 pr-7 py-1.5 text-slate-800 focus:outline-none focus:border-indigo-500 transition cursor-pointer"
                >
                  <option value="createdAt,desc">Newest Additions</option>
                  <option value="createdAt,asc">Oldest Additions</option>
                  <option value="name,asc">Name (A to Z)</option>
                  <option value="name,desc">Name (Z to A)</option>
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-400 font-semibold text-[11px] flex items-center gap-1 mr-1">
              <SlidersHorizontal className="w-3 h-3 text-indigo-600" />
              Active:
            </span>

            {currentSearch && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-100">
                <span>Keyword: "{currentSearch}"</span>
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="hover:text-indigo-950 p-0.5 rounded transition"
                  aria-label="Remove search filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {currentCategory && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-100">
                <span>Category: {currentCategory}</span>
                <button
                  type="button"
                  onClick={() => updateParam('category', '')}
                  className="hover:text-indigo-950 p-0.5 rounded transition"
                  aria-label="Remove category filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {currentBrand && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-100">
                <span>Brand: {currentBrand}</span>
                <button
                  type="button"
                  onClick={() => updateParam('brand', '')}
                  className="hover:text-indigo-950 p-0.5 rounded transition"
                  aria-label="Remove brand filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            <button
              type="button"
              onClick={clearAllFilters}
              className="ml-auto text-xs text-rose-600 hover:text-rose-700 font-bold transition flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Clear all
            </button>
          </div>
        )}
      </div>

      <div className="flex items-start gap-4 sm:gap-5">
        <aside className="w-56 shrink-0 hidden lg:block space-y-3.5">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                Keyword Search
              </span>
              {currentSearch && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="text-[10px] text-slate-400 hover:text-rose-600 font-semibold lowercase"
                >
                  clear
                </button>
              )}
            </div>

            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Search catalog..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-7 pr-6 py-1.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none transition"
              />
              <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </form>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Folder className="w-3 h-3" /> Categories
              </span>
              {currentCategory && (
                <button
                  type="button"
                  onClick={() => updateParam('category', '')}
                  className="text-[10px] text-slate-400 hover:text-rose-600 font-semibold lowercase"
                >
                  clear
                </button>
              )}
            </div>

            <div className="space-y-0.5 max-h-52 overflow-y-auto pr-1 text-xs scrollbar-thin">
              <button
                type="button"
                onClick={() => updateParam('category', '')}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg transition flex items-center justify-between ${
                  !currentCategory
                    ? 'bg-indigo-50 text-indigo-700 font-bold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span>All Categories</span>
                {!currentCategory && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
              </button>

              {categories.map((c) => {
                const isSelected = currentCategory.toLowerCase() === c.name.toLowerCase();
                return (
                  <button
                    key={c.id || c.name}
                    type="button"
                    onClick={() => updateParam('category', isSelected ? '' : c.name)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-indigo-50 text-indigo-700 font-bold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <span className="truncate">{c.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {brands.length > 0 && (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Tag className="w-3 h-3" /> Brands
                </span>
                {currentBrand && (
                  <button
                    type="button"
                    onClick={() => updateParam('brand', '')}
                    className="text-[10px] text-slate-400 hover:text-rose-600 font-semibold lowercase"
                  >
                    clear
                  </button>
                )}
              </div>

              <div className="space-y-0.5 max-h-52 overflow-y-auto pr-1 text-xs scrollbar-thin">
                <button
                  type="button"
                  onClick={() => updateParam('brand', '')}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg transition flex items-center justify-between ${
                    !currentBrand
                      ? 'bg-indigo-50 text-indigo-700 font-bold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span>All Brands</span>
                  {!currentBrand && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                </button>

                {brands.map((b) => {
                  const isSelected = currentBrand.toLowerCase() === b.name.toLowerCase();
                  return (
                    <button
                      key={b.id || b.name}
                      type="button"
                      onClick={() => updateParam('brand', isSelected ? '' : b.name)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg transition flex items-center justify-between ${
                        isSelected
                          ? 'bg-indigo-50 text-indigo-700 font-bold'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <span className="truncate">{b.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="w-full py-2 px-3 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-xl text-xs font-bold text-slate-700 transition flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <RotateCcw className="w-3 h-3 text-slate-400" />
              <span>Reset All Filters</span>
            </button>
          )}
        </aside>

        <div className="flex-1 min-w-0 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>
              Showing <strong className="text-slate-900">{startItemIndex}–{endItemIndex}</strong> of{' '}
              <strong className="text-slate-900">{totalElements}</strong> products
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div
                  key={i}
                  className="bg-white border border-slate-200/90 rounded-2xl p-3 space-y-2 animate-pulse shadow-2xs"
                >
                  <div className="aspect-square bg-slate-100 rounded-xl" />
                  <div className="h-3 bg-slate-100 rounded-md w-1/2" />
                  <div className="h-3.5 bg-slate-100 rounded-md w-3/4" />
                  <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                    <div className="h-3 bg-slate-100 rounded w-16" />
                    <div className="h-6 bg-slate-100 rounded-lg w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-8 sm:p-12 text-center space-y-3 shadow-2xs">
              <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center mx-auto">
                <AlertCircle className="w-5 h-5 stroke-[2]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                  Failed to load catalog products
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">{error}</p>
              </div>
              <button
                type="button"
                onClick={fetchProducts}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
              >
                Retry Loading
              </button>
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-8 sm:p-14 text-center space-y-3 shadow-2xs">
              <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mx-auto border border-slate-100">
                <Package className="w-6 h-6 stroke-[1.8]" />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                  {hasActiveFilters ? 'No matching products found' : 'Catalog in Preparation'}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {hasActiveFilters
                    ? 'No products match the chosen filter parameters. Try clearing some filters or searching for another keyword.'
                    : 'No active canonical products are published in the catalog yet.'}
                </p>
              </div>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs inline-flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear All Filters</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {products.map((product) => {
                const pricing = productPricing[product.id];
                const isWishlisted = wishlistedIds.has(product.id);

                return (
                  <div
                    key={product.id}
                    className="bg-white border border-slate-200/90 rounded-2xl p-3 hover:border-indigo-300 hover:shadow-card-hover transition-all flex flex-col justify-between group relative"
                  >
                    <Link
                      to={`/products/${product.id}`}
                      className="block flex-1 cursor-pointer focus:outline-none"
                    >
                      <div className="relative aspect-square bg-slate-50/80 rounded-xl border border-slate-100 p-2.5 mb-2 flex items-center justify-center overflow-hidden">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
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
                            product.imageUrl ? 'hidden' : 'block'
                          }`}
                        />

                        <button
                          type="button"
                          onClick={(e) => toggleWishlist(e, product.id)}
                          className={`absolute top-2 right-2 p-1.5 rounded-full transition-all shadow-2xs z-10 ${
                            isWishlisted
                              ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                              : 'bg-white/90 text-slate-400 hover:text-rose-600 hover:bg-white'
                          }`}
                          title={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                          aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
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
                        {product.category?.name && (
                          <CategoryBadge name={product.category.name} size="xs" />
                        )}
                        {product.brand?.name && (
                          <BrandBadge name={product.brand.name} size="xs" />
                        )}
                      </div>

                      <h3 className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-indigo-600 transition line-clamp-2 leading-snug min-h-[2rem] sm:min-h-[2.5rem]">
                        {product.name}
                      </h3>

                      {product.specifications && product.specifications.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-slate-100">
                          <SpecificationChips
                            specifications={product.specifications}
                            initialLimit={2}
                            allowExpand={false}
                          />
                        </div>
                      )}
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
                        to={`/products/${product.id}`}
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

          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200/90 text-xs text-slate-600">
              <div>
                Page <strong className="text-slate-900">{page + 1}</strong> of{' '}
                <strong className="text-slate-900">{totalPages}</strong>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition text-slate-700 shadow-2xs"
                  title="Previous Page"
                  aria-label="Previous Page"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
                  let pNum = idx;
                  if (totalPages > 5 && page > 2) {
                    pNum = Math.min(totalPages - 5 + idx, page - 2 + idx);
                  }
                  return (
                    <button
                      key={pNum}
                      type="button"
                      onClick={() => setPage(pNum)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition ${
                        page === pNum
                          ? 'bg-indigo-600 text-white shadow-2xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {pNum + 1}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition text-slate-700 shadow-2xs"
                  title="Next Page"
                  aria-label="Next Page"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileFiltersOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 w-full max-w-xs bg-white shadow-xl flex flex-col z-10 overflow-y-auto animate-in slide-in-from-right duration-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
                <h3 className="font-extrabold text-sm text-slate-900">Filters</h3>
                {activeFilterCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-indigo-600 text-white rounded-full text-[10px] font-bold">
                    {activeFilterCount}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                aria-label="Close filters"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4 flex-1 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 uppercase tracking-wider text-[10px] block">
                  Keyword Search
                </label>
                <form
                  onSubmit={(e) => {
                    handleSearchSubmit(e);
                    setMobileFiltersOpen(false);
                  }}
                  className="flex gap-1.5"
                >
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl font-bold text-xs"
                  >
                    Go
                  </button>
                </form>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                    Category
                  </span>
                  {currentCategory && (
                    <button
                      type="button"
                      onClick={() => updateParam('category', '')}
                      className="text-[10px] text-slate-400 hover:text-rose-600 font-semibold lowercase"
                    >
                      clear
                    </button>
                  )}
                </div>
                <div className="space-y-0.5 max-h-48 overflow-y-auto pr-1">
                  <button
                    type="button"
                    onClick={() => {
                      updateParam('category', '');
                      setMobileFiltersOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between ${
                      !currentCategory
                        ? 'bg-indigo-50 text-indigo-700 font-bold'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>All Categories</span>
                    {!currentCategory && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                  </button>
                  {categories.map((c) => {
                    const isSelected = currentCategory.toLowerCase() === c.name.toLowerCase();
                    return (
                      <button
                        key={c.id || c.name}
                        type="button"
                        onClick={() => {
                          updateParam('category', isSelected ? '' : c.name);
                          setMobileFiltersOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between ${
                          isSelected
                            ? 'bg-indigo-50 text-indigo-700 font-bold'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span className="truncate">{c.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {brands.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                      Brand
                    </span>
                    {currentBrand && (
                      <button
                        type="button"
                        onClick={() => updateParam('brand', '')}
                        className="text-[10px] text-slate-400 hover:text-rose-600 font-semibold lowercase"
                      >
                        clear
                      </button>
                    )}
                  </div>
                  <div className="space-y-0.5 max-h-48 overflow-y-auto pr-1">
                    <button
                      type="button"
                      onClick={() => {
                        updateParam('brand', '');
                        setMobileFiltersOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between ${
                        !currentBrand
                          ? 'bg-indigo-50 text-indigo-700 font-bold'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>All Brands</span>
                      {!currentBrand && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                    </button>
                    {brands.map((b) => {
                      const isSelected = currentBrand.toLowerCase() === b.name.toLowerCase();
                      return (
                        <button
                          key={b.id || b.name}
                          type="button"
                          onClick={() => {
                            updateParam('brand', isSelected ? '' : b.name);
                            setMobileFiltersOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between ${
                            isSelected
                              ? 'bg-indigo-50 text-indigo-700 font-bold'
                              : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <span className="truncate">{b.name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="p-3.5 border-t border-slate-100 flex gap-2">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => {
                    clearAllFilters();
                    setMobileFiltersOpen(false);
                  }}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition text-center"
                >
                  Clear All
                </button>
              )}
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition text-center shadow-xs"
              >
                View ({totalElements})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CatalogPage;
