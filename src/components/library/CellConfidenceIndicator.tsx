'use client';

import React from 'react';
import { CellMeta } from '@/types';
import { cn } from '@/lib/utils';

interface CellConfidenceIndicatorProps {
  meta?: CellMeta;
  value: any;
}

export function CellConfidenceIndicator({ meta, value }: CellConfidenceIndicatorProps) {
  if (!meta && (value === undefined || value === null || value === '')) {
    // No value and no meta — unextractable
    return (
      <span className="absolute bottom-0.5 right-1 text-[9px] font-bold text-exclude" title="No value extracted">
        !
      </span>
    );
  }

  if (!meta) return null;

  const { confidence } = meta;

  // ≥90%: no indicator
  if (confidence >= 90) return null;

  // 75-89%: single yellow !
  if (confidence >= 75) {
    return (
      <span
        className="absolute bottom-0.5 right-1 text-[9px] font-bold text-yellow-500"
        title={`Confidence: ${confidence}% — ${meta.reasoning}`}
      >
        !
      </span>
    );
  }

  // ≤74%: double yellow !!
  return (
    <span
      className="absolute bottom-0.5 right-1 text-[9px] font-bold text-yellow-500"
      title={`Confidence: ${confidence}% — ${meta.reasoning}`}
    >
      !!
    </span>
  );
}
