'use client';

import React from 'react';
import { Funnel, FunnelLevel } from '@/types';
import { cn, formatNumber, formatPercentage } from '@/lib/utils';
import { BookOpen } from 'lucide-react';

interface FunnelVisualizationProps {
  funnel: Funnel;
  onLevelClick: (level: FunnelLevel) => void;
}

export function FunnelVisualization({ funnel, onLevelClick }: FunnelVisualizationProps) {
  const levels = funnel.levels;
  if (levels.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
        No levels defined yet.
      </div>
    );
  }

  const maxWidth = 100; // percentage
  const minWidth = 20;
  const maxVal = levels[0]?.value || 1;

  return (
    <div className="space-y-1 py-4 px-2">
      {levels.map((level, idx) => {
        const widthPct = level.value
          ? Math.max(minWidth, (level.value / maxVal) * maxWidth)
          : Math.max(minWidth, 100 - idx * (80 / Math.max(levels.length - 1, 1)));

        const colors = [
          'from-accent/80 to-accent/60',
          'from-accent/65 to-accent/45',
          'from-accent/50 to-accent/30',
          'from-accent/40 to-accent/25',
          'from-accent/30 to-accent/18',
          'from-accent/25 to-accent/15',
        ];
        const colorClass = colors[idx % colors.length];

        return (
          <div key={level.id} className="flex flex-col items-center">
            <button
              onClick={() => onLevelClick(level)}
              className="group w-full flex flex-col items-center focus:outline-none"
              style={{ maxWidth: `${widthPct}%` }}
            >
              <div
                className={cn(
                  'w-full rounded-sm relative overflow-hidden',
                  'bg-gradient-to-r',
                  colorClass,
                  'border border-accent/20',
                  'hover:brightness-105 transition-all',
                  'cursor-pointer',
                  'min-h-[44px]',
                  'flex items-center justify-between px-4'
                )}
              >
                <div className="text-left">
                  <p className="text-xs font-medium text-foreground truncate max-w-[200px]">
                    {level.name}
                  </p>
                  {level.description && (
                    <p className="text-[11px] text-muted-foreground truncate max-w-[200px] mt-0.5">
                      {level.description}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0 ml-4">
                  {level.value !== undefined && (
                    <p className="text-sm font-semibold text-foreground font-mono">
                      {formatNumber(level.value)}
                    </p>
                  )}
                  <p className="text-[11px] text-muted-foreground">{formatPercentage(level.percentage)}</p>
                </div>
                {level.linkedArticles.length > 0 && (
                  <div className="absolute top-1 right-12 flex items-center gap-0.5 text-[10px] text-muted-foreground">
                    <BookOpen className="w-2.5 h-2.5" />
                    {level.linkedArticles.length}
                  </div>
                )}
              </div>
            </button>

            {/* Connector arrow */}
            {idx < levels.length - 1 && (
              <div className="flex flex-col items-center py-0.5">
                <div className="w-px h-2 bg-accent/20" />
                <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-t-[4px] border-l-transparent border-r-transparent border-t-accent/30" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
