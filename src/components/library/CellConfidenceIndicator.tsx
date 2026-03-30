'use client';

import React from 'react';
import { CellMeta } from '@/types';
import { cn } from '@/lib/utils';

interface CellConfidenceIndicatorProps {
  meta?: CellMeta;
  value: any;
}

const EMPTY_VALUES = new Set([undefined, null, '', '—', '(AI extracted — review required)']);

function isEmpty(value: any): boolean {
  return EMPTY_VALUES.has(value) || (typeof value === 'string' && value.trim() === '');
}

export function CellConfidenceIndicator({ meta, value }: CellConfidenceIndicatorProps) {
  // Red ! — value is empty/unextractable (only after processing, i.e. meta exists)
  if (meta && isEmpty(value)) {
    return (
      <span className="absolute bottom-0.5 right-1 text-[9px] font-bold text-exclude" title="AI could not extract a value — click to review">
        !
      </span>
    );
  }

  // No meta = cell not yet processed → no indicator
  if (!meta) return null;

  // Has value, has meta
  const { confidence } = meta;

  // ≥90%: no indicator (high confidence)
  if (confidence >= 90) return null;

  // 75-89%: single yellow ! (medium confidence)
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

  // ≤74%: double yellow !! (low confidence)
  return (
    <span
      className="absolute bottom-0.5 right-1 text-[9px] font-bold text-yellow-500"
      title={`Confidence: ${confidence}% — ${meta.reasoning}`}
    >
      !!
    </span>
  );
}
