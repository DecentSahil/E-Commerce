import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ordersApi } from '../../api/orders';
import {
  ArrowLeft,
  Package,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Store,
  FileText,
  RotateCcw,
  Calendar,
  CreditCard,
} from 'lucide-react';
import { StatusBadge } from '../../components/ui/Badges';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { Button } from '../../components/ui/Button';
import { OrderTrackingCard } from '../../components/orders/OrderTrackingCard';

export const OrderDetailPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [statusHistory, setStatusHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchOrderAndHistory();
  }, [orderId]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchOrderAndHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const [orderRes, historyRes] = await Promise.all([
        ordersApi.getOrderById(orderId),
        ordersApi.getOrderHistory(orderId).catch(() => ({ data: [] })),
      ]);

      const orderData = orderRes.data?.data || orderRes.data;
      setOrder(orderData);

      const historyData = historyRes.data?.data || historyRes.data || [];
      setStatusHistory(Array.isArray(historyData) ? historyData : []);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login', { state: { from: { pathname: `/orders/${orderId}` } } });
      } else if (err.response?.status === 404) {
        setError('Order not found. The specified order reference does not exist or does not belong to your account.');
      } else {
        setError('Unable to load order details. Please verify your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubmit = async (reason) => {
    setCancelling(true);
    try {
      const res = await ordersApi.cancelOrder(orderId, reason || 'Customer requested cancellation');
      const updated = res.data?.data || res.data;
      setOrder((prev) => ({ ...prev, ...updated, status: 'CANCELLED' }));
      setCancelModalOpen(false);
      showToast('Order cancelled successfully.');

      const hist = await ordersApi.getOrderHistory(orderId).catch(() => ({ data: [] }));
      const histData = hist.data?.data || hist.data || [];
      setStatusHistory(Array.isArray(histData) ? histData : []);
    } catch (err) {
      showToast(err.response?.data?.message || 'Cancellation failed. Please try again.', 'error');
    } finally {
      setCancelling(false);
    }
  };

  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleString('en-US', {
          dateStyle: 'medium',
          timeStyle: 'short',
        })
      : '—';

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 space-y-4 animate-pulse">
        <div className="h-6 w-48 bg-slate-200 rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8 space-y-4">
            <div className="h-32 bg-white border border-slate-200 rounded-xl" />
            <div className="h-56 bg-white border border-slate-200 rounded-xl" />
          </div>
          <div className="lg:col-span-4 space-y-4">
            <div className="h-40 bg-white border border-slate-200 rounded-xl" />
            <div className="h-48 bg-white border border-slate-200 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 text-rose-500 mx-auto flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Order Details Error</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">{error || 'Order not found'}</p>
        </div>
        <div className="flex items-center justify-center gap-2.5">
          <Button variant="secondary" size="sm" onClick={fetchOrderAndHistory}>
            <RotateCcw className="w-3.5 h-3.5 mr-1" /> Retry
          </Button>
          <Link to="/orders">
            <Button variant="primary" size="sm">
              <ArrowLeft className="w-3.5 h-3.5 mr-1" /> My Orders
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const status = (order.status || 'PENDING').toUpperCase();
  const canCancel = ['PENDING', 'CONFIRMED'].includes(status);
  const addr = order.shippingAddress || {};
  const orderRef = order.orderNumber || order.id || 'Order';
  const items = order.items || [];

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
        <div className="flex items-center gap-2.5">
          <Link
            to="/orders"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition border border-slate-200"
            title="Back to Orders"
            aria-label="Back to Orders"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Order #{orderRef}
              </h1>
              <StatusBadge status={order.status} size="xs" />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Placed on {formatDate(order.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {canCancel && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCancelModalOpen(true)}
              className="text-rose-600 hover:text-rose-800 hover:bg-rose-50 border-rose-200"
            >
              Cancel Order
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        <div className="lg:col-span-8 space-y-4">
          <OrderTrackingCard order={order} statusHistory={statusHistory} />

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2 pb-2.5 border-b border-slate-100">
              <Package className="w-4 h-4 text-indigo-600" />
              Items in this Order ({items.length})
            </h2>

            <div className="divide-y divide-slate-100">
              {items.map((item, idx) => (
                <div key={item.id || idx} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden p-1">
                      {item.productImageUrl ? (
                        <img
                          src={item.productImageUrl}
                          alt=""
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <Package className="w-5 h-5 text-slate-400" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <Link
                        to={`/products/${item.productId}`}
                        className="font-bold text-slate-800 hover:text-indigo-600 transition truncate block"
                      >
                        {item.productName || `Product #${item.productId?.slice(0, 8)}`}
                      </Link>

                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 flex-wrap">
                        <span>Qty: {item.quantity}</span>
                        <span>•</span>
                        <span>₹{Number(item.unitPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })} each</span>
                        {item.sellerId && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-indigo-600 bg-indigo-50 px-1 rounded text-[10px]">
                              Seller #{item.sellerId.slice(0, 8)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-black text-slate-900 text-xs sm:text-sm block">
                      ₹{Number(item.lineTotal ?? (item.unitPrice * item.quantity)).toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-2.5">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <MapPin className="w-3.5 h-3.5 text-indigo-600" /> Shipping Address
            </h3>

            <div className="text-xs text-slate-600 space-y-1 leading-relaxed">
              <p className="font-bold text-slate-900">
                {addr.fullName || 'Customer'}
              </p>
              {addr.phone && (
                <p className="text-slate-500 font-medium">Contact: {addr.phone}</p>
              )}
              <p>{addr.line1}</p>
              {addr.line2 && <p>{addr.line2}</p>}
              <p>
                {addr.city}, {addr.state} - {addr.postalCode}
              </p>
              <p className="font-mono text-[11px] text-slate-500 uppercase">{addr.countryCode || 'IN'}</p>
            </div>
          </div>

          {order.customerNote && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-1.5">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                <FileText className="w-3.5 h-3.5 text-indigo-600" /> Customer Note
              </h3>
              <p className="text-xs text-slate-600 italic leading-relaxed">
                "{order.customerNote}"
              </p>
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-100">
              Payment & Price Details
            </h3>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between items-center">
                <span>Items Subtotal</span>
                <span className="font-bold text-slate-800">
                  ₹{Number(order.subtotal ?? order.grandTotal).toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>

              {order.discountTotal != null && Number(order.discountTotal) > 0 && (
                <div className="flex justify-between items-center text-emerald-600 font-bold">
                  <span>Promotional Discount</span>
                  <span>
                    −₹{Number(order.discountTotal).toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span>Delivery Charges</span>
                <span className="text-slate-700 font-medium text-[11px]">
                  {Number(order.shippingCost || 0) === 0
                    ? 'No added fee'
                    : `₹${Number(order.shippingCost).toFixed(2)}`}
                </span>
              </div>

              {order.taxTotal != null && Number(order.taxTotal) > 0 && (
                <div className="flex justify-between items-center">
                  <span>Taxes</span>
                  <span className="font-bold text-slate-800">
                    ₹{Number(order.taxTotal).toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              )}

              <div className="border-t border-dashed border-slate-200 pt-2.5 flex justify-between items-baseline font-black text-slate-900">
                <span className="text-xs">Grand Total</span>
                <span className="text-indigo-600 text-base tracking-tight">
                  ₹{Number(order.grandTotal ?? 0).toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Payment Status:</span>
                <span className="font-bold text-slate-800 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                  {order.paymentStatus || 'PENDING'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={handleCancelSubmit}
        title="Cancel This Order?"
        message="Cancelling this order will release the reserved inventory back to independent sellers. Please specify a cancellation reason:"
        confirmText="Confirm Cancellation"
        cancelText="Keep Order"
        variant="danger"
        isLoading={cancelling}
        showInput={true}
        defaultValue="Customer requested cancellation"
        inputPlaceholder="Reason for cancellation..."
      />
    </div>
  );
};

export default OrderDetailPage;
