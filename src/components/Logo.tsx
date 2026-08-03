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
  const color = variant === 'white' ? '#FFFFFF' : variant === 'dark' ? '#0F172A' : '#1a56db';
  const colorLight = variant === 'white' ? '#E0F0FF' : variant === 'dark' ? '#60A5FA' : '#00bfff';
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
              50% { opacity: 0.7; transform: scale(0.9); }
            }
            @keyframes cr-orbit {
              0% { stroke-dashoffset: 0; }
              100% { stroke-dashoffset: -12; }
            }
            @keyframes cr-sparkle {
              0%, 100% { opacity: 1; transform: scale(1) rotate(0deg); }
              50% { opacity: 0.8; transform: scale(1.15) rotate(15deg); }
            }
            .cr-center { animation: cr-pulse 3s ease-in-out infinite; transform-origin: 38px 32px; }
            .cr-arc { stroke-dasharray: 4 8; animation: cr-orbit 4s linear infinite; }
            .cr-sparkle { animation: cr-sparkle 2s ease-in-out infinite; transform-origin: 36px 32px; }
          `}
        </style>
      )}
      <path
        d="M44 16C36 16 30 22 30 30C30 38 36 44 44 44C48 44 50 42 50 38C50 42 48 42 44 42C38 42 34 36 34 30C34 24 38 18 44 18C48 18 50 20 50 24C50 20 48 16 44 16Z"
        fill={color}
        className={animated ? 'cr-center' : ''}
      />
      <rect x="8" y="26" width="14" height="4" rx="2" fill={colorLight} opacity={arcOpacity} />
      <rect x="8" y="34" width="10" height="4" rx="2" fill={colorLight} opacity={arcOpacity} />
      <circle cx="18" cy="20" r="2.5" fill={colorLight} opacity={arcOpacity} />
      <circle cx="18" cy="44" r="2.5" fill={colorLight} opacity={arcOpacity} />
      <path
        d="M36 28L37.5 32L41.5 33.5L37.5 35L36 39L34.5 35L30.5 33.5L34.5 32L36 28Z"
        fill={colorLight}
        className={animated ? 'cr-sparkle' : ''}
      />
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
  const iconColor = variant === 'dark' ? '#60A5FA' : '#1a56db';
  const iconColorLight = variant === 'dark' ? '#93C5FD' : '#00bfff';
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
      <path
        d="M44 16C36 16 30 22 30 30C30 38 36 44 44 44C48 44 50 42 50 38C50 42 48 42 44 42C38 42 34 36 34 30C34 24 38 18 44 18C48 18 50 20 50 24C50 20 48 16 44 16Z"
        fill={iconColor}
      />
      <rect x="8" y="26" width="14" height="4" rx="2" fill={iconColorLight} opacity={arcOpacity} />
      <rect x="8" y="34" width="10" height="4" rx="2" fill={iconColorLight} opacity={arcOpacity} />
      <circle cx="18" cy="20" r="2.5" fill={iconColorLight} opacity={arcOpacity} />
      <circle cx="18" cy="44" r="2.5" fill={iconColorLight} opacity={arcOpacity} />
      <path
        d="M36 28L37.5 32L41.5 33.5L37.5 35L36 39L34.5 35L30.5 33.5L34.5 32L36 28Z"
        fill={iconColorLight}
      />
      <text x="60" y="30" fontFamily="Inter, SF Pro Display, -apple-system, system-ui, sans-serif" fontSize="22" fontWeight="700" fill={textColor} letterSpacing="-0.5">ColdRunners</text>
      <text x="60" y="48" fontFamily="Inter, SF Pro Display, -apple-system, system-ui, sans-serif" fontSize="10" fontWeight="500" fill={subtextColor} letterSpacing="2">BUSINESS INTELLIGENCE</text>
    </svg>
  );
};
