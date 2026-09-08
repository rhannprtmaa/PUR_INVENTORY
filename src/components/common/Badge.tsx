import React from 'react';
import { StockStatus } from '../../types';

interface StockBadgeProps {
  status: StockStatus;
  size?: 'sm' | 'md';
}

export const StockBadge: React.FC<StockBadgeProps> = ({ status, size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs font-semibold' : 'px-2.5 py-1 text-xs font-bold';

  switch (status) {
    case 'Aman':
      return (
        <span
          id={`stock-badge-aman`}
          className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 ${sizeClasses}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Aman
        </span>
      );
    case 'Menipis':
      return (
        <span
          id={`stock-badge-menipis`}
          className={`inline-flex items-center gap-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/80 ${sizeClasses}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          Stok Menipis
        </span>
      );
    case 'Habis':
      return (
        <span
          id={`stock-badge-habis`}
          className={`inline-flex items-center gap-1.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200/80 ${sizeClasses}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
          Habis
        </span>
      );
    default:
      return null;
  }
};

export const TypeBadge: React.FC<{ type: 'IN' | 'OUT' }> = ({ type }) => {
  if (type === 'IN') {
    return (
      <span
        id="badge-type-in"
        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/70"
      >
        <span className="text-[10px]">↓</span> MASUK (IN)
      </span>
    );
  }
  return (
    <span
      id="badge-type-out"
      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200/70"
    >
      <span className="text-[10px]">↑</span> KELUAR (OUT)
    </span>
  );
};
