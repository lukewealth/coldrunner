import React from 'react';

interface LogoProps {
  size?: number;
  variant?: 'blue' | 'white' | 'dark';
  animated?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ 
  size = 40, 
  variant = 'blue', 
  animated = false,
  className = '' 
}) => {
  const color = variant === 'white' ? '#FFFFFF' : variant === 'dark' ? '#0F172A' : '#3B82F6';
  const arcOpacity = variant === 'white' ? 0.7 : variant === 'dark' ? 0.5 : 1;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {animated && (
        <style>
          {`
            @keyframes cr-pulse {
              0%, 100% { opacity: 1; transform: scale(1); }
              50% { opacity: 0.7; transform: scale(0.95); }
            }
            @keyframes cr-orbit {
              0% { stroke-dashoffset: 0; }
              100% { stroke-dashoffset: -12; }
            }
            .cr-center { animation: cr-pulse 3s ease-in-out infinite; transform-origin: 32px 32px; }
            .cr-arc { stroke-dasharray: 4 8; animation: cr-orbit 4s linear infinite; }
          `}
        </style>
      )}
      <circle cx="32" cy="32" r="7" fill={color} className={animated ? 'cr-center' : ''} />
      <circle cx="32" cy="13" r="3.5" fill={color} />
      <circle cx="48.5" cy="41.5" r="3.5" fill={color} />
      <circle cx="15.5" cy="41.5" r="3.5" fill={color} />
      <path d="M37 15.5A18 18 0 0 1 46 39" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity={arcOpacity} className={animated ? 'cr-arc' : ''} />
      <path d="M46 44A18 18 0 0 1 18 44" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity={arcOpacity} className={animated ? 'cr-arc' : ''} />
      <path d="M18 39A18 18 0 0 1 27 15.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity={arcOpacity} className={animated ? 'cr-arc' : ''} />
    </svg>
  );
};

interface WordmarkProps {
  height?: number;
  variant?: 'light' | 'dark';
  className?: string;
}

export const Wordmark: React.FC<WordmarkProps> = ({ 
  height = 32, 
  variant = 'light',
  className = '' 
}) => {
  const iconColor = variant === 'dark' ? '#60A5FA' : '#3B82F6';
  const textColor = variant === 'dark' ? '#F8FAFC' : '#0F172A';
  const subtextColor = variant === 'dark' ? '#94A3B8' : '#64748B';
  const arcOpacity = variant === 'dark' ? 0.7 : 1;

  return (
    <svg
      height={height}
      viewBox="0 0 280 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="32" cy="32" r="7" fill={iconColor} />
      <circle cx="32" cy="13" r="3.5" fill={iconColor} />
      <circle cx="48.5" cy="41.5" r="3.5" fill={iconColor} />
      <circle cx="15.5" cy="41.5" r="3.5" fill={iconColor} />
      <path d="M37 15.5A18 18 0 0 1 46 39" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" opacity={arcOpacity} />
      <path d="M46 44A18 18 0 0 1 18 44" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" opacity={arcOpacity} />
      <path d="M18 39A18 18 0 0 1 27 15.5" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" opacity={arcOpacity} />
      <text x="76" y="30" fontFamily="Inter, SF Pro Display, -apple-system, system-ui, sans-serif" fontSize="22" fontWeight="700" fill={textColor} letterSpacing="-0.5">ColdRunners</text>
      <text x="76" y="48" fontFamily="Inter, SF Pro Display, -apple-system, system-ui, sans-serif" fontSize="10" fontWeight="500" fill={subtextColor} letterSpacing="2">BUSINESS INTELLIGENCE</text>
    </svg>
  );
};
