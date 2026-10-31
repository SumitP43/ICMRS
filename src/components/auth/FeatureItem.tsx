/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface FeatureItemProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const FeatureItem: React.FC<FeatureItemProps> = ({
  icon: Icon,
  title,
  description,
}) => {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/80 border border-slate-200/60 hover:bg-slate-50 transition-colors">
      <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 mt-0.5 text-[#315EBD]">
        <Icon className="w-4 h-4" aria-hidden="true" />
      </div>
      <div>
        <h4 className="text-xs font-semibold text-slate-900 leading-snug">
          {title}
        </h4>
        <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
};
