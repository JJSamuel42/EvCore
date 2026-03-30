'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { CellMeta } from '@/types';
import { cn } from '@/lib/utils';

interface CellDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columnName: string;
  value: any;
  meta?: CellMeta;
  onSave: (newValue: string, overrideReason: string) => void;
}

export function CellDetailModal({
  open,
  onOpenChange,
  columnName,
  value,
  meta,
  onSave,
}: CellDetailModalProps) {
  const [editValue, setEditValue] = useState(String(value ?? ''));
  const [reason, setReason] = useState('');

  const confidence = meta?.confidence ?? 0;

  const handleSave = () => {
    onSave(editValue, reason);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <h3 className="font-serif text-base font-semibold mb-4">{columnName}</h3>

        {/* Confidence bar */}
        {meta && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                AI Confidence
              </span>
              <span
                className={cn(
                  'text-xs font-medium',
                  confidence >= 90
                    ? 'text-green-500'
                    : confidence >= 75
                      ? 'text-yellow-500'
                      : 'text-exclude'
                )}
              >
                {confidence}%
              </span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  confidence >= 90
                    ? 'bg-green-500'
                    : confidence >= 75
                      ? 'bg-yellow-500'
                      : 'bg-exclude'
                )}
                style={{ width: `${confidence}%` }}
              />
            </div>
          </div>
        )}

        {/* AI Reasoning */}
        {meta?.reasoning && (
          <div className="mb-3">
            <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
              AI Reasoning
            </p>
            <p className="text-xs text-foreground bg-muted rounded px-3 py-2">
              {meta.reasoning}
            </p>
          </div>
        )}

        {/* Source snippet */}
        {meta?.sourceSnippet && (
          <div className="mb-3">
            <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
              Source Snippet
            </p>
            <p className="text-xs text-muted-foreground bg-muted rounded px-3 py-2 italic">
              &ldquo;{meta.sourceSnippet}&rdquo;
            </p>
          </div>
        )}

        {/* Editable value */}
        <div className="mb-3">
          <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
            Value
          </p>
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 text-sm bg-card border border-border rounded focus:outline-none focus:ring-2 focus:ring-accent resize-y"
          />
        </div>

        {/* Override reason */}
        <div className="mb-4">
          <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
            Override Reason (optional)
          </p>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why are you changing this value?"
            className="w-full h-8 px-3 text-sm bg-card border border-border rounded focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        <div className="flex justify-end gap-2">
          <DialogClose asChild>
            <Button variant="ghost" size="sm">Cancel</Button>
          </DialogClose>
          <Button variant="primary" size="sm" onClick={handleSave}>
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
