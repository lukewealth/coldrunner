import React from 'react';
import clsx from 'clsx';

interface HeroStarProps {
  filled?: 'full' | 'half' | 'empty';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'amber' | 'emerald' | 'orange' | 'slate' | 'blue';
  className?: string;
  animated?: boolean;
}

const sizeMap = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
};

const colorMap = {
  amber: { filled: '#F59E0B', stroke: '#D97706' },
  emerald: { filled: '#10B981', stroke: '#059669' },
  orange: { filled: '#F97316', stroke: '#EA580C' },
  slate: { filled: '#94A3B8', stroke: '#64748B' },
  blue: { filled: '#3B82F6', stroke: '#2563EB' },
};

export const HeroStar: React.FC<HeroStarProps> = ({
  filled = 'full',
  size = 'md',
  color = 'amber',
  className,
  animated = false,
}) => {
  const colors = colorMap[color];
  const cls = sizeMap[size];

  return (
    <svg
      className={clsx(cls, className, animated && 'animate-pulse')}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={`star-grad-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={colors.filled} stopOpacity="1" />
          <stop offset="100%" stopColor={colors.stroke} stopOpacity="0.85" />
        </linearGradient>
        <clipPath id="half-clip">
          <rect x="0" y="0" width="12" height="24" />
        </clipPath>
      </defs>
      {filled === 'full' && (
        <path
          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
          fill={`url(#star-grad-${color})`}
          stroke={colors.stroke}
          strokeWidth="1"
          strokeLinejoin="round"
        />
      )}
      {filled === 'half' && (
        <>
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            fill="#E2E8F0"
            stroke={colors.stroke}
            strokeWidth="1"
            strokeLinejoin="round"
          />
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            fill={`url(#star-grad-${color})`}
            clipPath="url(#half-clip)"
          />
        </>
      )}
      {filled === 'empty' && (
        <path
          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
          fill="#E2E8F0"
          stroke={colors.stroke}
          strokeWidth="1"
          strokeLinejoin="round"
          opacity="0.5"
        />
      )}
    </svg>
  );
};

interface HeroStarRatingProps {
  rating: number;
  maxStars?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'amber' | 'emerald' | 'orange' | 'slate' | 'blue';
  showValue?: boolean;
  showCount?: boolean;
  reviewCount?: number;
  className?: string;
}

export const HeroStarRating: React.FC<HeroStarRatingProps> = ({
  rating,
  maxStars = 5,
  size = 'sm',
  color = 'amber',
  showValue = true,
  showCount = false,
  reviewCount,
  className,
}) => {
  const stars = [];
  for (let i = 1; i <= maxStars; i++) {
    if (i <= Math.floor(rating)) {
      stars.push(<HeroStar key={i} filled="full" size={size} color={color} />);
    } else if (i === Math.ceil(rating) && rating % 1 !== 0) {
      stars.push(<HeroStar key={i} filled="half" size={size} color={color} />);
    } else {
      stars.push(<HeroStar key={i} filled="empty" size={size} color={color} />);
    }
  }

  return (
    <div className={clsx('flex items-center gap-1', className)}>
      <div className="flex items-center">{stars}</div>
      {showValue && (
        <span className={clsx(
          'font-bold',
          size === 'xs' && 'text-[10px]',
          size === 'sm' && 'text-xs',
          size === 'md' && 'text-sm',
          size === 'lg' && 'text-base',
          size === 'xl' && 'text-lg',
          color === 'amber' && 'text-amber-600',
          color === 'emerald' && 'text-emerald-600',
          color === 'orange' && 'text-orange-600',
          color === 'slate' && 'text-slate-600',
          color === 'blue' && 'text-blue-600',
        )}>
          {rating.toFixed(1)}
        </span>
      )}
      {showCount && reviewCount !== undefined && (
        <span className="text-slate-400 text-xs font-medium">
          ({reviewCount})
        </span>
      )}
    </div>
  );
};

interface OpportunityStarProps {
  score: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export const OpportunityStars: React.FC<OpportunityStarProps> = ({
  score,
  size = 'sm',
  className,
}) => {
  const starCount = Math.round((score / 100) * 5);
  const color = score >= 85 ? 'emerald' : score >= 60 ? 'amber' : 'slate';

  return (
    <div className={clsx('flex items-center gap-0.5', className)}>
      {Array.from({ length: 5 }).map((_, i) => (
        <HeroStar
          key={i}
          filled={i < starCount ? 'full' : 'empty'}
          size={size}
          color={color as any}
        />
      ))}
    </div>
  );
};

interface ScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ScoreBadge: React.FC<ScoreBadgeProps> = ({
  score,
  size = 'md',
  className,
}) => {
  const color = score >= 85
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : score >= 60
    ? 'bg-amber-50 text-amber-700 border-amber-200'
    : 'bg-slate-50 text-slate-600 border-slate-200';

  const sizeCls = size === 'sm'
    ? 'text-[10px] px-1.5 py-0.5'
    : size === 'md'
    ? 'text-xs px-2.5 py-1'
    : 'text-sm px-3 py-1.5';

  return (
    <span className={clsx(
      'inline-flex items-center font-bold rounded-full border',
      color,
      sizeCls,
      className,
    )}>
      {score}%
    </span>
  );
};
