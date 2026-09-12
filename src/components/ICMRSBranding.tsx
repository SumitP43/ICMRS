import React from 'react';

export type ICMRSVariant = 'emblem' | 'mark' | 'badge' | 'banner';
export type ICMRSSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'hero' | number;

interface ICMRSLogoProps {
  variant?: ICMRSVariant;
  size?: ICMRSSize;
  className?: string;
  showSubtitle?: boolean;
  alt?: string;
  onClick?: () => void;
}

const SIZE_MAP: Record<string, { px: number; class: string }> = {
  xs: { px: 20, class: 'w-5 h-5' },
  sm: { px: 32, class: 'w-8 h-8' },
  md: { px: 44, class: 'w-11 h-11' },
  lg: { px: 64, class: 'w-16 h-16' },
  xl: { px: 96, class: 'w-24 h-24' },
  '2xl': { px: 140, class: 'w-36 h-36' },
  hero: { px: 220, class: 'w-48 h-48 sm:w-56 sm:h-56' },
};

export const ICMRSLogo: React.FC<ICMRSLogoProps> = ({
  variant = 'emblem',
  size = 'md',
  className = '',
  showSubtitle = true,
  alt = 'ICMRS — Intelligent Civic Management & Response System',
  onClick
}) => {
  const sizeConfig = typeof size === 'number' 
    ? { px: size, class: `w-[${size}px] h-[${size}px]` } 
    : SIZE_MAP[size] || SIZE_MAP.md;

  const imageSrc = variant === 'mark' 
    ? '/assets/icmrs-logo.svg' 
    : '/assets/icmrs-emblem.svg';

  if (variant === 'banner') {
    return (
      <div 
        className={`flex items-center gap-3.5 ${onClick ? 'cursor-pointer hover:opacity-95 transition-opacity' : ''} ${className}`}
        onClick={onClick}
      >
        <div className="relative shrink-0 rounded-full shadow-md ring-2 ring-indigo-500/20 overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-700 p-0.5">
          <img 
            src="/assets/icmrs-emblem.svg" 
            alt={alt}
            className={`${sizeConfig.class} object-contain rounded-full`}
            style={typeof size === 'number' ? { width: size, height: size } : undefined}
            loading="eager"
          />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-['Plus_Jakarta_Sans'] font-black text-[18px] sm:text-[20px] text-gray-900 tracking-tight leading-tight">
              ICMRS
            </span>
            <span className="px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-[10px] font-extrabold uppercase tracking-wider">
              Gov Civic Tech
            </span>
          </div>
          {showSubtitle && (
            <span className="font-['Inter'] text-[11px] font-medium text-gray-500 leading-snug tracking-tight">
              Intelligent Civic Management &amp; Response System
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`relative inline-flex items-center justify-center shrink-0 rounded-full overflow-hidden transition-transform duration-200 ${
        onClick ? 'cursor-pointer hover:scale-105 active:scale-95' : ''
      } ${className}`}
      onClick={onClick}
      style={typeof size === 'number' ? { width: size, height: size } : undefined}
    >
      <img
        src={imageSrc}
        alt={alt}
        className={`${sizeConfig.class} object-contain rounded-full shadow-sm`}
        style={typeof size === 'number' ? { width: size, height: size } : undefined}
        loading="eager"
      />
    </div>
  );
};
