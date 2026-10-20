import React, { useEffect, useState, useRef } from 'react';
import { AlertTriangle, Info, Trash2, X, AlertCircle } from 'lucide-react';

export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'Please confirm this action.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
  showInput = false,
  inputPlaceholder = 'Enter reason or details...',
  defaultValue = '',
}) => {
  const [inputValue, setInputValue] = useState(defaultValue);
  const confirmBtnRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setInputValue(defaultValue);
      setTimeout(() => {
        if (showInput && textareaRef.current) {
          textareaRef.current.focus();
        } else if (confirmBtnRef.current) {
          confirmBtnRef.current.focus();
        }
      }, 50);
    }
  }, [isOpen, defaultValue, showInput]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (showInput) {
      onConfirm(inputValue);
    } else {
      onConfirm();
    }
  };

  const isDestructive = variant === 'danger' || variant === 'destructive';

  const getIcon = () => {
    if (isDestructive) {
      return (
        <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
          <Trash2 className="w-5 h-5" />
        </div>
      );
    }
    if (variant === 'warning') {
      return (
        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
          <AlertTriangle className="w-5 h-5" />
        </div>
      );
    }
    return (
      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
        <Info className="w-5 h-5" />
      </div>
    );
  };

  const getConfirmBtnClasses = () => {
    if (isDestructive) {
      return 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-xs focus-visible:ring-rose-500';
    }
    if (variant === 'warning') {
      return 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white shadow-xs focus-visible:ring-amber-500';
    }
    return 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-xs focus-visible:ring-indigo-500';
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-hidden animate-in fade-in duration-150"
      onClick={() => {
        if (!isLoading) onClose();
      }}
    >
      <div
        className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-desc"
      >
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            {getIcon()}
            <div>
              <h3 id="confirm-modal-title" className="text-base font-extrabold text-slate-900">
                {title}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Please confirm to proceed</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition disabled:opacity-50"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          <p id="confirm-modal-desc" className="text-slate-600 text-sm leading-relaxed">
            {message}
          </p>

          {showInput && (
            <div className="space-y-1.5 pt-1">
              <label className="font-bold text-slate-700 block text-xs">
                Reason / Details <span className="text-rose-500">*</span>
              </label>
              <textarea
                ref={textareaRef}
                rows={3}
                required
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={inputPlaceholder}
                className="w-full p-3 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 font-medium placeholder:text-slate-400"
              />
            </div>
          )}
        </div>

        <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-end gap-2.5 bg-slate-50/80 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl font-bold text-xs text-slate-700 transition shadow-xs disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            onClick={handleConfirm}
            disabled={isLoading || (showInput && !inputValue.trim())}
            className={`px-5 py-2 rounded-xl font-bold text-xs transition disabled:opacity-50 flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${getConfirmBtnClasses()}`}
          >
            {isLoading && (
              <svg
                className="h-3.5 w-3.5 animate-spin shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                aria-hidden="true"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
            )}
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;

