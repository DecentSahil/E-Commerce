import React from 'react';

const variantStyles = {
  primary:
    'bg-indigo-600 text-white shadow-sm shadow-indigo-200 hover:bg-indigo-700 active:bg-indigo-800 hover:-translate-y-0.5 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:shadow-none disabled:translate-y-0',
  secondary:
    'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 focus:ring-slate-400 shadow-2xs',
  outline:
    'bg-transparent text-indigo-600 border border-indigo-300 hover:bg-indigo-50/70 focus:ring-indigo-400',
  ghost:
    'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 focus:ring-slate-300',
  danger:
    'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-sm shadow-rose-200 focus:ring-rose-500 disabled:bg-rose-300 disabled:shadow-none',
  warning:
    'bg-amber-600 text-white hover:bg-amber-700 active:bg-amber-800 shadow-sm shadow-amber-200 focus:ring-amber-500 disabled:bg-amber-300 disabled:shadow-none',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2.5 text-xs sm:text-sm rounded-xl',
  lg: 'px-6 py-3 text-sm sm:text-base rounded-xl font-bold',
};

export const Button = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  children,
  className = '',
  disabled,
  type = 'button',
  ...rest
}) => {
  return (
    <button
      type={type}
      {...rest}
      disabled={disabled || isLoading}
      className={`
        inline-flex items-center justify-center gap-2 font-bold
        transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 select-none
        ${variantStyles[variant] || variantStyles.primary}
        ${sizeStyles[size] || sizeStyles.md}
        ${fullWidth ? 'w-full' : ''}
        ${disabled || isLoading ? 'cursor-not-allowed opacity-60' : ''}
        ${className}
      `}
    >
      {isLoading && (
        <svg
          className="h-4 w-4 animate-spin shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
};

export default Button;
