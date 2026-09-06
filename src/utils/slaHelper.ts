/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CivicComplaint } from '../types';

export interface SlaMetrics {
  totalHours: number;
  remainingHours: number;
  elapsedHours: number;
  percentLeft: number; // 0 to 100
  percentElapsed: number; // 0 to 100
  isResolved: boolean;
  statusLabel: string;
  badgeStyle: string;
  barColor: string;
  remainingFormatted: string;
  elapsedFormatted: string;
  totalFormatted: string;
}

/**
 * Calculates deterministic SLA metrics, elapsed time, and time remaining
 * percentage relative to the total guaranteed SLA duration for a complaint.
 */
export function calculateSlaMetrics(complaint: CivicComplaint): SlaMetrics {
  const isResolved = complaint.status === 'Resolved' || complaint.slaStatus === 'resolved';

  // Base guaranteed SLA window by priority
  const defaultTotalByPriority: Record<string, number> = {
    Critical: 24,
    High: 48,
    Medium: 72,
    Low: 96,
  };

  let totalHours = complaint.totalSlaHours || defaultTotalByPriority[complaint.priority] || 48;

  // If resolved, SLA is fully completed and target was met
  if (isResolved) {
    return {
      totalHours,
      remainingHours: 0,
      elapsedHours: totalHours,
      percentLeft: 0,
      percentElapsed: 100,
      isResolved: true,
      statusLabel: 'SLA Fulfilled (Resolved)',
      badgeStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      barColor: 'bg-emerald-500',
      remainingFormatted: '0h 00m (Target Met)',
      elapsedFormatted: `${totalHours}h 00m`,
      totalFormatted: `${totalHours}h 00m`,
    };
  }

  // Parse remaining hours and minutes from slaRemaining (e.g. "18h 42m SLA remaining", "4h 00m SLA remaining", "34h 10m SLA nominal")
  const hMatch = complaint.slaRemaining.match(/(\d+)\s*h/i);
  const mMatch = complaint.slaRemaining.match(/(\d+)\s*m/i);

  let remainingHours = 0;
  if (hMatch) remainingHours += parseInt(hMatch[1], 10);
  if (mMatch) remainingHours += parseInt(mMatch[1], 10) / 60;

  // If no hours parsed, fallback to a sensible window based on priority
  if (remainingHours <= 0) {
    remainingHours = Math.max(1, totalHours * 0.5);
  }

  // Make sure totalHours is at least as large as remaining hours
  if (totalHours < remainingHours) {
    totalHours = Math.ceil(remainingHours);
  }

  const elapsedHours = Math.max(0, totalHours - remainingHours);
  const percentLeft = Math.min(100, Math.max(0, Math.round((remainingHours / totalHours) * 100)));
  const percentElapsed = Math.max(0, 100 - percentLeft);

  // Format hours and minutes display
  const remH = Math.floor(remainingHours);
  const remM = Math.round((remainingHours - remH) * 60);
  const remainingFormatted = `${remH}h ${remM.toString().padStart(2, '0')}m`;

  const elapH = Math.floor(elapsedHours);
  const elapM = Math.round((elapsedHours - elapH) * 60);
  const elapsedFormatted = `${elapH}h ${elapM.toString().padStart(2, '0')}m`;

  const totalFormatted = `${totalHours}h 00m`;

  // Color and alert status based on percentage of time left
  let statusLabel = 'Nominal Pace';
  let badgeStyle = 'bg-indigo-50 text-indigo-700 border-indigo-200';
  let barColor = 'bg-indigo-600';

  if (percentLeft <= 25 || complaint.slaStatus === 'urgent') {
    statusLabel = percentLeft <= 25 ? 'Critical (<25% Left)' : 'Urgent Window';
    badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200';
    barColor = 'bg-rose-500';
  } else if (percentLeft <= 50) {
    statusLabel = 'Warning (25-50% Left)';
    badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200';
    barColor = 'bg-amber-500';
  } else {
    statusLabel = 'Nominal (>50% Left)';
    badgeStyle = 'bg-indigo-50 text-indigo-700 border-indigo-200';
    barColor = 'bg-indigo-600';
  }

  return {
    totalHours,
    remainingHours,
    elapsedHours,
    percentLeft,
    percentElapsed,
    isResolved: false,
    statusLabel,
    badgeStyle,
    barColor,
    remainingFormatted,
    elapsedFormatted,
    totalFormatted,
  };
}
