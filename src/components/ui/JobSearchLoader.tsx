import React from 'react';
import { motion } from 'motion/react';

export const JobSearchLoader: React.FC<{ message?: string }> = ({ message = 'Searching global opportunities...' }) => (
  <div className="flex flex-col items-center justify-center py-16 space-y-6">
    <div className="relative w-20 h-20">
      <motion.div
        className="absolute inset-0 rounded-full border-4 border-slate-200"
        style={{ borderTopColor: '#10b981' }}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute inset-2 rounded-full border-4 border-slate-100"
        style={{ borderBottomColor: '#3b82f6' }}
        animate={{ rotate: -360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute inset-4 rounded-full border-4 border-slate-50"
        style={{ borderLeftColor: '#8b5cf6' }}
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      />
    </div>
    <div className="text-center space-y-2">
      <motion.p
        className="text-sm font-medium text-slate-700"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {message}
      </motion.p>
      <div className="flex items-center justify-center space-x-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-emerald-500"
            animate={{ y: [0, -8, 0], opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </div>
  </div>
);

export const SkeletonJobCard: React.FC = () => (
  <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 space-y-4 animate-pulse">
    <div className="flex items-start space-x-3">
      <div className="w-12 h-12 rounded-xl bg-slate-200" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-slate-200 rounded-full w-3/4" />
        <div className="h-3 bg-slate-200 rounded-full w-1/2" />
      </div>
    </div>
    <div className="space-y-2">
      <div className="h-3 bg-slate-200 rounded-full w-full" />
      <div className="h-3 bg-slate-200 rounded-full w-5/6" />
    </div>
    <div className="flex flex-wrap gap-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-6 w-16 bg-slate-200 rounded-full" />
      ))}
    </div>
    <div className="flex items-center justify-between pt-2">
      <div className="h-4 bg-slate-200 rounded-full w-24" />
      <div className="h-8 w-20 bg-slate-200 rounded-lg" />
    </div>
  </div>
);

export const SkeletonJobGrid: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonJobCard key={i} />
    ))}
  </div>
);
