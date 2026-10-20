import React from 'react';
import { CheckCircle2, Clock, AlertCircle, History, ArrowRight } from 'lucide-react';
import { StatusBadge } from '../ui/Badges';

export const OrderTrackingCard = ({
  order = {},
  statusHistory = [],
  className = '',
}) => {
  const currentStatus = (order.status || 'PENDING').toUpperCase();
  const isCancelled = currentStatus === 'CANCELLED';

  const formatStepDate = (dateStr) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('en-US', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return dateStr;
    }
  };

  const sortedHistory = Array.isArray(statusHistory)
    ? [...statusHistory].sort((a, b) => new Date(a.changedAt || 0) - new Date(b.changedAt || 0))
    : [];

  const cancelledEntry = sortedHistory.find((h) => h.toStatus === 'CANCELLED');

  return (
    <div className={`bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-2xs space-y-4 ${className}`}>
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-indigo-600" />
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
            Order Status & History
          </h2>
        </div>
        <StatusBadge status={currentStatus} size="xs" />
      </div>

      {isCancelled && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-xs text-rose-800">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <h4 className="font-bold text-rose-900">Order Cancelled</h4>
            <p className="text-[11px] leading-relaxed">
              {cancelledEntry?.reason ||
                order.cancellationReason ||
                'This order was cancelled and reserved stock was returned to sellers.'}
            </p>
            {(cancelledEntry?.changedAt || order.cancelledAt) && (
              <span className="text-[10px] text-rose-600 font-mono block pt-0.5">
                Cancelled on {formatStepDate(cancelledEntry?.changedAt || order.cancelledAt)}
              </span>
            )}
          </div>
        </div>
      )}

      {sortedHistory.length > 0 ? (
        <div className="pt-1 pl-2">
          <div className="space-y-4 relative">
            {sortedHistory.map((step, idx) => {
              const isLast = idx === sortedHistory.length - 1;
              const isCancelledStep = step.toStatus === 'CANCELLED';

              return (
                <div key={step.id || idx} className="flex items-start gap-3.5 relative">
                  {!isLast && (
                    <div className="absolute left-[7px] top-[14px] bottom-[-16px] w-[2px] bg-slate-200" />
                  )}

                  <div className="relative pt-0.5 z-10 shrink-0">
                    {isCancelledStep ? (
                      <div className="w-3.5 h-3.5 rounded-full bg-rose-600" />
                    ) : isLast ? (
                      <div className="w-3.5 h-3.5 rounded-full bg-indigo-600 ring-4 ring-indigo-100" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full bg-emerald-600" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="inline-flex items-center gap-1 text-xs font-bold text-slate-800">
                        {step.fromStatus ? (
                          <>
                            <span className="text-slate-500 font-semibold">{step.fromStatus}</span>
                            <ArrowRight className="w-3 h-3 text-slate-400" />
                            <span>{step.toStatus}</span>
                          </>
                        ) : (
                          <span>{step.toStatus}</span>
                        )}
                      </div>

                      {step.changedAt && (
                        <span className="text-[11px] text-slate-400 font-mono">
                          {formatStepDate(step.changedAt)}
                        </span>
                      )}
                    </div>

                    {step.reason && (
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed bg-slate-50 px-2.5 py-1 rounded border border-slate-100 inline-block">
                        {step.reason}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-600 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Placed on {formatStepDate(order.createdAt)}</span>
          </div>
          <p className="text-[11px] text-slate-500">
            No subsequent status transitions have been recorded yet by sellers or marketplace operators.
          </p>
        </div>
      )}
    </div>
  );
};

export default OrderTrackingCard;
