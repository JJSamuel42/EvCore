'use client';

import React from 'react';
import { Funnel, FunnelLevel } from '@/types';
import { cn, formatNumber, formatPercentage } from '@/lib/utils';
import { BookOpen } from 'lucide-react';

interface FunnelVisualizationProps {
  funnel: Funnel;
  onLevelClick: (level: FunnelLevel) => void;
  adminMode?: boolean;
}

// Pre-defined gradient steps: lightest (index 0) → darkest (index last)
// Written as string literals so Tailwind JIT includes them in the build
const GRADIENTS = [
  'from-accent/12 to-accent/8',
  'from-accent/22 to-accent/16',
  'from-accent/33 to-accent/25',
  'from-accent/44 to-accent/34',
  'from-accent/55 to-accent/44',
  'from-accent/66 to-accent/55',
  'from-accent/76 to-accent/66',
  'from-accent/86 to-accent/76',
];

export function FunnelVisualization({ funnel, onLevelClick, adminMode = false }: FunnelVisualizationProps) {
  const levels = funnel.levels;
  const n = levels.length;

  if (n === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
        No levels defined yet.{adminMode && ' Use "Add Level" above to get started.'}
      </div>
    );
  }

  // Compute display widths as % of container
  const maxPct = levels[0]?.percentage || 100;
  const displayWidths = levels.map((level, idx) => {
    if (maxPct > 0 && level.percentage != null && level.percentage > 0) {
      return Math.max(16, Math.min(100, (level.percentage / maxPct) * 100));
    }
    // Fallback linear taper
    return Math.max(16, 100 - idx * (82 / Math.max(n - 1, 1)));
  });

  return (
    <div className="py-2">
      {levels.map((level, idx) => {
        const topW = displayWidths[idx];
        // Bottom of this bar = top of next bar, or slightly narrower for the last
        const botW =
          idx < n - 1
            ? displayWidths[idx + 1]
            : Math.max(12, displayWidths[idx] * 0.80);

        // Trapezoid clip-path (symmetric about horizontal centre)
        const tl = ((100 - topW) / 2).toFixed(2);
        const tr = ((100 + topW) / 2).toFixed(2);
        const br = ((100 + botW) / 2).toFixed(2);
        const bl = ((100 - botW) / 2).toFixed(2);
        const clipPath = `polygon(${tl}% 0%, ${tr}% 0%, ${br}% 100%, ${bl}% 100%)`;

        // Pick gradient step proportional to position (lightest at top, darkest at bottom)
        const gradIdx =
          n === 1
            ? GRADIENTS.length - 1
            : Math.round((idx / (n - 1)) * (GRADIENTS.length - 1));
        const colorClass = GRADIENTS[gradIdx];

        // Text colour: use darker text for lighter (top) levels, white for darker (bottom)
        const textLight = gradIdx >= 4;

        return (
          <div key={level.id}>
            <button
              onClick={() => onLevelClick(level)}
              className="w-full focus:outline-none group"
            >
              <div
                style={{ clipPath }}
                className={cn(
                  'w-full bg-gradient-to-r',
                  colorClass,
                  'min-h-[52px] flex items-center justify-between px-8',
                  'hover:brightness-110 transition-all cursor-pointer',
                )}
              >
                {/* Level label + description */}
                <div className="text-left">
                  <p
                    className={cn(
                      'text-xs font-semibold truncate max-w-[200px]',
                      textLight ? 'text-foreground' : 'text-foreground/90',
                    )}
                  >
                    {level.name}
                  </p>
                  {level.description && (
                    <p className="text-[11px] text-muted-foreground truncate max-w-[200px] mt-0.5">
                      {level.description}
                    </p>
                  )}
                </div>

                {/* Value + percentage */}
                <div className="text-right shrink-0 ml-4 flex items-center gap-3">
                  {level.linkedArticles.length > 0 && (
                    <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                      <BookOpen className="w-2.5 h-2.5" />
                      {level.linkedArticles.length}
                    </div>
                  )}
                  <div>
                    {level.value !== undefined && (
                      <p className="text-sm font-semibold text-foreground font-mono">
                        {formatNumber(level.value)}
                      </p>
                    )}
                    <p className="text-[11px] text-muted-foreground">
                      {formatPercentage(level.percentage)}
                    </p>
                  </div>
                </div>
              </div>
            </button>

            {/* Thin separator gap between levels */}
            {idx < n - 1 && <div className="h-[2px] bg-card" />}
          </div>
        );
      })}
    </div>
  );
}
