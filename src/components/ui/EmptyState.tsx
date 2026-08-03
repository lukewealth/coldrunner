import React from 'react';
import { Search, Inbox, FileX, Database, type LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  variant?: 'default' | 'compact';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  action,
  variant = 'default',
}) => {
  if (variant === 'compact') {
    return (
      <div className="flex items-center justify-center py-8 text-center">
        <div className="space-y-2">
          <Icon className="w-6 h-6 text-slate-300 mx-auto" />
          <p className="text-xs text-slate-400">{title}</p>
          {action}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-slate-300" />
      </div>
      <h3 className="text-sm font-bold text-slate-700 mb-1">{title}</h3>
      {description && (
        <p className="text-xs text-slate-400 max-w-sm leading-relaxed mb-4">{description}</p>
      )}
      {action}
    </div>
  );
};
