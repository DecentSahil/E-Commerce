import React from 'react';
import { Link } from 'react-router-dom';
import { PackageOpen } from 'lucide-react';

export const EmptyState = ({
  icon: Icon = PackageOpen,
  title = 'No items found',
  description = 'There are currently no records or items matching your criteria.',
  action = null,
  secondaryAction = null,
  className = '',
}) => {
  return (
    <div
      className={`bg-white border border-slate-200/90 rounded-3xl p-10 sm:p-14 text-center space-y-4 shadow-xs max-w-lg mx-auto ${className}`}
    >
      <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto border border-indigo-100 shadow-2xs">
        <Icon className="w-7 h-7 stroke-[1.8]" />
      </div>

      <div className="space-y-1.5">
        <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
          {title}
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
          {description}
        </p>
      </div>

      {(action || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
          {action && (
            action.to ? (
              <Link
                to={action.to}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs rounded-xl shadow-xs transition inline-flex items-center gap-1.5"
              >
                {action.icon && <action.icon className="w-3.5 h-3.5" />}
                <span>{action.label}</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={action.onClick}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs rounded-xl shadow-xs transition inline-flex items-center gap-1.5"
              >
                {action.icon && <action.icon className="w-3.5 h-3.5" />}
                <span>{action.label}</span>
              </button>
            )
          )}

          {secondaryAction && (
            secondaryAction.to ? (
              <Link
                to={secondaryAction.to}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition inline-flex items-center gap-1.5"
              >
                <span>{secondaryAction.label}</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={secondaryAction.onClick}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition inline-flex items-center gap-1.5"
              >
                <span>{secondaryAction.label}</span>
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
