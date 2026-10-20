import React, { useEffect, useState, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { productsApi } from '../../api/products';
import { ordersApi } from '../../api/orders';
import { authApi } from '../../api/auth';
import {
  Boxes,
  Tags,
  ShoppingBag,
  Store,
  Plus,
  Edit3,
  Trash2,
  Search,
  X,
  Check,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Shield,
  Layers,
  FolderPlus,
  Filter,
  ArrowUpDown,
  UserCheck,
  UserX,
  Clock,
  Truck,
  Eye,
  FileText,
  BadgeAlert,
  Package,
} from 'lucide-react';
import { ImageUpload } from '../../components/ui/ImageUpload';
import {
  CategoryBadge,
  BrandBadge,
  StatusBadge,
  SpecificationChips,
} from '../../components/ui/Badges';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { ORDER_STATUSES, PRODUCT_STATUSES } from '../../types';

export const AdminDashboardPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('products');

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [orders, setOrders] = useState([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [orderPage, setOrderPage] = useState(0);
  const [orderTotalPages, setOrderTotalPages] = useState(1);
  const [pendingSellers, setPendingSellers] = useState([]);

  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingSellers, setLoadingSellers] = useState(false);
  const [catalogError, setCatalogError] = useState(null);
  const [toast, setToast] = useState(null);

  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('ALL');
  const [productBrandFilter, setProductBrandFilter] = useState('ALL');
  const [productStatusFilter, setProductStatusFilter] = useState('ALL');
  const [productSortBy, setProductSortBy] = useState('NAME_ASC');

  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    categoryId: '',
    brandId: '',
    imageUrl: '',
    status: 'ACTIVE',
    tags: '',
    specifications: [{ key: '', value: '' }],
  });
  const [productSubmitting, setProductSubmitting] = useState(false);

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });
  const [categorySubmitting, setCategorySubmitting] = useState(false);

  const [brandModalOpen, setBrandModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [brandForm, setBrandForm] = useState({ name: '', description: '' });
  const [brandSubmitting, setBrandSubmitting] = useState(false);

  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newOrderStatus, setNewOrderStatus] = useState('');
  const [orderStatusReason, setOrderStatusReason] = useState('Status updated by administrator');
  const [updatingOrderStatus, setUpdatingOrderStatus] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [approvingSellerId, setApprovingSellerId] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'categories_brands') {
      setActiveTab('categories_brands');
    } else if (tabParam === 'orders') {
      setActiveTab('orders');
    } else if (tabParam === 'sellers') {
      setActiveTab('sellers');
    } else {
      setActiveTab('products');
    }
  }, [location.search]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('tab', newTab);
    navigate({ search: searchParams.toString() }, { replace: true });
  };

  useEffect(() => {
    loadCatalog();
    loadOrders(0);
    loadPendingSellers();
  }, []);

  useEffect(() => {
    if (activeTab === 'orders') {
      loadOrders(orderPage);
    }
  }, [activeTab, orderPage]);

  useEffect(() => {
    if (activeTab === 'sellers') {
      loadPendingSellers();
    }
  }, [activeTab]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setProductModalOpen(false);
        setCategoryModalOpen(false);
        setBrandModalOpen(false);
        setOrderModalOpen(false);
        setDeleteTarget(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const loadCatalog = async () => {
    setLoadingCatalog(true);
    setCatalogError(null);
    try {
      const [productRes, categoryRes, brandRes] = await Promise.all([
        productsApi.getProducts({ size: 100 }),
        productsApi.getCategories(),
        productsApi.getBrands(),
      ]);
      const productData = productRes.data?.content || productRes.data || [];
      setProducts(Array.isArray(productData) ? productData : []);
      setCategories(Array.isArray(categoryRes.data) ? categoryRes.data : []);
      setBrands(Array.isArray(brandRes.data) ? brandRes.data : []);
    } catch {
      setCatalogError('Unable to load catalog taxonomies and products.');
    } finally {
      setLoadingCatalog(false);
    }
  };

  const loadOrders = async (page = 0) => {
    setLoadingOrders(true);
    try {
      const res = await ordersApi.adminGetAllOrders(page, 15);
      const data = res.data;
      const content = data?.content || (Array.isArray(data) ? data : []);
      setOrders(content);
      setTotalOrders(data?.totalElements ?? content.length);
      setOrderTotalPages(data?.totalPages ?? 1);
      setOrderPage(page);
    } catch {
      showToast('Failed to load platform orders.', 'error');
    } finally {
      setLoadingOrders(false);
    }
  };

  const loadPendingSellers = async () => {
    setLoadingSellers(true);
    try {
      const res = await authApi.getPendingSellers();
      const items = Array.isArray(res.data) ? res.data : [];
      setPendingSellers(items);
    } catch {
      setPendingSellers([]);
    } finally {
      setLoadingSellers(false);
    }
  };

  const handleOpenProductModal = (prod = null) => {
    if (prod) {
      setEditingProduct(prod);
      setProductForm({
        name: prod.name || '',
        description: prod.description || '',
        categoryId: prod.category?.id || '',
        brandId: prod.brand?.id || '',
        imageUrl: prod.imageUrl || '',
        status: prod.status || 'ACTIVE',
        tags: Array.isArray(prod.tags) ? prod.tags.join(', ') : '',
        specifications: prod.specifications && prod.specifications.length > 0
          ? prod.specifications
          : [{ key: '', value: '' }],
      });
    } else {
      setEditingProduct(null);
      setProductForm({
        name: '',
        description: '',
        categoryId: categories[0]?.id || '',
        brandId: brands[0]?.id || '',
        imageUrl: '',
        status: 'ACTIVE',
        tags: '',
        specifications: [{ key: '', value: '' }],
      });
    }
    setProductModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setProductSubmitting(true);
    try {
      const tagsArray = productForm.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const validSpecs = productForm.specifications.filter((s) => s.key.trim() && s.value.trim());

      const payload = {
        name: productForm.name.trim(),
        description: productForm.description.trim(),
        categoryId: productForm.categoryId,
        brandId: productForm.brandId,
        imageUrl: productForm.imageUrl?.trim() || null,
        status: productForm.status,
        tags: tagsArray,
        specifications: validSpecs,
      };

      if (!payload.name) {
        showToast('Product title is required.', 'error');
        setProductSubmitting(false);
        return;
      }

      if (editingProduct) {
        const res = await productsApi.updateProduct(editingProduct.id, payload);
        const updated = res.data?.data || res.data;
        setProducts((prev) => prev.map((p) => (p.id === editingProduct.id ? updated : p)));
        showToast('Canonical product updated successfully!');
      } else {
        const res = await productsApi.createProduct(payload);
        const created = res.data?.data || res.data;
        setProducts((prev) => [created, ...prev]);
        showToast('New canonical product created in catalog!');
      }
      setProductModalOpen(false);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save canonical product.', 'error');
    } finally {
      setProductSubmitting(false);
    }
  };

  const handleOpenCategoryModal = (cat = null) => {
    setEditingCategory(cat);
    setCategoryForm({ name: cat?.name || '', description: cat?.description || '' });
    setCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    setCategorySubmitting(true);
    try {
      const payload = {
        name: categoryForm.name.trim(),
        description: categoryForm.description.trim(),
      };
      if (editingCategory) {
        const res = await productsApi.updateCategory(editingCategory.id, payload);
        const updated = res.data?.data || res.data;
        setCategories((prev) => prev.map((c) => (c.id === editingCategory.id ? updated : c)));
        showToast('Category updated successfully!');
      } else {
        const res = await productsApi.createCategory(payload);
        const created = res.data?.data || res.data;
        setCategories((prev) => [...prev, created]);
        showToast('New category added to catalog taxonomy!');
      }
      setCategoryModalOpen(false);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save category.', 'error');
    } finally {
      setCategorySubmitting(false);
    }
  };

  const handleOpenBrandModal = (br = null) => {
    setEditingBrand(br);
    setBrandForm({ name: br?.name || '', description: br?.description || '' });
    setBrandModalOpen(true);
  };

  const handleSaveBrand = async (e) => {
    e.preventDefault();
    setBrandSubmitting(true);
    try {
      const payload = {
        name: brandForm.name.trim(),
        description: brandForm.description.trim(),
      };
      if (editingBrand) {
        const res = await productsApi.updateBrand(editingBrand.id, payload);
        const updated = res.data?.data || res.data;
        setBrands((prev) => prev.map((b) => (b.id === editingBrand.id ? updated : b)));
        showToast('Brand updated successfully!');
      } else {
        const res = await productsApi.createBrand(payload);
        const created = res.data?.data || res.data;
        setBrands((prev) => [...prev, created]);
        showToast('New brand registered in marketplace catalog!');
      }
      setBrandModalOpen(false);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save brand.', 'error');
    } finally {
      setBrandSubmitting(false);
    }
  };

  const executeDeleteTarget = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    const { type, id } = deleteTarget;
    try {
      if (type === 'product') {
        await productsApi.deleteProduct(id);
        setProducts((prev) => prev.filter((p) => p.id !== id));
        showToast('Canonical product removed from catalog.');
      } else if (type === 'category') {
        await productsApi.deleteCategory(id);
        setCategories((prev) => prev.filter((c) => c.id !== id));
        showToast('Category deleted from taxonomy.');
      } else if (type === 'brand') {
        await productsApi.deleteBrand(id);
        setBrands((prev) => prev.filter((b) => b.id !== id));
        showToast('Brand deleted.');
      } else if (type === 'seller_reject') {
        await authApi.rejectSeller(id);
        setPendingSellers((prev) => prev.filter((s) => s.id !== id));
        showToast('Seller application rejected.');
      }
      setDeleteTarget(null);
    } catch (err) {
      showToast(err.response?.data?.message || `Failed to delete ${type}.`, 'error');
      setDeleteTarget(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleOpenOrderModal = async (orderId) => {
    try {
      const res = await ordersApi.adminGetOrderById(orderId);
      const ord = res.data?.data || res.data;
      setSelectedOrder(ord);
      setNewOrderStatus(ord.status || 'PENDING');
      setOrderStatusReason('Status updated by administrator');
      setOrderModalOpen(true);
    } catch {
      showToast('Failed to load full order details.', 'error');
    }
  };

  const handleUpdateOrderStatus = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setUpdatingOrderStatus(true);
    try {
      const res = await ordersApi.adminUpdateOrderStatus(
        selectedOrder.id,
        newOrderStatus,
        orderStatusReason
      );
      const updated = res.data?.data || res.data;
      setSelectedOrder(updated);
      setOrders((prev) => prev.map((o) => (o.id === selectedOrder.id ? { ...o, status: newOrderStatus } : o)));
      showToast(`Order status updated to ${newOrderStatus}`);
      setOrderModalOpen(false);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update order status.', 'error');
    } finally {
      setUpdatingOrderStatus(false);
    }
  };

  const handleApproveSeller = async (sellerId) => {
    setApprovingSellerId(sellerId);
    try {
      await authApi.approveSeller(sellerId);
      setPendingSellers((prev) => prev.filter((s) => s.id !== sellerId));
      showToast('Seller account approved and activated!');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to approve seller.', 'error');
    } finally {
      setApprovingSellerId(null);
    }
  };

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        if (productStatusFilter !== 'ALL' && p.status !== productStatusFilter) {
          return false;
        }

        if (productCategoryFilter !== 'ALL' && p.category?.id !== productCategoryFilter) {
          return false;
        }

        if (productBrandFilter !== 'ALL' && p.brand?.id !== productBrandFilter) {
          return false;
        }

        if (productSearch.trim()) {
          const q = productSearch.toLowerCase().trim();
          const nameMatch = p.name?.toLowerCase().includes(q);
          const brandMatch = p.brand?.name?.toLowerCase().includes(q);
          const catMatch = p.category?.name?.toLowerCase().includes(q);
          const idMatch = p.id?.toLowerCase().includes(q);
          if (!nameMatch && !brandMatch && !catMatch && !idMatch) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (productSortBy === 'NAME_ASC') return (a.name || '').localeCompare(b.name || '');
        if (productSortBy === 'NAME_DESC') return (b.name || '').localeCompare(a.name || '');
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      });
  }, [products, productSearch, productCategoryFilter, productBrandFilter, productStatusFilter, productSortBy]);

  return (
    <div className="max-w-7xl mx-auto space-y-7 pb-20">
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed top-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-xl text-xs sm:text-sm font-semibold flex items-center gap-2.5 transition-all animate-in fade-in slide-in-from-top-3 ${
            toast.type === 'error' ? 'bg-rose-600 text-white' : 'bg-slate-900 text-white'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 shrink-0 text-white" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          )}
          <span>{toast.msg}</span>
        </div>
      )}

      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-rose-600 text-xs font-black uppercase tracking-wider">
              <Shield className="w-4 h-4 stroke-[2.2]" />
              <span>Platform Administration Console</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Operations & Governance
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
              Canonical product catalog, category taxonomies, merchant onboarding approvals, and global order lifecycle management.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => {
                loadCatalog();
                loadOrders(orderPage);
                loadPendingSellers();
                showToast('Console data refreshed.');
              }}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
              title="Refresh all console datasets from backend APIs"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Refresh</span>
            </button>

            {activeTab === 'products' && (
              <button
                type="button"
                onClick={() => handleOpenProductModal()}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-2xl text-xs font-black transition flex items-center gap-1.5 shadow-xs shadow-rose-200"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>New Canonical Product</span>
              </button>
            )}

            {activeTab === 'categories_brands' && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenCategoryModal()}
                  className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>Add Category</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenBrandModal()}
                  className="px-3.5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs shadow-rose-200"
                >
                  <Tags className="w-3.5 h-3.5" />
                  <span>Add Brand</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-slate-100 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              Canonical Products
            </span>
            <div className="text-xl font-black text-slate-900">{products.length}</div>
            <span className="text-[11px] text-slate-500">Master catalog specifications</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              Taxonomy Structure
            </span>
            <div className="text-xl font-black text-slate-900">
              {categories.length} <span className="text-xs font-semibold text-slate-400">cats /</span> {brands.length} <span className="text-xs font-semibold text-slate-400">brands</span>
            </div>
            <span className="text-[11px] text-slate-500">Recognized brands & categories</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              Platform Orders
            </span>
            <div className="text-xl font-black text-slate-900">{totalOrders}</div>
            <span className="text-[11px] text-slate-500">Total customer orders placed</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              Seller Applications
            </span>
            <div className={`text-xl font-black ${pendingSellers.length > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
              {pendingSellers.length}
            </div>
            <span className="text-[11px] text-slate-500">
              {pendingSellers.length > 0 ? 'Awaiting onboarding approval' : 'All accounts approved'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center p-1.5 bg-slate-100/90 rounded-2xl max-w-xl border border-slate-200/60 shadow-2xs">
        <button
          type="button"
          onClick={() => handleTabChange('products')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'products'
              ? 'bg-white text-rose-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Catalog Products</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
              activeTab === 'products' ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {products.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('categories_brands')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'categories_brands'
              ? 'bg-white text-rose-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Tags className="w-4 h-4" />
          <span>Categories & Brands</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('orders')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'orders'
              ? 'bg-white text-rose-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Platform Orders</span>
          {totalOrders > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                activeTab === 'orders' ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {totalOrders}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('sellers')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'sellers'
              ? 'bg-white text-rose-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Seller Approvals</span>
          {pendingSellers.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-500 text-white animate-pulse">
              {pendingSellers.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'products' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search canonical catalog by title, brand, category, or UUID..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-100 font-medium transition"
                />
                {productSearch && (
                  <button
                    type="button"
                    onClick={() => setProductSearch('')}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleOpenProductModal()}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs self-start md:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Create Canonical Product</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-500">Status:</span>
                <select
                  value={productStatusFilter}
                  onChange={(e) => setProductStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 outline-none focus:border-rose-500"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">ACTIVE (Published)</option>
                  <option value="INACTIVE">INACTIVE (Hidden)</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-500">Category:</span>
                <select
                  value={productCategoryFilter}
                  onChange={(e) => setProductCategoryFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 outline-none focus:border-rose-500 max-w-[160px] truncate"
                >
                  <option value="ALL">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-500">Brand:</span>
                <select
                  value={productBrandFilter}
                  onChange={(e) => setProductBrandFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 outline-none focus:border-rose-500 max-w-[160px] truncate"
                >
                  <option value="ALL">All Brands</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <span className="font-bold text-slate-500">Sort:</span>
                <select
                  value={productSortBy}
                  onChange={(e) => setProductSortBy(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 outline-none focus:border-rose-500"
                >
                  <option value="NAME_ASC">Name (A-Z)</option>
                  <option value="NAME_DESC">Name (Z-A)</option>
                  <option value="RECENT">Recently Created</option>
                </select>
              </div>
            </div>
          </div>

          {loadingCatalog ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 bg-white border border-slate-200 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : catalogError ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">{catalogError}</p>
              <button
                type="button"
                onClick={loadCatalog}
                className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold"
              >
                Retry
              </button>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white border border-slate-200/90 rounded-3xl p-14 text-center space-y-4 shadow-xs">
              <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-100">
                <Boxes className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-slate-900">
                  {products.length === 0 ? 'No canonical products in catalog' : 'No products match your filters'}
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  {products.length === 0
                    ? 'Publish approved canonical products to allow sellers to attach marketplace listings.'
                    : 'Try clearing your search query or adjusting your category, brand, and status filters.'}
                </p>
              </div>
              {products.length === 0 ? (
                <button
                  type="button"
                  onClick={() => handleOpenProductModal()}
                  className="px-5 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  Create First Product
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setProductSearch('');
                    setProductCategoryFilter('ALL');
                    setProductBrandFilter('ALL');
                    setProductStatusFilter('ALL');
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Reset All Filters
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-3xl border border-slate-200/90 bg-white shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-4 px-5">Canonical Product</th>
                    <th className="py-4 px-5">Category</th>
                    <th className="py-4 px-5">Brand</th>
                    <th className="py-4 px-5">Status</th>
                    <th className="py-4 px-5">Specifications</th>
                    <th className="py-4 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3.5">
                          <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 p-1 shrink-0 overflow-hidden flex items-center justify-center">
                            {p.imageUrl ? (
                              <img
                                src={p.imageUrl}
                                alt={p.name}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <Package className="w-5 h-5 text-slate-400 stroke-1" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <Link
                              to={`/products/${p.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="font-extrabold text-slate-900 text-sm hover:text-rose-600 transition flex items-center gap-1.5"
                              title="View public storefront product page"
                            >
                              <span className="truncate max-w-sm">{p.name}</span>
                              <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
                            </Link>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-slate-400 font-mono font-bold bg-slate-100 px-1.5 py-0.5 rounded">
                                UUID: {p.id.slice(0, 8)}...
                              </span>
                              {p.tags && p.tags.length > 0 && (
                                <span className="text-[10px] text-slate-500 truncate max-w-xs">
                                  #{p.tags.slice(0, 3).join(', ')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5 whitespace-nowrap">
                        {p.category?.name ? (
                          <CategoryBadge name={p.category.name} size="xs" />
                        ) : (
                          <span className="text-slate-400 italic">Uncategorized</span>
                        )}
                      </td>
                      <td className="py-4 px-5 whitespace-nowrap">
                        {p.brand?.name ? (
                          <BrandBadge name={p.brand.name} size="xs" />
                        ) : (
                          <span className="text-slate-400 italic">Unbranded</span>
                        )}
                      </td>
                      <td className="py-4 px-5 whitespace-nowrap">
                        <StatusBadge status={p.status || 'ACTIVE'} size="xs" />
                      </td>
                      <td className="py-4 px-5">
                        <SpecificationChips
                          specifications={p.specifications || []}
                          initialLimit={2}
                          allowExpand={true}
                        />
                      </td>
                      <td className="py-4 px-5 text-right whitespace-nowrap space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenProductModal(p)}
                          className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 hover:text-rose-600 transition"
                          title="Edit product specifications"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setDeleteTarget({
                              type: 'product',
                              id: p.id,
                              name: p.name,
                            })
                          }
                          className="p-2 hover:bg-rose-50 rounded-xl text-slate-400 hover:text-rose-600 transition"
                          title="Delete canonical product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'categories_brands' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <FolderPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Categories ({categories.length})</h3>
                  <p className="text-xs text-slate-400">Departmental taxonomy tree</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleOpenCategoryModal()}
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Category</span>
              </button>
            </div>

            {categories.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400">No categories created yet.</div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto pr-1">
                {categories.map((c) => (
                  <div key={c.id} className="py-3 flex items-center justify-between text-xs hover:bg-slate-50/70 transition px-2 rounded-xl">
                    <div className="min-w-0 pr-2">
                      <div className="font-extrabold text-slate-900 truncate">{c.name}</div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">{c.description || 'No description'}</div>
                      <span className="text-[10px] text-slate-400 font-mono">ID: {c.id.slice(0, 8)}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenCategoryModal(c)}
                        className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-indigo-600 rounded-lg transition"
                        title="Edit category"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDeleteTarget({
                            type: 'category',
                            id: c.id,
                            name: c.name,
                          })
                        }
                        className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition"
                        title="Delete category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Tags className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Brands ({brands.length})</h3>
                  <p className="text-xs text-slate-400">Recognized manufacturers</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleOpenBrandModal()}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Brand</span>
              </button>
            </div>

            {brands.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400">No brands registered yet.</div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto pr-1">
                {brands.map((b) => (
                  <div key={b.id} className="py-3 flex items-center justify-between text-xs hover:bg-slate-50/70 transition px-2 rounded-xl">
                    <div className="min-w-0 pr-2">
                      <div className="font-extrabold text-slate-900 truncate">{b.name}</div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">{b.description || 'Manufacturer brand'}</div>
                      <span className="text-[10px] text-slate-400 font-mono">ID: {b.id.slice(0, 8)}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenBrandModal(b)}
                        className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-rose-600 rounded-lg transition"
                        title="Edit brand"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDeleteTarget({
                            type: 'brand',
                            id: b.id,
                            name: b.name,
                          })
                        }
                        className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition"
                        title="Delete brand"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Platform Customer Orders ({totalOrders})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Inspect global customer purchases, audit order line items, and override fulfillment lifecycle state.
              </p>
            </div>
            <button
              type="button"
              onClick={() => loadOrders(orderPage)}
              className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs self-start sm:self-auto"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Refresh Orders</span>
            </button>
          </div>

          {loadingOrders ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-white border border-slate-200 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white border border-slate-200/90 rounded-3xl p-14 text-center space-y-4 shadow-xs">
              <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-slate-900">No platform orders placed yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  When customer checkout flows complete successfully, global orders will be recorded here for administration.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-3xl border border-slate-200/90 bg-white shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-4 px-5">Order Reference</th>
                    <th className="py-4 px-5">Date Placed</th>
                    <th className="py-4 px-5">Items</th>
                    <th className="py-4 px-5">Grand Total</th>
                    <th className="py-4 px-5">Fulfillment Status</th>
                    <th className="py-4 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-4 px-5">
                        <div className="font-mono font-extrabold text-slate-900 text-sm">
                          {o.orderNumber || `#${o.id.slice(0, 8)}`}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          UUID: {o.id.slice(0, 8)}...
                        </span>
                      </td>
                      <td className="py-4 px-5 text-slate-600 whitespace-nowrap">
                        {o.createdAt
                          ? new Date(o.createdAt).toLocaleDateString('en-IN', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : 'Recently'}
                      </td>
                      <td className="py-4 px-5 font-bold text-slate-900">
                        {o.itemCount ?? o.items?.length ?? 1} item(s)
                      </td>
                      <td className="py-4 px-5 font-black text-slate-900 text-sm whitespace-nowrap">
                        ₹{Number(o.grandTotal || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-4 px-5 whitespace-nowrap">
                        <StatusBadge status={o.status || 'PENDING'} size="xs" />
                      </td>
                      <td className="py-4 px-5 text-right whitespace-nowrap space-x-2">
                        <button
                          type="button"
                          onClick={() => handleOpenOrderModal(o.id)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>Inspect & Update</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {orderTotalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs">
              <span className="font-semibold text-slate-500">
                Page {orderPage + 1} of {orderTotalPages} ({totalOrders} orders)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOrderPage((p) => Math.max(0, p - 1))}
                  disabled={orderPage === 0}
                  className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl font-bold disabled:opacity-40 transition shadow-2xs"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setOrderPage((p) => Math.min(orderTotalPages - 1, p + 1))}
                  disabled={orderPage >= orderTotalPages - 1}
                  className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl font-bold disabled:opacity-40 transition shadow-2xs"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'sellers' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Seller Onboarding Review Queue ({pendingSellers.length})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Review merchant registrations in <span className="font-semibold text-amber-600">PENDING_APPROVAL</span> status before granting listing publication rights.
              </p>
            </div>
            <button
              type="button"
              onClick={loadPendingSellers}
              className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs self-start sm:self-auto"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Refresh Queue</span>
            </button>
          </div>

          {loadingSellers ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-24 bg-white border border-slate-200 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : pendingSellers.length === 0 ? (
            <div className="bg-white border border-slate-200/90 rounded-3xl p-14 text-center space-y-4 shadow-xs">
              <Store className="w-12 h-12 text-slate-300 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-slate-900">No pending seller applications</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  All seller registrations have been reviewed. When new merchants sign up, they will appear here for KYC/onboarding review.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-3xl border border-slate-200/90 bg-white shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-4 px-5">Merchant Email / Account</th>
                    <th className="py-4 px-5">Account Status</th>
                    <th className="py-4 px-5">Registered Role</th>
                    <th className="py-4 px-5">User ID</th>
                    <th className="py-4 px-5 text-right">Approval Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {pendingSellers.map((seller) => {
                    const isBusy = approvingSellerId === seller.id;
                    return (
                      <tr key={seller.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 font-black flex items-center justify-center border border-amber-200 shrink-0">
                              {seller.email?.[0]?.toUpperCase() || 'S'}
                            </div>
                            <div className="min-w-0">
                              <div className="font-extrabold text-slate-900 text-sm truncate">
                                {seller.email}
                              </div>
                              <span className="text-[10px] text-slate-400">
                                Merchant Applicant
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-5 whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-amber-50 text-amber-800 border border-amber-200">
                            {seller.accountStatus || 'PENDING_APPROVAL'}
                          </span>
                        </td>
                        <td className="py-4 px-5 whitespace-nowrap">
                          <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                            {seller.role || 'ROLE_SELLER'}
                          </span>
                        </td>
                        <td className="py-4 px-5 font-mono text-[11px] text-slate-400">
                          {seller.id}
                        </td>
                        <td className="py-4 px-5 text-right whitespace-nowrap space-x-2">
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleApproveSeller(seller.id)}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs inline-flex items-center gap-1.5 disabled:opacity-50"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>{isBusy ? 'Activating...' : 'Approve Account'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setDeleteTarget({
                                type: 'seller_reject',
                                id: seller.id,
                                name: seller.email,
                              })
                            }
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5"
                          >
                            <UserX className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {productModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-hidden animate-in fade-in duration-150"
          onClick={() => !productSubmitting && setProductModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200/90 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="px-6 py-4.5 sm:px-8 sm:py-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
                  <Boxes className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    {editingProduct ? 'Edit Canonical Product' : 'Create Canonical Product'}
                  </h3>
                  <p className="text-xs text-slate-400">Master product catalog specifications</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setProductModalOpen(false)}
                disabled={productSubmitting}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto px-6 py-5 sm:px-8 space-y-4 flex-1">
              <form id="admin-product-form" onSubmit={handleSaveProduct} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Canonical Product Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    placeholder="e.g. Sony WH-1000XM5 Wireless Headphones"
                    className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-rose-100 focus:border-rose-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Official Description</label>
                  <textarea
                    rows={3}
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    placeholder="Official hardware specs & manufacturer description..."
                    className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-rose-100 focus:border-rose-500 resize-none font-medium"
                  />
                </div>

                <div>
                  <ImageUpload
                    label="Canonical Image Attachment"
                    value={productForm.imageUrl}
                    onChange={(url) => setProductForm((prev) => ({ ...prev, imageUrl: url }))}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Department Category <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={productForm.categoryId}
                      onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                      className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-rose-100 focus:border-rose-500 font-semibold bg-white"
                    >
                      <option value="">Select Category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Manufacturer Brand <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={productForm.brandId}
                      onChange={(e) => setProductForm({ ...productForm, brandId: e.target.value })}
                      className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-rose-100 focus:border-rose-500 font-semibold bg-white"
                    >
                      <option value="">Select Brand</option>
                      {brands.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Catalog Status</label>
                    <select
                      value={productForm.status}
                      onChange={(e) => setProductForm({ ...productForm, status: e.target.value })}
                      className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-rose-100 focus:border-rose-500 font-semibold bg-white"
                    >
                      <option value="ACTIVE">ACTIVE (Published for seller listing creation)</option>
                      <option value="INACTIVE">INACTIVE (Hidden from seller offers)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Search Tags (comma-separated)</label>
                    <input
                      type="text"
                      value={productForm.tags}
                      onChange={(e) => setProductForm({ ...productForm, tags: e.target.value })}
                      placeholder="wireless, anc, bluetooth 5.2"
                      className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-rose-100 focus:border-rose-500 font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-3 border-t border-slate-100">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-700">Technical Specifications</span>
                    <button
                      type="button"
                      onClick={() =>
                        setProductForm({
                          ...productForm,
                          specifications: [...productForm.specifications, { key: '', value: '' }],
                        })
                      }
                      className="text-rose-600 font-bold hover:underline text-[11px]"
                    >
                      + Add Specification Row
                    </button>
                  </div>

                  {productForm.specifications.map((spec, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Feature (e.g. Battery Life)"
                        value={spec.key}
                        onChange={(e) => {
                          const copy = [...productForm.specifications];
                          copy[i].key = e.target.value;
                          setProductForm({ ...productForm, specifications: copy });
                        }}
                        className="w-1/2 p-2.5 rounded-xl border border-slate-200 text-xs font-semibold outline-none focus:border-rose-500"
                      />
                      <input
                        type="text"
                        placeholder="Value (e.g. 30 Hours)"
                        value={spec.value}
                        onChange={(e) => {
                          const copy = [...productForm.specifications];
                          copy[i].value = e.target.value;
                          setProductForm({ ...productForm, specifications: copy });
                        }}
                        className="w-1/2 p-2.5 rounded-xl border border-slate-200 text-xs font-medium outline-none focus:border-rose-500"
                      />
                      {productForm.specifications.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setProductForm({
                              ...productForm,
                              specifications: productForm.specifications.filter((_, idx) => idx !== i),
                            });
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition"
                          title="Remove specification"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </form>
            </div>

            <div className="px-6 py-4 sm:px-8 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/80 shrink-0">
              <button
                type="button"
                onClick={() => setProductModalOpen(false)}
                disabled={productSubmitting}
                className="px-4 py-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl font-bold transition shadow-2xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="admin-product-form"
                disabled={productSubmitting}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-xs transition flex items-center gap-2 disabled:opacity-50"
              >
                {productSubmitting && (
                  <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                )}
                <span>{productSubmitting ? 'Saving...' : editingProduct ? 'Save Changes' : 'Publish Product'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {categoryModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-hidden animate-in fade-in duration-150"
          onClick={() => !categorySubmitting && setCategoryModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {editingCategory ? 'Edit Category' : 'Create Category'}
                </h3>
                <p className="text-xs text-slate-400">Department taxonomy classification</p>
              </div>
              <button
                type="button"
                onClick={() => setCategoryModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="e.g. Wearables, Audio, Laptops"
                  className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 font-semibold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description</label>
                <textarea
                  rows={3}
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  placeholder="Official classification description..."
                  className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 font-medium resize-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(false)}
                  disabled={categorySubmitting}
                  className="px-4 py-2.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-700 transition shadow-2xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={categorySubmitting}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-xs transition disabled:opacity-50"
                >
                  {categorySubmitting ? 'Saving...' : editingCategory ? 'Update Category' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {brandModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-hidden animate-in fade-in duration-150"
          onClick={() => !brandSubmitting && setBrandModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {editingBrand ? 'Edit Brand' : 'Create Brand'}
                </h3>
                <p className="text-xs text-slate-400">Recognized manufacturer brand</p>
              </div>
              <button
                type="button"
                onClick={() => setBrandModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBrand} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Brand Name *</label>
                <input
                  type="text"
                  required
                  value={brandForm.name}
                  onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })}
                  placeholder="e.g. Sony, Apple, Bose, Samsung"
                  className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:border-rose-500 font-semibold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description</label>
                <textarea
                  rows={3}
                  value={brandForm.description}
                  onChange={(e) => setBrandForm({ ...brandForm, description: e.target.value })}
                  placeholder="Official brand background or notes..."
                  className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:border-rose-500 font-medium resize-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setBrandModalOpen(false)}
                  disabled={brandSubmitting}
                  className="px-4 py-2.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-700 transition shadow-2xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={brandSubmitting}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-xs transition disabled:opacity-50"
                >
                  {brandSubmitting ? 'Saving...' : editingBrand ? 'Update Brand' : 'Save Brand'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {orderModalOpen && selectedOrder && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-hidden animate-in fade-in duration-150"
          onClick={() => !updatingOrderStatus && setOrderModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Order #{selectedOrder.orderNumber || selectedOrder.id.slice(0, 8)}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    UUID: {selectedOrder.id}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOrderModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
              <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-500">Buyer User ID:</span>
                  <span className="font-mono font-bold text-slate-800">{selectedOrder.authUserId || selectedOrder.userId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Grand Total:</span>
                  <span className="font-black text-slate-900 text-sm">
                    ₹{Number(selectedOrder.grandTotal || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Current Status:</span>
                  <StatusBadge status={selectedOrder.status || 'PENDING'} size="xs" />
                </div>
              </div>

              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div className="space-y-2">
                  <span className="font-bold text-slate-700 block">Purchased Line Items:</span>
                  <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden bg-slate-50/50">
                    {selectedOrder.items.map((it, idx) => (
                      <div key={idx} className="p-2.5 flex items-center justify-between">
                        <div className="min-w-0 pr-2">
                          <div className="font-extrabold text-slate-900 truncate">{it.productName || `Item #${idx + 1}`}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            Qty: {it.quantity} × ₹{Number(it.unitPrice || 0).toLocaleString('en-IN')}
                          </div>
                        </div>
                        <span className="font-black text-slate-900">
                          ₹{Number(it.lineTotal || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <form id="admin-order-status-form" onSubmit={handleUpdateOrderStatus} className="space-y-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Target Fulfillment Status *</label>
                  <select
                    value={newOrderStatus}
                    onChange={(e) => setNewOrderStatus(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 font-bold bg-white outline-none focus:border-rose-500"
                  >
                    {ORDER_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Administrative Log / Reason</label>
                  <input
                    type="text"
                    required
                    value={orderStatusReason}
                    onChange={(e) => setOrderStatusReason(e.target.value)}
                    placeholder="e.g. Courier tracking updated or customer service cancellation..."
                    className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:border-rose-500 font-medium"
                  />
                </div>
              </form>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/80 shrink-0">
              <button
                type="button"
                onClick={() => setOrderModalOpen(false)}
                disabled={updatingOrderStatus}
                className="px-4 py-2.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-700 transition shadow-2xs"
              >
                Close
              </button>
              <button
                type="submit"
                form="admin-order-status-form"
                disabled={updatingOrderStatus}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-xs transition disabled:opacity-50"
              >
                {updatingOrderStatus ? 'Updating...' : 'Commit Status Override'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={executeDeleteTarget}
        title={
          deleteTarget?.type === 'seller_reject'
            ? 'Reject Seller Application?'
            : `Delete ${
                deleteTarget?.type === 'product'
                  ? 'Canonical Product'
                  : deleteTarget?.type === 'category'
                  ? 'Category'
                  : 'Brand'
              }?`
        }
        message={
          deleteTarget?.type === 'seller_reject'
            ? `Are you sure you want to reject the seller application for "${deleteTarget?.name}"?`
            : `Are you sure you want to permanently delete "${deleteTarget?.name}"? This action removes it from the catalog and cannot be undone.`
        }
        confirmText={deleteTarget?.type === 'seller_reject' ? 'Yes, Reject Application' : 'Yes, Permanently Delete'}
        cancelText="Cancel"
        variant="danger"
        isLoading={deleteLoading}
      />
    </div>
  );
};

export default AdminDashboardPage;
