import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  Check,
  CheckCheck,
  ExternalLink,
  Inbox,
  Package,
  PackageCheck,
  ShoppingBag,
  RotateCcw,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { notificationsApi } from '../../api/notifications';
import { useAuth } from '../../context/AuthContext';

export const NotificationBell = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const { data } = await notificationsApi.getUnreadCount();
      const count = Number(data?.unreadCount ?? data?.count ?? 0);
      setUnreadCount(count);
    } catch {}
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }

    fetchUnreadCount();

    const handleSync = () => fetchUnreadCount();
    window.addEventListener('notifications:updated', handleSync);
    window.addEventListener('focus', handleSync);

    return () => {
      window.removeEventListener('notifications:updated', handleSync);
      window.removeEventListener('focus', handleSync);
    };
  }, [isAuthenticated, fetchUnreadCount]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleToggleDropdown = async () => {
    const nextState = !isOpen;
    setIsOpen(nextState);

    if (nextState && isAuthenticated) {
      setLoading(true);
      try {
        const { data } = await notificationsApi.getNotifications({ page: 0, size: 5 });
        const list = data?.content || (Array.isArray(data) ? data : []);
        setRecentNotifications(list);
      } catch {
        setRecentNotifications([]);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await notificationsApi.markAsRead(id);
      setRecentNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      window.dispatchEvent(new CustomEvent('notifications:updated'));
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setRecentNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      );
      setUnreadCount(0);
      window.dispatchEvent(new CustomEvent('notifications:updated'));
    } catch {}
  };

  const handleNotificationClick = async (notif) => {
    const isRead = Boolean(notif.isRead);
    if (!isRead) {
      handleMarkAsRead(notif.id);
    }
    setIsOpen(false);

    if (notif.referenceId && (notif.notificationType?.startsWith('ORDER_') || notif.referenceId.length > 5)) {
      navigate(`/orders/${notif.referenceId}`);
    } else {
      navigate('/notifications');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'ORDER_CREATED':
        return <ShoppingBag className="w-3.5 h-3.5 text-indigo-600" />;
      case 'ORDER_CONFIRMED':
        return <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />;
      case 'ORDER_STATUS_CHANGED':
        return <Clock className="w-3.5 h-3.5 text-purple-600" />;
      case 'ORDER_DELIVERED':
        return <PackageCheck className="w-3.5 h-3.5 text-emerald-600" />;
      case 'ORDER_CANCELLED':
        return <AlertCircle className="w-3.5 h-3.5 text-rose-600" />;
      case 'ORDER_REFUNDED':
        return <RotateCcw className="w-3.5 h-3.5 text-amber-600" />;
      case 'OTP':
        return <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />;
      case 'WELCOME':
        return <Sparkles className="w-3.5 h-3.5 text-amber-500" />;
      default:
        return <Package className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={handleToggleDropdown}
        className="relative w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-slate-700 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-500"
        title="Notifications"
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <Bell className="w-4 h-4 stroke-[2]" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-indigo-600 text-white text-[9px] font-black rounded-full min-w-3.5 h-3.5 px-0.5 flex items-center justify-center ring-1 ring-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-x-3 top-14 sm:inset-x-auto sm:absolute sm:right-0 sm:top-full sm:mt-1.5 w-auto sm:w-84 max-w-sm bg-white rounded-xl z-50 overflow-hidden shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3.5 py-2.5 bg-slate-900 text-white flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px]">
              <Bell className="w-3.5 h-3.5 text-indigo-400" />
              <span>Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-indigo-600 text-[10px] font-bold">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] text-indigo-300 hover:text-white flex items-center gap-1 font-semibold transition"
              >
                <CheckCheck className="w-3 h-3" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="p-3 space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : recentNotifications.length === 0 ? (
              <div className="py-8 px-4 text-center space-y-1">
                <Inbox className="w-6 h-6 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-700">No notifications</p>
                <p className="text-[11px] text-slate-400">Order updates and account alerts will appear here</p>
              </div>
            ) : (
              recentNotifications.map((notif) => {
                const isRead = Boolean(notif.isRead);
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
                    className={`p-3 text-left transition flex items-start gap-2.5 cursor-pointer group ${
                      isRead ? 'bg-white hover:bg-slate-50' : 'bg-indigo-50/40 hover:bg-indigo-50/70'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border mt-0.5 ${
                        isRead ? 'bg-slate-50 border-slate-200' : 'bg-indigo-100 border-indigo-200'
                      }`}
                    >
                      {getNotificationIcon(notif.notificationType)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p
                          className={`text-xs truncate ${
                            isRead ? 'font-semibold text-slate-700' : 'font-bold text-slate-900'
                          } group-hover:text-indigo-600 transition`}
                        >
                          {notif.title}
                        </p>
                        {!isRead && (
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0" />
                        )}
                      </div>

                      <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5 leading-snug">
                        {notif.message}
                      </p>

                      <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                        {notif.createdAt && <span>{formatTimestamp(notif.createdAt)}</span>}
                        {notif.referenceId && (
                          <span className="text-indigo-600 font-semibold group-hover:underline">
                            View Order
                          </span>
                        )}
                      </div>
                    </div>

                    {!isRead && (
                      <button
                        type="button"
                        onClick={(e) => handleMarkAsRead(notif.id, e)}
                        className="p-1 hover:bg-white rounded text-slate-400 hover:text-indigo-600 transition shrink-0"
                        title="Mark as read"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
            <Link
              to="/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 transition"
            >
              <span>View All Notifications</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
