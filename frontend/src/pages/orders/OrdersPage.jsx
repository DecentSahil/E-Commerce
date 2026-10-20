import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ordersApi } from '../../api/orders';
import {
  Package,
  ShoppingBag,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  ArrowRight,
  Calendar,
  XCircle,
  RotateCcw,
  CheckCircle2,
  Search,
  Filter,
} from 'lucide-react';
import { StatusBadge } from '../../components/ui/Badges';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { Button } from '../../components/ui/Button';

export const OrdersPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [cancellingIds, setCancellingIds] = useState(new Set());
  const [cancelTargetId, setCancelTargetId] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, [page, pageSize]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await ordersApi.getMyOrders(page, pageSize);
      const data = res.data?.data || res.data || [];
      const content = Array.isArray(data) ? data : data.content || [];

      const enriched = await Promise.all(
        content.map(async (order) => {
          try {
            const detailRes = await ordersApi.getOrderById(order.id);
            const detail = detailRes.data?.data || detailRes.data;
            if (detail && detail.items && detail.items.length > 0) {
              return {
                ...order,
                items: detail.items,
                productName: detail.items.map((i) => i.productName || 'Product').join(', '),
                productImageUrl: detail.items[0]?.productImageUrl,
              };
            }
          } catch {}
          return order;
        })
      );

      setOrders(enriched);
      setTotalPages(data.totalPages ?? 1);
      setTotalElements(data.totalElements ?? content.length);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login', { state: { from: { pathname: '/orders' } } });
      } else {
        setError('Unable to load your orders. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = (orderId, e) => {
    if (e) e.stopPropagation();
    setCancelTargetId(orderId);
  };

  const executeCancel = async (reason) => {
    if (!cancelTargetId) return;
    setCancelLoading(true);
    setCancellingIds((prev) => new Set(prev).add(cancelTargetId));
    try {
      await ordersApi.cancelOrder(cancelTargetId, reason || 'Customer requested cancellation');
      setOrders((prev) =>
        prev.map((o) => (o.id === cancelTargetId ? { ...o, status: 'CANCELLED' } : o))
      );
      setCancelTargetId(null);
      showToast('Order cancelled successfully.');
    } catch (err) {
      const msg = err.response?.data?.message || 'Cancellation failed. Please try again.';
      showToast(msg, 'error');
      setCancelTargetId(null);
    } finally {
      setCancelLoading(false);
      setCancellingIds((prev) => {
        const next = new Set(prev);
        next.delete(cancelTargetId);
        return next;
      });
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const filteredOrders = orders.filter((o) => {
    const matchesStatus =
      statusFilter === 'ALL' || (o.status || '').toUpperCase() === statusFilter;
    if (!matchesStatus) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const orderRef = (o.orderNumber || o.id || '').toLowerCase();
    const prodName = (o.productName || '').toLowerCase();
    return orderRef.includes(q) || prodName.includes(q);
  });

  if (loading && orders.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 space-y-4 animate-pulse">
        <div className="h-6 w-36 bg-slate-200 rounded" />
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="h-4 w-48 bg-slate-200 rounded" />
              <div className="h-16 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error && orders.length === 0) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 text-rose-500 mx-auto flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Failed to Load Orders</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">{error}</p>
        </div>
        <Button variant="secondary" size="sm" onClick={fetchOrders}>
          <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 space-y-4 pb-16">
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed top-5 right-5 z-50 px-4 py-2.5 rounded-xl shadow-lg text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 ${
            toast.type === 'error' ? 'bg-rose-600 text-white' : 'bg-slate-900 text-white'
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

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            My Orders
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {totalElements} {totalElements === 1 ? 'order' : 'orders'} placed in your account history
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID or product..."
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {['ALL', 'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 rounded font-bold uppercase tracking-wider text-[11px] whitespace-nowrap transition-all ${
              statusFilter === s
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-3 max-w-md mx-auto my-6">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mx-auto border border-indigo-100">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900">No Orders Found</h2>
            <p className="text-slate-500 text-xs">
              You haven't placed any purchases yet.
            </p>
          </div>
          <Link to="/products">
            <Button variant="primary" size="sm">
              Explore Products <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-2">
          <p className="text-xs font-bold text-slate-700">No orders match the current filter or search criteria.</p>
          <button
            type="button"
            onClick={() => {
              setStatusFilter('ALL');
              setSearchQuery('');
            }}
            className="text-xs font-bold text-indigo-600 hover:underline"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const isCancelling = cancellingIds.has(order.id);
            const orderRef = order.orderNumber || order.id || 'Order';
            const canCancel = ['PENDING', 'CONFIRMED'].includes(order.status?.toUpperCase());
            const orderItems = order.items || [];

            return (
              <div
                key={order.id}
                onClick={() => navigate(`/orders/${order.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(`/orders/${order.id}`);
                  }
                }}
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-3.5 sm:p-4 transition shadow-2xs hover:shadow-xs cursor-pointer group focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-xs text-slate-900 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                      #{orderRef}
                    </span>
                    <span className="text-slate-400 text-xs">•</span>
                    <span className="text-xs text-slate-500">
                      {formatDate(order.createdAt)}
                    </span>
                    <span className="text-slate-400 text-xs">•</span>
                    <StatusBadge status={order.status} size="xs" />
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-slate-900">
                      ₹{Number(order.grandTotal ?? 0).toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      ({order.itemCount || orderItems.length || 1} {order.itemCount === 1 ? 'item' : 'items'})
                    </span>
                  </div>
                </div>

                <div className="py-2.5 space-y-2">
                  {orderItems.length > 0 ? (
                    orderItems.map((item, idx) => (
                      <div key={item.id || idx} className="flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-10 h-10 rounded bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden p-0.5">
                            {item.productImageUrl ? (
                              <img
                                src={item.productImageUrl}
                                alt=""
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <Package className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 truncate group-hover:text-indigo-600 transition">
                              {item.productName || `Item #${item.listingId}`}
                            </p>
                            <span className="text-[11px] text-slate-500">
                              Qty: {item.quantity} × ₹{Number(item.unitPrice || 0).toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>

                        <span className="font-bold text-slate-800 text-xs shrink-0">
                          ₹{Number(item.lineTotal ?? (item.unitPrice * item.quantity)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Package className="w-4 h-4 text-slate-400" />
                      <span>{order.productName || 'Order Items'}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <div className="text-[11px] text-slate-400">
                    Payment Status: <span className="font-semibold text-slate-600">{order.paymentStatus || 'PENDING'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {canCancel && (
                      <button
                        type="button"
                        onClick={(e) => handleCancel(order.id, e)}
                        disabled={isCancelling}
                        className="px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:text-rose-800 hover:bg-rose-50 border border-rose-200 rounded transition"
                      >
                        {isCancelling ? 'Cancelling...' : 'Cancel Order'}
                      </button>
                    )}

                    <span className="inline-flex items-center gap-1 font-bold text-indigo-600 group-hover:text-indigo-800 text-xs">
                      <span>View Details</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-3 border-t border-slate-200 text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(0);
              }}
              className="bg-white border border-slate-300 rounded px-2 py-1 text-xs outline-none"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span>per page</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-[11px]">
              Page {page + 1} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page === 0 || loading}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="p-1 border border-slate-200 rounded bg-white hover:bg-slate-50 disabled:opacity-40 transition"
              aria-label="Previous Page"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <button
              type="button"
              disabled={page >= totalPages - 1 || loading}
              onClick={() => setPage((p) => p + 1)}
              className="p-1 border border-slate-200 rounded bg-white hover:bg-slate-50 disabled:opacity-40 transition"
              aria-label="Next Page"
            >
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(cancelTargetId)}
        onClose={() => setCancelTargetId(null)}
        onConfirm={executeCancel}
        title="Cancel This Order?"
        message="Are you sure you want to cancel this order? Reserved stock will be restored to merchants."
        confirmText="Confirm Cancellation"
        cancelText="Keep Order"
        variant="danger"
        isLoading={cancelLoading}
        showInput={true}
        defaultValue="Customer requested cancellation"
        inputPlaceholder="Reason for cancellation..."
      />
    </div>
  );
};

export default OrdersPage;
