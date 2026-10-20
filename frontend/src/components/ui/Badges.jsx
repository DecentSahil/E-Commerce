import React, { useState } from 'react';
import {
  Folder,
  Tag,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const CategoryBadge = ({ name, size = 'sm', className = '' }) => {
  if (!name) return null;

  const sizeClasses = {
    xs: 'px-2 py-0.5 text-[10px] gap-1',
    sm: 'px-2.5 py-1 text-xs gap-1.5',
    md: 'px-3 py-1.5 text-xs sm:text-sm gap-2',
  }[size] || 'px-2.5 py-1 text-xs gap-1.5';

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200/70 shadow-2xs transition-colors hover:bg-indigo-100/70 ${sizeClasses} ${className}`}
    >
      <Folder className={size === 'xs' ? 'w-3 h-3 text-indigo-500' : 'w-3.5 h-3.5 text-indigo-500'} />
      <span className="truncate max-w-[140px] sm:max-w-none">{name}</span>
    </span>
  );
};

export const BrandBadge = ({ name, size = 'sm', className = '' }) => {
  if (!name) return null;

  const sizeClasses = {
    xs: 'px-2 py-0.5 text-[10px] gap-1',
    sm: 'px-2.5 py-1 text-xs gap-1.5',
    md: 'px-3 py-1.5 text-xs sm:text-sm gap-2',
  }[size] || 'px-2.5 py-1 text-xs gap-1.5';

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-lg bg-slate-100 text-slate-700 border border-slate-200/80 shadow-2xs transition-colors hover:bg-slate-200/70 ${sizeClasses} ${className}`}
    >
      <Tag className={size === 'xs' ? 'w-3 h-3 text-slate-400' : 'w-3.5 h-3.5 text-slate-400'} />
      <span className="truncate max-w-[140px] sm:max-w-none">{name}</span>
    </span>
  );
};

export const StatusBadge = ({ status = 'ACTIVE', size = 'sm', className = '' }) => {
  const normalized = (status || 'ACTIVE').toUpperCase();

  const configs = {
    ACTIVE: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
      dot: 'bg-emerald-500',
      pulse: true,
      label: 'ACTIVE',
    },
    INACTIVE: {
      bg: 'bg-slate-100 text-slate-600 border-slate-200',
      dot: 'bg-slate-400',
      pulse: false,
      label: 'INACTIVE',
    },
    DRAFT: {
      bg: 'bg-amber-50 text-amber-700 border-amber-200/80',
      dot: 'bg-amber-500',
      pulse: false,
      label: 'DRAFT',
    },
    PENDING: {
      bg: 'bg-amber-50 text-amber-700 border-amber-200/80',
      dot: 'bg-amber-500',
      pulse: true,
      label: 'PENDING',
    },
    CONFIRMED: {
      bg: 'bg-blue-50 text-blue-700 border-blue-200/80',
      dot: 'bg-blue-500',
      pulse: false,
      label: 'CONFIRMED',
    },
    PROCESSING: {
      bg: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
      dot: 'bg-indigo-500',
      pulse: true,
      label: 'PROCESSING',
    },
    SHIPPED: {
      bg: 'bg-purple-50 text-purple-700 border-purple-200/80',
      dot: 'bg-purple-500',
      pulse: false,
      label: 'SHIPPED',
    },
    DELIVERED: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
      dot: 'bg-emerald-500',
      pulse: false,
      label: 'DELIVERED',
    },
    CANCELLED: {
      bg: 'bg-rose-50 text-rose-700 border-rose-200/80',
      dot: 'bg-rose-500',
      pulse: false,
      label: 'CANCELLED',
    },
    REFUNDED: {
      bg: 'bg-slate-100 text-slate-700 border-slate-200',
      dot: 'bg-slate-500',
      pulse: false,
      label: 'REFUNDED',
    },
    FAILED: {
      bg: 'bg-rose-50 text-rose-700 border-rose-200/80',
      dot: 'bg-rose-500',
      pulse: false,
      label: 'FAILED',
    },
    ARCHIVED: {
      bg: 'bg-rose-50 text-rose-700 border-rose-200/80',
      dot: 'bg-rose-500',
      pulse: false,
      label: 'ARCHIVED',
    },
  };

  const config = configs[normalized] || {
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
    pulse: false,
    label: normalized,
  };

  const sizeClasses = {
    xs: 'px-2 py-0.5 text-[10px] gap-1',
    sm: 'px-2.5 py-1 text-xs gap-1.5',
    md: 'px-3 py-1.5 text-xs sm:text-sm gap-2',
  }[size] || 'px-2.5 py-1 text-xs gap-1.5';

  return (
    <span
      className={`inline-flex items-center font-bold rounded-full border shadow-2xs uppercase tracking-wider ${config.bg} ${sizeClasses} ${className}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${config.dot} ${config.pulse ? 'animate-pulse' : ''
          }`}
      />
      {config.label}
    </span>
  );
};

