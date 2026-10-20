import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  Check,
  CheckCheck,
  Inbox,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Package,
  PackageCheck,
  ShoppingBag,
  RotateCcw,
  AlertCircle,
  Sparkles,
  Clock,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { notificationsApi } from '../../api/notifications';

export const NotificationsPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchUnreadCount = useCallback(async () => {
    try {
      const { data } = await notificationsApi.getUnreadCount();
      const count = Number(data?.unreadCount ?? data?.count ?? 0);
      setUnreadCount(count);
    } catch {}
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await notificationsApi.getNotifications({
        unreadOnly,
        page,
        size: pageSize,
      });

      const items = data?.content || (Array.isArray(data) ? data : []);
      setNotifications(items);
      setTotalPages(data?.totalPages || 1);
      setTotalElements(data?.totalElements || items.length);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load notifications. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [unreadOnly, page, pageSize]);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  useEffect(() => {
    const handleSync = () => {
      fetchNotifications();
      fetchUnreadCount();
    };
    window.addEventListener('notifications:updated', handleSync);
    window.addEventListener('focus', handleSync);
    return () => {
      window.removeEventListener('notifications:updated', handleSync);
      window.removeEventListener('focus', handleSync);
    };
  }, [fetchNotifications, fetchUnreadCount]);

  const notifySync = () => {
    window.dispatchEvent(new CustomEvent('notifications:updated'));
  };

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      showToast('Notification marked as read');
      notifySync();
    } catch {
      showToast('Failed to update notification', 'error');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      showToast('All notifications marked as read');
      notifySync();
    } catch {
      showToast('Failed to mark all as read', 'error');
    }
  };

  const handleNotificationClick = async (notif) => {
    const isRead = Boolean(notif.isRead);
    if (!isRead) {
      handleMarkAsRead(notif.id);
    }

    if (notif.referenceId && (notif.notificationType?.startsWith('ORDER_') || notif.referenceId.length > 5)) {
      navigate(`/orders/${notif.referenceId}`);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'ORDER_CREATED':
        return <ShoppingBag className="w-4 h-4 text-indigo-600" />;
      case 'ORDER_CONFIRMED':
        return <CheckCircle2 className="w-4 h-4 text-blue-600" />;
      case 'ORDER_STATUS_CHANGED':
        return <Clock className="w-4 h-4 text-purple-600" />;
      case 'ORDER_DELIVERED':
        return <PackageCheck className="w-4 h-4 text-emerald-600" />;
      case 'ORDER_CANCELLED':
        return <AlertCircle className="w-4 h-4 text-rose-600" />;
      case 'ORDER_REFUNDED':
        return <RotateCcw className="w-4 h-4 text-amber-600" />;
      case 'OTP':
        return <ShieldCheck className="w-4 h-4 text-indigo-600" />;
      case 'WELCOME':
        return <Sparkles className="w-4 h-4 text-amber-500" />;
      default:
        return <Package className="w-4 h-4 text-slate-500" />;
    }
  };

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 space-y-4 pb-16">
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
            to="/"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition border border-slate-200"
            title="Return to home"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Bell className="w-5 h-5 text-indigo-600" /> Notifications
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Account updates and order fulfillment milestones
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition flex items-center gap-1.5 self-start sm:self-auto shadow-2xs"
          >
            <CheckCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>Mark all as read</span>
          </button>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="inline-flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setUnreadOnly(false);
              setPage(0);
            }}
            className={`px-3 py-1 rounded-md transition ${
              !unreadOnly
                ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All {!unreadOnly && <span className="ml-1 text-[11px] font-normal">({totalElements})</span>}
          </button>
          <button
            type="button"
            onClick={() => {
              setUnreadOnly(true);
              setPage(0);
            }}
            className={`px-3 py-1 rounded-md transition ${
              unreadOnly
                ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Unread {unreadCount > 0 && <span className="ml-1 text-[11px] font-bold text-indigo-600">({unreadCount})</span>}
          </button>
        </div>

        {totalPages > 1 && (
          <span className="text-xs text-slate-500">
            Page {page + 1} of {totalPages}
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-2.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-white border border-slate-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <p className="text-xs font-bold text-slate-800">{error}</p>
          <button
            type="button"
            onClick={fetchNotifications}
            className="px-3.5 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition"
          >
            Retry
          </button>
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-2">
          <Inbox className="w-8 h-8 text-slate-300 mx-auto" />
          <h2 className="text-sm font-bold text-slate-800">
            {unreadOnly ? 'No unread notifications' : 'No notifications'}
          </h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {unreadOnly
              ? 'You have caught up with all notifications.'
              : 'Updates regarding your orders, items, and account will appear here.'}
          </p>
          {unreadOnly && (
            <button
              type="button"
              onClick={() => setUnreadOnly(false)}
              className="mt-2 text-xs font-bold text-indigo-600 hover:underline"
            >
              Show all notifications
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {notifications.map((notif) => {
            const isRead = Boolean(notif.isRead);
            const hasOrderLink = Boolean(
              notif.referenceId && (notif.notificationType?.startsWith('ORDER_') || notif.referenceId.length > 5)
            );

            return (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleNotificationClick(notif);
                  }
                }}
                className={`p-3.5 rounded-xl border transition flex items-start justify-between gap-3 text-left cursor-pointer group ${
                  isRead
                    ? 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    : 'bg-indigo-50/30 border-indigo-200 text-slate-900 shadow-2xs hover:bg-indigo-50/50'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border mt-0.5 ${
                      isRead ? 'bg-slate-50 border-slate-200' : 'bg-indigo-100 border-indigo-200'
                    }`}
                  >
                    {getNotificationIcon(notif.notificationType)}
                  </div>

                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2
                        className={`text-xs sm:text-sm ${
                          isRead ? 'font-semibold text-slate-800' : 'font-bold text-slate-900'
                        } group-hover:text-indigo-600 transition`}
                      >
                        {notif.title}
                      </h2>
                      {notif.notificationType && (
                        <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 text-[10px] font-mono">
                          {notif.notificationType}
                        </span>
                      )}
                      {!isRead && (
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0" />
                      )}
                    </div>

                    <p className="text-xs text-slate-600 leading-normal">
                      {notif.message}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1 flex-wrap">
                      {notif.createdAt && <span>{formatTimestamp(notif.createdAt)}</span>}
                      {hasOrderLink && (
                        <span className="text-indigo-600 font-bold inline-flex items-center gap-1 group-hover:underline">
                          <span>View Order</span>
                          <ExternalLink className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {!isRead && (
                  <button
                    type="button"
                    onClick={(e) => handleMarkAsRead(notif.id, e)}
                    className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-white rounded transition shrink-0"
                    title="Mark as read"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4 border-t border-slate-200 text-xs">
          <button
            type="button"
            disabled={page === 0 || loading}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="p-1.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-40 transition"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4 text-slate-600" />
          </button>
          <span className="text-xs font-semibold text-slate-600 px-2">
            Page {page + 1} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages - 1 || loading}
            onClick={() => setPage((p) => p + 1)}
            className="p-1.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-40 transition"
            aria-label="Next page"
          >
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
