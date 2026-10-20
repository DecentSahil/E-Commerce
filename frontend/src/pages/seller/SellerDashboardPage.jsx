import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { sellerApi } from '../../api/seller';
import { productsApi } from '../../api/products';
import { ordersApi } from '../../api/orders';
import {
  Store,
  Plus,
  Edit3,
  Trash2,
  PackageCheck,
  AlertCircle,
  AlertTriangle,
  X,
  Boxes,
  CheckCircle2,
  ShoppingBag,
  Clock,
  Truck,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  Search,
  RotateCcw,
  LayoutDashboard,
  TrendingUp,
  Package,
  Layers,
  ArrowUpDown,
  Filter,
  ExternalLink,
  ShieldCheck,
  Info,
  Calendar,
} from 'lucide-react';
import { LISTING_CONDITIONS, ORDER_STATUSES } from '../../types';
import {
  CategoryBadge,
  StatusBadge,
  ConditionBadge,
  BrandBadge,
} from '../../components/ui/Badges';
import { ConfirmModal } from '../../components/ui/ConfirmModal';

const EMPTY_FORM = {
  productId: '',
  price: '',
  currency: 'INR',
  stockQuantity: '',
  condition: 'NEW',
};

export const SellerDashboardPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('overview');

  const [listings, setListings] = useState([]);
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [conditionFilter, setConditionFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('RECENT');
  const [viewMode, setViewMode] = useState('table');

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [productSearchQuery, setProductSearchQuery] = useState('');

  const [deleteConfirmListingId, setDeleteConfirmListingId] = useState(null);
  const [deleteListingLoading, setDeleteListingLoading] = useState(false);

  const [quickStockUpdatingId, setQuickStockUpdatingId] = useState(null);

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderPage, setOrderPage] = useState(0);
  const [orderTotalPages, setOrderTotalPages] = useState(1);
  const [totalOrdersCount, setTotalOrdersCount] = useState(0);
  const [confirmingOrderId, setConfirmingOrderId] = useState(null);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newOrderStatus, setNewOrderStatus] = useState('');
  const [orderStatusReason, setOrderStatusReason] = useState('Status updated by seller');
  const [updatingOrderStatus, setUpdatingOrderStatus] = useState(false);

  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchListings();
    fetchCatalogProducts();
    fetchOrders(0);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'orders') {
      setActiveTab('orders');
    } else if (tabParam === 'listings') {
      setActiveTab('listings');
    } else {
      setActiveTab('overview');
    }
  }, [location.search]);

  useEffect(() => {
    if (activeTab === 'orders') {
      fetchOrders(orderPage);
    }
  }, [activeTab, orderPage]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('tab', newTab);
    navigate({ search: searchParams.toString() }, { replace: true });
  };

  const fetchCatalogProducts = async () => {
    try {
      const res = await productsApi.getProducts({ size: 100, status: 'ACTIVE' });
      const data = res.data?.content || res.data || [];
      const items = Array.isArray(data) ? data : [];
      setCatalogProducts(items.filter((p) => p.status === 'ACTIVE'));
    } catch {
    }
  };

  const fetchListings = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await sellerApi.getMyListings();
      const data = res.data?.data || res.data || [];
      const items = Array.isArray(data) ? data : data.content || [];
      setListings(items);
    } catch (err) {
      setError('Unable to load your seller listings. Please verify your merchant authorization.');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async (page = 0) => {
    try {
      setOrdersLoading(true);
      const res = await ordersApi.getSellerOrders(page, 15);
      const data = res.data;
      const content = data?.content || (Array.isArray(data) ? data : []);
      setOrders(content);
      setOrderTotalPages(data?.totalPages || 1);
      setTotalOrdersCount(data?.totalElements || content.length);
      setOrderPage(page);
    } catch (err) {
      showToast('Failed to load customer orders.', 'error');
    } finally {
      setOrdersLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditTarget(null);
    setFormData(EMPTY_FORM);
    setProductSearchQuery('');
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (listing) => {
    setEditTarget(listing);
    setFormData({
      productId: listing.productId || '',
      price: listing.sellingPrice || '',
      currency: listing.currency || 'INR',
      stockQuantity: listing.stockQuantity ?? '',
      condition: listing.condition || 'NEW',
    });
    setProductSearchQuery('');
    setFormError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditTarget(null);
    setFormError(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      const priceNum = parseFloat(formData.price);
      const stockNum = parseInt(formData.stockQuantity, 10);

      if (isNaN(priceNum) || priceNum <= 0) {
        setFormError('Selling price must be greater than zero.');
        setSubmitting(false);
        return;
      }

      if (isNaN(stockNum) || stockNum < 0) {
        setFormError('Stock quantity cannot be negative.');
        setSubmitting(false);
        return;
      }

      if (editTarget) {
        const updatePayload = {
          sellingPrice: priceNum,
          currency: (formData.currency || 'INR').toUpperCase(),
          stockQuantity: stockNum,
          condition: formData.condition,
        };
        const res = await sellerApi.updateListing(editTarget.id, updatePayload);
        const updated = res.data?.data || res.data;
        setListings((prev) => prev.map((l) => (l.id === editTarget.id ? updated : l)));
        showToast('Listing updated successfully!');
      } else {
        if (!formData.productId) {
          setFormError('Please select a canonical product from the catalog.');
          setSubmitting(false);
          return;
        }

        if (listings.some((l) => l.productId === formData.productId)) {
          setFormError('You already have a listing for this product. Edit your existing offer instead.');
          setSubmitting(false);
          return;
        }

        const createPayload = {
          productId: formData.productId,
          sellingPrice: priceNum,
          currency: (formData.currency || 'INR').toUpperCase(),
          stockQuantity: stockNum,
          condition: formData.condition,
        };
        const res = await sellerApi.createListing(createPayload);
        const created = res.data?.data || res.data;
        setListings((prev) => [created, ...prev]);
        showToast('New seller offer published to marketplace!');
      }
      closeModal();
    } catch (err) {
      setFormError(
        err.response?.data?.message || 'Operation failed. Please verify your listing fields.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (listingId) => {
    setDeleteConfirmListingId(listingId);
  };

  const executeDeleteListing = async () => {
    if (!deleteConfirmListingId) return;
    setDeleteListingLoading(true);
    try {
      await sellerApi.deleteListing(deleteConfirmListingId);
      setListings((prev) => prev.filter((l) => l.id !== deleteConfirmListingId));
      setDeleteConfirmListingId(null);
      showToast('Listing removed from marketplace.');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete listing.', 'error');
      setDeleteConfirmListingId(null);
    } finally {
      setDeleteListingLoading(false);
    }
  };

  const handleQuickStockAdjustment = async (listing, delta) => {
    const newQty = Math.max(0, (listing.stockQuantity || 0) + delta);
    setQuickStockUpdatingId(listing.id);
    try {
      const res = await sellerApi.updateListing(listing.id, {
        sellingPrice: listing.sellingPrice,
        currency: listing.currency,
        stockQuantity: newQty,
        condition: listing.condition,
      });
      const updated = res.data?.data || res.data;
      setListings((prev) => prev.map((l) => (l.id === listing.id ? updated : l)));
      showToast(`Stock updated to ${newQty} units`);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to adjust stock', 'error');
    } finally {
      setQuickStockUpdatingId(null);
    }
  };

  const handleQuickConfirmOrder = async (orderId) => {
    setConfirmingOrderId(orderId);
    try {
      await ordersApi.updateSellerOrderStatus(orderId, 'CONFIRMED', 'Order confirmed by seller');
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: 'CONFIRMED' } : o))
      );
      showToast(`Order #${orderId.slice(0, 8)} confirmed!`);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to confirm order.', 'error');
    } finally {
      setConfirmingOrderId(null);
    }
  };

  const handleOpenStatusModal = (order) => {
    setSelectedOrder(order);
    setNewOrderStatus(order.status || 'PENDING');
    setOrderStatusReason('Status updated by seller');
    setOrderModalOpen(true);
  };

  const handleSaveOrderStatus = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setUpdatingOrderStatus(true);
    try {
      await ordersApi.updateSellerOrderStatus(
        selectedOrder.id,
        newOrderStatus,
        orderStatusReason
      );
      setOrders((prev) =>
        prev.map((o) => (o.id === selectedOrder.id ? { ...o, status: newOrderStatus } : o))
      );
      showToast(`Order status updated to ${newOrderStatus}`);
      setOrderModalOpen(false);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update order status.', 'error');
    } finally {
      setUpdatingOrderStatus(false);
    }
  };

  const metrics = useMemo(() => {
    const total = listings.length;
    const active = listings.filter((l) => l.status === 'ACTIVE' && (l.stockQuantity || 0) > 0).length;
    const outOfStock = listings.filter((l) => (l.stockQuantity || 0) === 0 || l.status === 'OUT_OF_STOCK').length;
    const lowStock = listings.filter((l) => (l.stockQuantity || 0) > 0 && (l.stockQuantity || 0) <= 5).length;
    const totalUnits = listings.reduce((acc, curr) => acc + (curr.stockQuantity || 0), 0);

    const conditions = {
      NEW: listings.filter((l) => l.condition === 'NEW').length,
      REFURBISHED: listings.filter((l) => l.condition === 'REFURBISHED').length,
      USED: listings.filter((l) => l.condition && l.condition.startsWith('USED')).length,
    };

    return {
      total,
      active,
      outOfStock,
      lowStock,
      totalUnits,
      conditions,
    };
  }, [listings]);

  const activeProducts = useMemo(() => {
    return catalogProducts.filter((p) => p.status === 'ACTIVE');
  }, [catalogProducts]);

  const filteredActiveProducts = useMemo(() => {
    const query = productSearchQuery.toLowerCase().trim();
    if (!query) return activeProducts;
    return activeProducts.filter((p) => {
      return (
        p.name?.toLowerCase().includes(query) ||
        p.brand?.name?.toLowerCase().includes(query) ||
        p.category?.name?.toLowerCase().includes(query) ||
        p.id?.toLowerCase().includes(query)
      );
    });
  }, [activeProducts, productSearchQuery]);

  const selectedProduct = useMemo(() => {
    return catalogProducts.find((p) => p.id === formData.productId);
  }, [catalogProducts, formData.productId]);

  const filteredListings = useMemo(() => {
    return listings
      .filter((item) => {
        if (statusFilter === 'ACTIVE') {
          if (item.status !== 'ACTIVE' || (item.stockQuantity || 0) === 0) return false;
        } else if (statusFilter === 'OUT_OF_STOCK') {
          if ((item.stockQuantity || 0) > 0 && item.status !== 'OUT_OF_STOCK') return false;
        } else if (statusFilter === 'LOW_STOCK') {
          if ((item.stockQuantity || 0) === 0 || (item.stockQuantity || 0) > 5) return false;
        }

        if (conditionFilter !== 'ALL' && item.condition !== conditionFilter) {
          return false;
        }

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const linkedProd = catalogProducts.find((p) => p.id === item.productId);
          const nameMatch = linkedProd?.name?.toLowerCase().includes(q);
          const brandMatch = linkedProd?.brand?.name?.toLowerCase().includes(q);
          const catMatch = linkedProd?.category?.name?.toLowerCase().includes(q);
          const idMatch = item.id?.toLowerCase().includes(q) || item.productId?.toLowerCase().includes(q);
          if (!nameMatch && !brandMatch && !catMatch && !idMatch) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'PRICE_ASC') return Number(a.sellingPrice || 0) - Number(b.sellingPrice || 0);
        if (sortBy === 'PRICE_DESC') return Number(b.sellingPrice || 0) - Number(a.sellingPrice || 0);
        if (sortBy === 'STOCK_ASC') return (a.stockQuantity || 0) - (b.stockQuantity || 0);
        if (sortBy === 'STOCK_DESC') return (b.stockQuantity || 0) - (a.stockQuantity || 0);
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      });
  }, [listings, catalogProducts, statusFilter, conditionFilter, searchQuery, sortBy]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
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
            <div className="flex items-center gap-2 text-indigo-600 text-xs font-black uppercase tracking-wider">
              <Store className="w-4 h-4 stroke-[2.2]" />
              <span>Merchant Operational Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Seller Dashboard & Listings
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
              Manage your marketplace product offers, adjust inventory quantities, and process incoming customer orders.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={openCreateModal}
              className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-2xl text-xs sm:text-sm font-black transition flex items-center gap-2 shadow-xs shadow-indigo-100"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Publish New Listing</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center p-1.5 bg-slate-100/90 rounded-2xl max-w-lg border border-slate-200/60 shadow-2xs">
        <button
          type="button"
          onClick={() => handleTabChange('overview')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'overview'
              ? 'bg-white text-indigo-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Overview</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('listings')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'listings'
              ? 'bg-white text-indigo-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>My Listings</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
              activeTab === 'listings' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {listings.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('orders')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'orders'
              ? 'bg-white text-indigo-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Customer Orders</span>
          {totalOrdersCount > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                activeTab === 'orders' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {totalOrdersCount}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-8 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-6 bg-white border border-slate-200/90 rounded-3xl shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Active Listings
                </span>
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                  <Boxes className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl font-black text-slate-900 tracking-tight">{metrics.active}</p>
              <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                <span>{metrics.total} total offers submitted</span>
              </div>
            </div>

            <div className="p-6 bg-white border border-slate-200/90 rounded-3xl shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Total Inventory Units
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <PackageCheck className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl font-black text-slate-900 tracking-tight">{metrics.totalUnits}</p>
              <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                <span>Ready for order dispatch</span>
              </div>
            </div>

            <div className="p-6 bg-white border border-slate-200/90 rounded-3xl shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Inventory Alerts
                </span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl font-black text-amber-600 tracking-tight">
                {metrics.outOfStock + metrics.lowStock}
              </p>
              <div className="text-[11px] text-slate-500 font-medium">
                <span>{metrics.outOfStock} out of stock, {metrics.lowStock} low stock</span>
              </div>
            </div>

            <div className="p-6 bg-white border border-slate-200/90 rounded-3xl shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Customer Orders
                </span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl font-black text-slate-900 tracking-tight">{totalOrdersCount}</p>
              <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                <span>Total orders containing your items</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-4">
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                Merchant Quick Actions
              </h3>
              <div className="space-y-2 text-xs">
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="w-full p-3 rounded-2xl bg-indigo-50/70 hover:bg-indigo-100/70 border border-indigo-200/80 text-indigo-700 font-bold flex items-center justify-between transition"
                >
                  <span className="flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Publish New Listing Offer
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('LOW_STOCK');
                    handleTabChange('listings');
                  }}
                  className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold flex items-center justify-between transition"
                >
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" /> Review Low Stock Items ({metrics.lowStock})
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => handleTabChange('orders')}
                  className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold flex items-center justify-between transition"
                >
                  <span className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-blue-500" /> Incoming Orders Queue ({totalOrdersCount})
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </button>

                <Link
                  to="/products"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold flex items-center justify-between transition"
                >
                  <span className="flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-slate-400" /> Browse Catalog Storefront
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  Inventory Condition Breakdown
                </h3>
                <span className="text-xs text-slate-400 font-medium">By Listing Condition</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/70 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                    Brand New
                  </span>
                  <p className="text-2xl font-black text-slate-900">{metrics.conditions.NEW}</p>
                  <span className="text-[11px] text-slate-500">Unopened factory condition</span>
                </div>

                <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200/70 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-800">
                    Refurbished
                  </span>
                  <p className="text-2xl font-black text-slate-900">{metrics.conditions.REFURBISHED}</p>
                  <span className="text-[11px] text-slate-500">Certified refurbished grade</span>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/70 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">
                    Pre-Owned / Used
                  </span>
                  <p className="text-2xl font-black text-slate-900">{metrics.conditions.USED}</p>
                  <span className="text-[11px] text-slate-500">Inspected like new or good</span>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs text-slate-600 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Listing Status Policy:</strong> Whenever stock quantity reaches 0, the marketplace automatically transitions the listing status to <span className="font-semibold text-slate-800">OUT_OF_STOCK</span>. Replenishing stock instantly reactivates your offer for customer buy box consideration.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Recent Product Listings
                </h3>
                <p className="text-xs text-slate-500">Your latest published marketplace listings</p>
              </div>
              <button
                type="button"
                onClick={() => handleTabChange('listings')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition"
              >
                <span>View All ({listings.length})</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400">Loading listings...</div>
            ) : listings.length === 0 ? (
              <div className="py-10 text-center space-y-3">
                <Package className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-700">No listings published yet</p>
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
                >
                  Create Your First Listing
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Canonical Product</th>
                      <th className="py-3 px-4">Condition</th>
                      <th className="py-3 px-4">Selling Price</th>
                      <th className="py-3 px-4">Stock</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {listings.slice(0, 5).map((item) => {
                      const linkedProd = catalogProducts.find((p) => p.id === item.productId);
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                                {linkedProd?.imageUrl ? (
                                  <img
                                    src={linkedProd.imageUrl}
                                    alt={linkedProd.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Package className="w-4 h-4 text-slate-400" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="font-extrabold text-slate-900 truncate max-w-xs">
                                  {linkedProd?.name || `Product #${item.productId.slice(0, 8)}`}
                                </div>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  ID: {item.id.slice(0, 8)}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <ConditionBadge condition={item.condition} size="xs" />
                          </td>
                          <td className="py-3.5 px-4 font-black text-slate-900 whitespace-nowrap">
                            ₹{Number(item.sellingPrice || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span
                              className={`font-bold px-2 py-0.5 rounded-md text-[11px] ${
                                (item.stockQuantity || 0) === 0
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : (item.stockQuantity || 0) < 5
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              {item.stockQuantity || 0} in stock
                            </span>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <StatusBadge status={item.status || 'ACTIVE'} size="xs" />
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => openEditModal(item)}
                              className="px-2.5 py-1 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 font-bold rounded-lg transition"
                            >
                              Edit
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
        </div>
      )}

      {activeTab === 'listings' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search listings by title, brand, category, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium transition"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setViewMode('table')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      viewMode === 'table' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600'
                    }`}
                  >
                    Table
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('cards')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      viewMode === 'cards' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600'
                    }`}
                  >
                    Cards
                  </button>
                </div>

                <button
                  type="button"
                  onClick={openCreateModal}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Listing</span>
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-500">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 outline-none focus:border-indigo-500"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">Active in Stock</option>
                  <option value="LOW_STOCK">Low Stock (&lt; 5)</option>
                  <option value="OUT_OF_STOCK">Out of Stock (0)</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-500">Condition:</span>
                <select
                  value={conditionFilter}
                  onChange={(e) => setConditionFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 outline-none focus:border-indigo-500"
                >
                  <option value="ALL">All Conditions</option>
                  {LISTING_CONDITIONS.map((c) => {
                    const val = typeof c === 'object' ? c.value : c;
                    const lbl = typeof c === 'object' ? c.label : c;
                    return (
                      <option key={val} value={val}>
                        {lbl}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <span className="font-bold text-slate-500">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 outline-none focus:border-indigo-500"
                >
                  <option value="RECENT">Recently Created</option>
                  <option value="PRICE_ASC">Price: Low to High</option>
                  <option value="PRICE_DESC">Price: High to Low</option>
                  <option value="STOCK_DESC">Stock: High to Low</option>
                  <option value="STOCK_ASC">Stock: Low to High</option>
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-white border border-slate-200 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">{error}</p>
              <button
                type="button"
                onClick={fetchListings}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
              >
                Retry
              </button>
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="bg-white border border-slate-200/90 rounded-3xl p-14 text-center space-y-4 shadow-xs">
              <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto border border-indigo-100">
                <Boxes className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-slate-900">
                  {listings.length === 0 ? "You haven't created any listings yet" : 'No listings match your filters'}
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  {listings.length === 0
                    ? 'Publish a seller offer against approved canonical products to reach marketplace shoppers.'
                    : 'Try clearing your search query or adjusting your status and condition filters.'}
                </p>
              </div>
              {listings.length === 0 ? (
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                >
                  Publish First Listing
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('ALL');
                    setConditionFilter('ALL');
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Reset All Filters
                </button>
              )}
            </div>
          ) : viewMode === 'table' ? (
            <div className="overflow-x-auto rounded-3xl border border-slate-200/90 bg-white shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-4 px-5">Canonical Product</th>
                    <th className="py-4 px-5">Condition</th>
                    <th className="py-4 px-5">Selling Price</th>
                    <th className="py-4 px-5">Stock Level</th>
                    <th className="py-4 px-5">Status</th>
                    <th className="py-4 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredListings.map((item) => {
                    const linkedProd = catalogProducts.find((p) => p.id === item.productId);
                    const isStockBusy = quickStockUpdatingId === item.id;
                    const stock = item.stockQuantity || 0;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 p-1 shrink-0 overflow-hidden flex items-center justify-center">
                              {linkedProd?.imageUrl ? (
                                <img
                                  src={linkedProd.imageUrl}
                                  alt={linkedProd.name}
                                  className="w-full h-full object-contain"
                                />
                              ) : (
                                <Package className="w-5 h-5 text-slate-400 stroke-1" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <Link
                                to={`/products/${item.productId}`}
                                target="_blank"
                                rel="noreferrer"
                                className="font-extrabold text-slate-900 text-sm hover:text-indigo-600 transition flex items-center gap-1.5"
                                title="Open customer product detail page"
                              >
                                <span className="truncate max-w-sm">
                                  {linkedProd?.name || `Product #${item.productId.slice(0, 8)}`}
                                </span>
                                <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
                              </Link>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                {linkedProd?.brand?.name && (
                                  <BrandBadge name={linkedProd.brand.name} size="xs" />
                                )}
                                {linkedProd?.category?.name && (
                                  <CategoryBadge name={linkedProd.category.name} size="xs" />
                                )}
                                <span className="text-[10px] text-slate-400 font-mono bg-slate-100 px-1.5 py-0.5 rounded font-bold">
                                  Listing #{item.id.slice(0, 8)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-5 whitespace-nowrap">
                          <ConditionBadge condition={item.condition} size="xs" />
                        </td>
                        <td className="py-4 px-5 font-black text-slate-900 text-sm whitespace-nowrap">
                          ₹{Number(item.sellingPrice || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-4 px-5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-black px-2.5 py-0.5 rounded-lg text-xs ${
                                stock === 0
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : stock < 5
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              {stock} units
                            </span>

                            <div className="flex items-center gap-0.5">
                              <button
                                type="button"
                                disabled={isStockBusy || stock === 0}
                                onClick={() => handleQuickStockAdjustment(item, -1)}
                                className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs disabled:opacity-30"
                                title="Reduce stock by 1"
                              >
                                -
                              </button>
                              <button
                                type="button"
                                disabled={isStockBusy}
                                onClick={() => handleQuickStockAdjustment(item, 1)}
                                className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs disabled:opacity-30"
                                title="Increase stock by 1"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-5 whitespace-nowrap">
                          <StatusBadge status={item.status || 'ACTIVE'} size="xs" />
                        </td>
                        <td className="py-4 px-5 text-right whitespace-nowrap space-x-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 hover:text-indigo-600 transition"
                            title="Edit listing details"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            className="p-2 hover:bg-rose-50 rounded-xl text-slate-400 hover:text-rose-600 transition"
                            title="Delete listing"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredListings.map((item) => {
                const linkedProd = catalogProducts.find((p) => p.id === item.productId);
                const stock = item.stockQuantity || 0;
                return (
                  <div
                    key={item.id}
                    className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between gap-4 hover:border-slate-300 transition"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                        <ConditionBadge condition={item.condition} size="xs" />
                        <StatusBadge status={item.status || 'ACTIVE'} size="xs" />
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 p-1 shrink-0 overflow-hidden flex items-center justify-center">
                          {linkedProd?.imageUrl ? (
                            <img
                              src={linkedProd.imageUrl}
                              alt={linkedProd.name}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <Package className="w-6 h-6 text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-slate-900 text-sm truncate">
                            {linkedProd?.name || `Product #${item.productId.slice(0, 8)}`}
                          </h4>
                          <div className="flex items-center gap-1.5 mt-1">
                            {linkedProd?.brand?.name && (
                              <BrandBadge name={linkedProd.brand.name} size="xs" />
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold uppercase">Price</span>
                          <span className="font-black text-slate-900 text-sm">
                            ₹{Number(item.sellingPrice || 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block font-bold uppercase">Stock</span>
                          <span
                            className={`font-black text-xs ${
                              stock === 0 ? 'text-rose-600' : stock < 5 ? 'text-amber-600' : 'text-emerald-700'
                            }`}
                          >
                            {stock} units
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <Link
                        to={`/products/${item.productId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> Storefront
                      </Link>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1 transition"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 rounded-xl border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-400 transition"
                          title="Delete listing"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Incoming Customer Orders
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Orders placed containing your listings. Confirm orders, update dispatch tracking, and coordinate delivery.
              </p>
            </div>
            <button
              type="button"
              onClick={() => fetchOrders(orderPage)}
              className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 active:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 self-start shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Refresh Orders</span>
            </button>
          </div>

          {ordersLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 bg-white border border-slate-200 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white border border-slate-200/90 rounded-3xl p-14 text-center space-y-4 shadow-xs">
              <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto stroke-[1.5]" />
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-slate-900">No incoming customer orders yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  When customers purchase your listed items, orders will appear here for 1-click confirmation and courier tracking updates.
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
                    <th className="py-4 px-5">Your Items</th>
                    <th className="py-4 px-5">Total Payable</th>
                    <th className="py-4 px-5">Fulfillment Status</th>
                    <th className="py-4 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {orders.map((ord) => {
                    const isPending = ord.status === 'PENDING';
                    const isConfirming = confirmingOrderId === ord.id;
                    const sellerSpecificItems = ord.items
                      ? ord.items.filter((i) => !user?.userId || i.sellerId === user.userId)
                      : null;
                    const displayItemCount = sellerSpecificItems
                      ? sellerSpecificItems.length
                      : (ord.itemCount ?? ord.items?.length ?? 1);
                    const displayTotal =
                      sellerSpecificItems && sellerSpecificItems.length > 0
                        ? sellerSpecificItems.reduce((acc, i) => acc + Number(i.lineTotal || 0), 0)
                        : ord.grandTotal;

                    return (
                      <tr key={ord.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-4 px-5">
                          <div className="font-mono font-extrabold text-slate-900 text-sm">
                            {ord.orderNumber || `#${ord.id.slice(0, 8)}`}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            UUID: {ord.id.slice(0, 8)}...
                          </span>
                        </td>
                        <td className="py-4 px-5 text-slate-600 whitespace-nowrap">
                          {ord.createdAt
                            ? new Date(ord.createdAt).toLocaleDateString('en-IN', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : 'Recently'}
                        </td>
                        <td className="py-4 px-5">
                          <span className="font-extrabold text-slate-900">{displayItemCount} item(s)</span>
                          {sellerSpecificItems && ord.items && sellerSpecificItems.length < ord.items.length && (
                            <span className="block text-[10px] text-indigo-600 font-bold">
                              Your offer portions
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-5 font-black text-slate-900 text-sm whitespace-nowrap">
                          ₹{Number(displayTotal || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-4 px-5 whitespace-nowrap">
                          <StatusBadge status={ord.status || 'PENDING'} size="xs" />
                        </td>
                        <td className="py-4 px-5 text-right whitespace-nowrap space-x-2">
                          {isPending && (
                            <button
                              type="button"
                              onClick={() => handleQuickConfirmOrder(ord.id)}
                              disabled={isConfirming}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs inline-flex items-center gap-1.5 disabled:opacity-50"
                              title="1-Click confirm order"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>{isConfirming ? 'Confirming...' : 'Confirm'}</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenStatusModal(ord)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5"
                            title="Update shipment and fulfillment status"
                          >
                            <Truck className="w-3.5 h-3.5 text-slate-500" />
                            <span>Update Status</span>
                          </button>

                          <Link
                            to={`/orders/${ord.id}`}
                            className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 inline-block align-middle transition"
                            title="View customer order timeline"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {orderTotalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs">
              <span className="font-semibold text-slate-500">
                Page {orderPage + 1} of {orderTotalPages} ({totalOrdersCount} orders)
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

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150"
          onClick={() => !submitting && closeModal()}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl my-8 border border-slate-200/90 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                  <Boxes className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {editTarget ? 'Edit Seller Listing Offer' : 'Publish New Seller Offer'}
                  </h3>
                  <p className="text-xs text-slate-400">Offer inventory on canonical products</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={submitting}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1.5 flex items-center justify-between">
                  <span>Canonical Catalog Product <span className="text-rose-500">*</span></span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Approved Catalog
                  </span>
                </label>

                {selectedProduct ? (
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 p-1 shrink-0 overflow-hidden flex items-center justify-center">
                        {selectedProduct.imageUrl ? (
                          <img
                            src={selectedProduct.imageUrl}
                            alt={selectedProduct.name}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <Package className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-extrabold text-slate-900 text-xs sm:text-sm truncate">
                          {selectedProduct.name}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          {selectedProduct.category?.name && (
                            <CategoryBadge name={selectedProduct.category.name} size="xs" />
                          )}
                          {selectedProduct.brand?.name && (
                            <BrandBadge name={selectedProduct.brand.name} size="xs" />
                          )}
                        </div>
                      </div>
                    </div>

                    {!editTarget ? (
                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, productId: '' }));
                          setProductSearchQuery('');
                        }}
                        className="px-2.5 py-1 text-[11px] font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition shrink-0"
                      >
                        Change
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-bold px-2 py-1 bg-white rounded-md border border-slate-200 shrink-0">
                        Product Locked
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        placeholder="Search active catalog by product title, brand, or ID..."
                        value={productSearchQuery}
                        onChange={(e) => setProductSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition font-medium"
                      />
                    </div>

                    <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100 bg-white shadow-2xs">
                      {filteredActiveProducts.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-400">
                          {activeProducts.length === 0
                            ? 'No approved active canonical products found.'
                            : 'No active products match your search.'}
                        </div>
                      ) : (
                        filteredActiveProducts.map((p) => {
                          const alreadyListed = listings.some((l) => l.productId === p.id);
                          return (
                            <div
                              key={p.id}
                              onClick={() => {
                                if (alreadyListed) {
                                  showToast('You already have an active offer for this product.', 'error');
                                  return;
                                }
                                setFormData((prev) => ({ ...prev, productId: p.id }));
                                setProductSearchQuery('');
                              }}
                              className={`p-2.5 flex items-center justify-between gap-3 transition text-xs ${
                                alreadyListed
                                  ? 'opacity-50 cursor-not-allowed bg-slate-50'
                                  : 'hover:bg-indigo-50/60 cursor-pointer'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-200 p-0.5 shrink-0 overflow-hidden flex items-center justify-center">
                                  {p.imageUrl ? (
                                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-contain" />
                                  ) : (
                                    <Package className="w-4 h-4 text-slate-400" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-extrabold text-slate-900 truncate">{p.name}</div>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    {p.brand?.name && <BrandBadge name={p.brand.name} size="xs" />}
                                    <span className="text-[10px] text-slate-400 font-mono">#{p.id.slice(0, 8)}</span>
                                  </div>
                                </div>
                              </div>
                              {alreadyListed ? (
                                <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-md shrink-0">
                                  Already Listed
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg shrink-0">
                                  Select
                                </span>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Selling Price (INR) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="e.g. 1499.00"
                    required
                    className="w-full p-2.5 sm:p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:border-slate-300 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none font-extrabold text-slate-900 transition"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Price in Indian Rupees (₹)</span>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Stock Quantity <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    name="stockQuantity"
                    value={formData.stockQuantity}
                    onChange={handleInputChange}
                    placeholder="e.g. 25"
                    required
                    className="w-full p-2.5 sm:p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:border-slate-300 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none font-extrabold text-slate-900 transition"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">0 stock marks offer Out of Stock</span>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Item Condition <span className="text-rose-500">*</span>
                </label>
                <select
                  name="condition"
                  value={formData.condition}
                  onChange={handleInputChange}
                  className="w-full p-2.5 sm:p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:border-slate-300 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none font-bold text-slate-900 transition"
                >
                  {LISTING_CONDITIONS.map((cond) => {
                    const val = typeof cond === 'object' ? cond.value : cond;
                    const lbl = typeof cond === 'object' ? cond.label : cond;
                    return (
                      <option key={val} value={val}>
                        {lbl}
                      </option>
                    );
                  })}
                </select>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Select accurate grade: Brand New, Certified Refurbished, or Pre-Owned
                </span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl font-bold transition shadow-xs flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting && (
                    <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                  )}
                  <span>{submitting ? 'Saving Offer...' : editTarget ? 'Save Changes' : 'Publish Offer'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {orderModalOpen && selectedOrder && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150"
          onClick={() => !updatingOrderStatus && setOrderModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl my-8 border border-slate-200/90 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Update Order Status</h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Order #{selectedOrder.orderNumber || selectedOrder.id.slice(0, 8)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOrderModalOpen(false)}
                disabled={updatingOrderStatus}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOrderStatus} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Target Fulfillment Status <span className="text-rose-500">*</span>
                </label>
                <select
                  value={newOrderStatus}
                  onChange={(e) => setNewOrderStatus(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:border-slate-300 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none font-bold text-slate-900 transition"
                >
                  <option value="CONFIRMED">CONFIRMED (Order Confirmed by Seller)</option>
                  <option value="PROCESSING">PROCESSING (Packaging & Dispatch Prep)</option>
                  <option value="SHIPPED">SHIPPED (Handed to Logistics Carrier)</option>
                  <option value="DELIVERED">DELIVERED (Successfully Handed to Buyer)</option>
                  <option value="CANCELLED">CANCELLED (Cancel & Restore Stock)</option>
                </select>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Progress order lifecycle matching your real warehouse operations.
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Status Transition Note / Courier Reason
                </label>
                <textarea
                  rows={3}
                  value={orderStatusReason}
                  onChange={(e) => setOrderStatusReason(e.target.value)}
                  placeholder="e.g. Package dispatched via courier service with Tracking AWB#..."
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:border-slate-300 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none font-medium text-slate-900 resize-none transition"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setOrderModalOpen(false)}
                  disabled={updatingOrderStatus}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingOrderStatus}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl font-bold transition shadow-xs flex items-center gap-2 disabled:opacity-50"
                >
                  {updatingOrderStatus && (
                    <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                  )}
                  <span>{updatingOrderStatus ? 'Updating...' : 'Save Status'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(deleteConfirmListingId)}
        onClose={() => setDeleteConfirmListingId(null)}
        onConfirm={executeDeleteListing}
        title="Remove Listing Offer?"
        message="Are you sure you want to delete this listing offer? It will be removed immediately from public customer storefronts."
        confirmText="Yes, Remove Offer"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleteListingLoading}
      />
    </div>
  );
};

export default SellerDashboardPage;
