'use client';

import React from 'react';
import { TrainingRecord } from '@/types';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/Dialog';
import { X, ArrowRight, Brain } from 'lucide-react';

interface TrainingDataModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  records: TrainingRecord[];
  libraryId: string;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
}

export function TrainingDataModal({ open, onOpenChange, records, libraryId }: TrainingDataModalProps) {
  const libRecords = records
    .filter((r) => r.libraryId === libraryId)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  // Group by column
  const byColumn: Record<string, TrainingRecord[]> = {};
  for (const r of libRecords) {
    if (!byColumn[r.columnName]) byColumn[r.columnName] = [];
    byColumn[r.columnName].push(r);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col gap-0 p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-accent" />
            <h2 className="text-sm font-semibold text-foreground">AI Training Data</h2>
            <span className="text-xs text-muted-foreground">— {libRecords.length} correction{libRecords.length !== 1 ? 's' : ''} recorded</span>
          </div>
          <DialogClose asChild>
            <button className="p-1.5 rounded hover:bg-muted transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </DialogClose>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-4">
          {libRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
              <Brain className="w-8 h-8 opacity-30" />
              <p className="text-sm">No corrections recorded yet.</p>
              <p className="text-xs">When you correct an AI-extracted cell value, it is saved here and used to improve future processing.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {Object.entries(byColumn).map(([colName, colRecords]) => (
                <div key={colName}>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    {colName} <span className="font-normal normal-case">({colRecords.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {colRecords.map((r) => (
                      <div key={r.id} className="flex items-start gap-3 px-3 py-2.5 rounded-lg bg-muted/40 border border-border">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs px-1.5 py-0.5 rounded font-mono ${r.aiValue ? 'bg-exclude/10 text-exclude' : 'bg-muted text-muted-foreground italic'}`}>
                              {r.aiValue || '(empty)'}
                            </span>
                            <ArrowRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                            <span className="text-xs px-1.5 py-0.5 rounded font-mono bg-include/10 text-include">
                              {r.userValue || '(cleared)'}
                            </span>
                          </div>
                          {r.overrideReason && (
                            <p className="text-xs text-muted-foreground mt-1 italic">"{r.overrideReason}"</p>
                          )}
                          {r.abstractSnippet && (
                            <p className="text-[10px] text-muted-foreground/60 mt-1 line-clamp-1">
                              Context: {r.abstractSnippet.slice(0, 80)}…
                            </p>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap flex-shrink-0 mt-0.5">
                          {formatDate(r.timestamp)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer note */}
        <div className="px-5 py-3 border-t border-border bg-muted/30">
          <p className="text-[11px] text-muted-foreground">
            These corrections are stored locally and applied automatically when AI processes new articles in this library.
            Future Azure SQL migration will sync training data across sessions.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