export const SpecificationChips = ({
  specifications = [],
  initialLimit = 2,
  allowExpand = true,
  className = '',
}) => {
  const [expanded, setExpanded] = useState(false);

  if (!specifications || specifications.length === 0) {
    return (
      <span className="inline-flex items-center text-xs text-slate-400 italic">
        No specifications
      </span>
    );
  }

  const visibleSpecs = expanded ? specifications : specifications.slice(0, initialLimit);
  const remainingCount = specifications.length - initialLimit;

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {visibleSpecs.map((spec, idx) => (
        <span
          key={spec.id || idx}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100/80 border border-slate-200/90 text-[11px] text-slate-800 transition-colors shadow-2xs font-medium"
        >
          <span className="text-slate-500 font-bold">{spec.key}:</span>
          <span className="text-slate-900 font-semibold">{spec.value}</span>
        </span>
      ))}

      {allowExpand && remainingCount > 0 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold text-indigo-700 bg-indigo-50/90 hover:bg-indigo-100 border border-indigo-200/70 transition shadow-2xs"
          title={expanded ? 'Collapse specifications' : 'View all specifications'}
        >
          {expanded ? (
            <>
              Show less <ChevronUp className="w-3 h-3" />
            </>
          ) : (
            <>
              +{remainingCount} more <ChevronDown className="w-3 h-3" />
            </>
          )}
        </button>
      )}
    </div>
  );
};

export const ConditionBadge = ({ condition = 'NEW', size = 'sm', className = '' }) => {
  const configs = {
    NEW: { label: 'Brand New', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
    REFURBISHED: { label: 'Certified Refurbished', bg: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
    USED_LIKE_NEW: { label: 'Used - Like New', bg: 'bg-blue-50 text-blue-800 border-blue-200' },
    LIKE_NEW: { label: 'Like New', bg: 'bg-blue-50 text-blue-800 border-blue-200' },
    USED_GOOD: { label: 'Used - Good', bg: 'bg-amber-50 text-amber-800 border-amber-200' },
    GOOD: { label: 'Good', bg: 'bg-amber-50 text-amber-800 border-amber-200' },
    USED_FAIR: { label: 'Used - Fair', bg: 'bg-orange-50 text-orange-800 border-orange-200' },
    ACCEPTABLE: { label: 'Acceptable', bg: 'bg-orange-50 text-orange-800 border-orange-200' },
  };

  const config = configs[condition] || { label: condition?.replace(/_/g, ' ') || 'Standard', bg: 'bg-slate-100 text-slate-700 border-slate-200' };

  const sizeClasses = {
    xs: 'px-2 py-0.5 text-[10px]',
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1 text-xs sm:text-sm',
  }[size] || 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center font-extrabold rounded-full border shadow-2xs ${config.bg} ${sizeClasses} ${className}`}
    >
      {config.label}
    </span>
  );
};
