import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'text',
  width,
  height,
  lines = 1,
}) => {
  const baseClasses = 'bg-slate-200 animate-shimmer rounded-md';

  if (variant === 'card') {
    return (
      <div className={`rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 space-y-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="space-y-2 flex-1">
            <div className={`h-3 ${baseClasses} rounded-full w-24`} />
            <div className={`h-3 ${baseClasses} rounded-full w-36`} />
          </div>
          <div className={`w-10 h-10 ${baseClasses} rounded-xl`} />
        </div>
        <div className={`h-8 ${baseClasses} rounded-lg w-20`} />
        <div className={`h-3 ${baseClasses} rounded-full w-full`} />
      </div>
    );
  }

  if (variant === 'circular') {
    return (
      <div
        className={`${baseClasses} rounded-full ${className}`}
        style={{ width: width || 40, height: height || width || 40 }}
      />
    );
  }

  if (variant === 'rectangular') {
    return (
      <div
        className={`${baseClasses} ${className}`}
        style={{ width: width || '100%', height: height || 120 }}
      />
    );
  }

  if (lines > 1) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`h-3 ${baseClasses} rounded-full`}
            style={{ width: i === lines - 1 ? '60%' : '100%' }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${baseClasses} h-4 ${className}`}
      style={{ width: width || '100%', height: height || undefined }}
    />
  );
};

export const SkeletonTable: React.FC<{ rows?: number; cols?: number }> = ({ rows = 5, cols = 6 }) => (
  <div className="rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
    <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex gap-4">
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className="h-3 bg-slate-200 animate-shimmer rounded-full flex-1" />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, rowIdx) => (
      <div key={rowIdx} className="px-4 py-4 border-b border-slate-100 flex gap-4 items-center">
        {Array.from({ length: cols }).map((_, colIdx) => (
          <div
            key={colIdx}
            className="h-3 bg-slate-200 animate-shimmer rounded-full flex-1"
            style={{ animationDelay: `${(rowIdx * cols + colIdx) * 50}ms` }}
          />
        ))}
      </div>
    ))}
  </div>
);

export const SkeletonCard: React.FC = () => <Skeleton variant="card" />;

export const SkeletonDashboard: React.FC = () => (
  <div className="space-y-8 pb-12">
    <div className="rounded-3xl bg-white p-6 border border-slate-200 shadow-sm space-y-4">
      <Skeleton lines={2} />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-10 bg-slate-200 animate-shimmer rounded-xl" style={{ animationDelay: `${i * 80}ms` }} />
        ))}
      </div>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
    <Skeleton variant="rectangular" height={320} className="rounded-3xl" />
    <SkeletonTable rows={6} cols={6} />
  </div>
);
