'use client';

import React from 'react';
import { CellMeta } from '@/types';

interface CellConfidenceIndicatorProps {
  meta?: CellMeta;
  value: any;
}

const EMPTY_VALUES = new Set([undefined, null, '', '—', '(AI extracted — review required)']);

function isEmpty(value: any): boolean {
  return EMPTY_VALUES.has(value) || (typeof value === 'string' && value.trim() === '');
}

// Filled circular badge positioned at bottom-right of the parent <td> (which must be position:relative)
export function CellConfidenceIndicator({ meta, value }: CellConfidenceIndicatorProps) {
  // Red circle — AI processed but could not extract a value
  if (meta && isEmpty(value)) {
    return (
      <span
        className="absolute bottom-1 right-1 inline-flex items-center justify-center w-[18px] h-[18px] rounded-full bg-exclude text-white text-[9px] font-bold leading-none select-none pointer-events-none"
        title="AI could not extract a value — click to review"
      >
        !
      </span>
    );
  }

  // No meta = cell not yet processed → no indicator
  if (!meta) return null;

  const { confidence } = meta;

  // ≥90%: no indicator (high confidence)
  if (confidence >= 90) return null;

  // 75-89%: single yellow circle (medium confidence)
  if (confidence >= 75) {
    return (
      <span
        className="absolute bottom-1 right-1 inline-flex items-center justify-center w-[18px] h-[18px] rounded-full bg-yellow-400 text-white text-[9px] font-bold leading-none select-none pointer-events-none"
        title={`Confidence: ${confidence}% — ${meta.reasoning}`}
      >
        !
      </span>
    );
  }

  // ≤74%: double-! yellow circle (low confidence)
  return (
    <span
      className="absolute bottom-1 right-1 inline-flex items-center justify-center w-[20px] h-[18px] rounded-full bg-yellow-400 text-white text-[9px] font-bold leading-none select-none pointer-events-none"
      title={`Confidence: ${confidence}% — ${meta.reasoning}`}
    >
      !!
    </span>
  );
}
