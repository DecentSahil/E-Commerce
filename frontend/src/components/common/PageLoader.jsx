import React from 'react';

export const PageLoader = ({ type = 'page' }) => {
  if (type === 'table') {
    return (
      <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 space-y-4 animate-pulse">
        <div className="h-10 bg-slate-200/70 rounded-2xl w-48" />
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 space-y-3">
          <div className="h-9 bg-slate-100 rounded-xl w-full" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-slate-50 rounded-xl w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (type === 'cards') {
    return (
      <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200/70 rounded-2xl w-56" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3">
              <div className="w-full aspect-square bg-slate-100 rounded-xl" />
              <div className="h-4 bg-slate-100 rounded w-3/4" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
              <div className="h-5 bg-slate-100 rounded w-1/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-pulse">
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 space-y-3 shadow-2xs">
        <div className="h-4 bg-slate-100 rounded-full w-32" />
        <div className="h-8 bg-slate-200/80 rounded-2xl w-72" />
        <div className="h-3.5 bg-slate-100 rounded w-96 max-w-full" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-white border border-slate-200/80 rounded-3xl p-6 space-y-4 shadow-2xs">
          <div className="h-5 bg-slate-100 rounded-xl w-32" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-slate-50 rounded-xl w-full" />
            ))}
          </div>
        </div>

        <div className="md:col-span-2 bg-white border border-slate-200/80 rounded-3xl p-6 space-y-4 shadow-2xs">
          <div className="h-5 bg-slate-100 rounded-xl w-40" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-slate-50 rounded-2xl w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageLoader;
