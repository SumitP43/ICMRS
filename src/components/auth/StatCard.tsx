/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from 'react';

interface StatCardProps {
  label: string;
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  trendText: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  sparklineData?: number[];
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  decimals = 0,
  prefix = '',
  suffix = '',
  trendText,
  trendDirection = 'up',
  sparklineData = [20, 24, 22, 28, 32, 30, 36, 40]
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    // Respect prefers-reduced-motion
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayValue(value);
      return;
    }

    if (hasAnimatedRef.current) {
      setDisplayValue(value);
      return;
    }

    hasAnimatedRef.current = true;
    const duration = 1200; // ms
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = easeProgress * value;

      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };

    const frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [value]);

  // Compute SVG sparkline path
  const minVal = Math.min(...sparklineData);
  const maxVal = Math.max(...sparklineData);
  const range = maxVal - minVal || 1;
  const width = 56;
  const height = 20;

  const points = sparklineData
    .map((val, idx) => {
      const x = (idx / (sparklineData.length - 1)) * width;
      const y = height - ((val - minVal) / range) * (height - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const formattedNum = decimals > 0 
    ? displayValue.toFixed(decimals) 
    : Math.round(displayValue).toLocaleString();

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-xs hover:border-slate-300 transition-colors">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          {label}
        </span>
        {/* Tiny sparkline */}
        <svg 
          className="w-14 h-5 overflow-visible shrink-0 text-[#315EBD]" 
          viewBox={`0 0 ${width} ${height}`} 
          fill="none" 
          aria-hidden="true"
        >
          <polyline
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />
        </svg>
      </div>

      <div className="flex items-baseline gap-1 mt-1 font-['Inter',sans-serif]">
        <span className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight tabular-nums">
          {prefix}{formattedNum}{suffix}
        </span>
      </div>

      <div className="flex items-center gap-1.5 mt-1 text-[11px] font-medium text-emerald-700">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
        <span>{trendText}</span>
      </div>
    </div>
  );
};
