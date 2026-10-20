import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export const FormInput = ({
  id,
  label,
  type = 'text',
  placeholder,
  error,
  registration,
  autoComplete,
  className = '',
  disabled = false,
  required = false,
  hint,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const effectiveType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-xs sm:text-sm font-bold text-slate-700 flex items-center justify-between">
          <span>
            {label} {required && <span className="text-rose-500">*</span>}
          </span>
          {hint && <span className="text-[11px] text-slate-400 font-normal">{hint}</span>}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          type={effectiveType}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          {...registration}
          className={`w-full rounded-xl border px-3.5 py-2.5 sm:py-3 text-xs sm:text-sm outline-none transition-all placeholder:text-slate-400 font-medium
            focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500
            ${isPassword ? 'pr-10' : ''}
            ${error ? 'border-rose-400 bg-rose-50/50 text-rose-900 focus:ring-rose-100' : 'border-slate-200 bg-slate-50/70 hover:border-slate-300 focus:bg-white text-slate-900'}
            ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100' : ''}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition p-1"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
    </div>
  );
};

export default FormInput;
