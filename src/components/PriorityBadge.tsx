/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  AlertCircle, 
  ArrowDownCircle, 
  Shield 
} from 'lucide-react';

export type PriorityLevel = 'Critical' | 'High' | 'Medium' | 'Low' | string;
export type PriorityBadgeSize = 'xs' | 'sm' | 'md' | 'lg';

interface PriorityBadgeProps {
  priority: PriorityLevel;
  size?: PriorityBadgeSize;
  showLabel?: boolean;
  pulseOnCritical?: boolean;
  className?: string;
}

const ICON_SIZE_MAP: Record<PriorityBadgeSize, string> = {
  xs: 'w-3 h-3',
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-4.5 h-4.5',
};

const CONTAINER_SIZE_MAP: Record<PriorityBadgeSize, string> = {
  xs: 'text-[10px] py-0.5 px-2 gap-1.5 rounded-md font-bold',
  sm: 'text-[11px] py-0.5 px-2.5 gap-1.5 rounded-full font-bold',
  md: 'text-[12px] py-1 px-3 gap-2 rounded-full font-bold',
  lg: 'text-[13px] py-1.5 px-3.5 gap-2 rounded-full font-extrabold',
};

/**
 * Dedicated color-coded icon representing complaint urgency:
 * - Critical: Shield (Emergency / Hazardous)
 * - High: Triangle (Warning / Priority Attention)
 * - Medium: Circle (Standard Service)
 * - Low: Arrow (Routine / Informational)
 */
export const PriorityIcon: React.FC<{
  priority: PriorityLevel;
  size?: PriorityBadgeSize;
  className?: string;
}> = ({ priority, size = 'sm', className = '' }) => {
  const normPriority = (priority || 'Medium').trim();
  const iconSizeClass = ICON_SIZE_MAP[size] || ICON_SIZE_MAP.sm;

  switch (normPriority) {
    case 'Critical':
      return (
        <span 
          title="Critical Priority: Emergency response required" 
          className={`inline-flex items-center justify-center text-rose-600 bg-rose-100/90 p-0.5 rounded-md shadow-2xs ${className}`}
        >
          <ShieldAlert className={iconSizeClass} aria-label="Critical Priority Shield" />
        </span>
      );
    case 'High':
      return (
        <span 
          title="High Priority: Accelerated SLA triage" 
          className={`inline-flex items-center justify-center text-amber-600 bg-amber-100/90 p-0.5 rounded-md shadow-2xs ${className}`}
        >
          <AlertTriangle className={iconSizeClass} aria-label="High Priority Triangle" />
        </span>
      );
    case 'Medium':
      return (
        <span 
          title="Medium Priority: Standard municipal schedule" 
          className={`inline-flex items-center justify-center text-sky-600 bg-sky-100/90 p-0.5 rounded-md shadow-2xs ${className}`}
        >
          <AlertCircle className={iconSizeClass} aria-label="Medium Priority Circle" />
        </span>
      );
    case 'Low':
    default:
      return (
        <span 
          title="Low Priority: Routine maintenance" 
          className={`inline-flex items-center justify-center text-slate-500 bg-slate-100/90 p-0.5 rounded-md shadow-2xs ${className}`}
        >
          <ArrowDownCircle className={iconSizeClass} aria-label="Low Priority Arrow" />
        </span>
      );
  }
};

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  priority,
  size = 'sm',
  showLabel = true,
  pulseOnCritical = true,
  className = '',
}) => {
  const normPriority = (priority || 'Medium').trim();
  const iconSizeClass = ICON_SIZE_MAP[size] || ICON_SIZE_MAP.sm;

  // Determine styling, icon, and colors according to civic priority standards
  let iconElement: React.ReactNode;
  let colorClasses = '';
  const labelText = `${normPriority} Priority`;

  switch (normPriority) {
    case 'Critical':
      iconElement = <ShieldAlert className={`${iconSizeClass} text-rose-600`} aria-hidden="true" />;
      colorClasses = 'bg-rose-50 text-rose-900 border-rose-200/90 shadow-2xs';
      break;
    case 'High':
      iconElement = <AlertTriangle className={`${iconSizeClass} text-amber-600`} aria-hidden="true" />;
      colorClasses = 'bg-amber-50 text-amber-900 border-amber-200/90 shadow-2xs';
      break;
    case 'Medium':
      iconElement = <AlertCircle className={`${iconSizeClass} text-sky-600`} aria-hidden="true" />;
      colorClasses = 'bg-sky-50 text-sky-900 border-sky-200/90 shadow-2xs';
      break;
    case 'Low':
    default:
      iconElement = <ArrowDownCircle className={`${iconSizeClass} text-slate-500`} aria-hidden="true" />;
      colorClasses = 'bg-slate-50 text-slate-700 border-slate-200 shadow-2xs';
      break;
  }

  const containerSizeClass = CONTAINER_SIZE_MAP[size] || CONTAINER_SIZE_MAP.sm;

  return (
    <span
      className={`inline-flex items-center border font-sans tracking-tight transition-colors ${containerSizeClass} ${colorClasses} ${className}`}
      title={`${normPriority} Priority Level`}
    >
      {/* Visual Intuitive Color-Coded Icon */}
      <span className="shrink-0 flex items-center justify-center">
        {iconElement}
      </span>

      {/* Pulsing indicator for active Critical emergencies */}
      {normPriority === 'Critical' && pulseOnCritical && (
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-600"></span>
        </span>
      )}

      {/* Text Label */}
      {showLabel && <span className="whitespace-nowrap">{labelText}</span>}
    </span>
  );
};

export default PriorityBadge;
