'use client';

import React, { useState } from 'react';
import { Check, X, RotateCcw } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Textarea } from '@/components/ui/Input';
import { SearchResult } from '@/types';
import { truncate } from '@/lib/utils';

interface ReviewModalProps {
  result: SearchResult | null;
  open: boolean;
  onClose: () => void;
  onUpdate: (decision: 'include' | 'exclude', rationale: string) => void;
}

export function ReviewModal({ result, open, onClose, onUpdate }: ReviewModalProps) {
  const [overrideDecision, setOverrideDecision] = useState<'include' | 'exclude' | null>(null);
  const [rationale, setRationale] = useState('');

  const handleOpen = (o: boolean) => {
    if (o) {
      setOverrideDecision(result?.decision || null);
      setRationale(result?.rationale || '');
    } else {
      onClose();
    }
  };

  const handleSave = () => {
    if (!overrideDecision) return;
    onUpdate(overrideDecision, rationale);
    onClose();
  };

  if (!result) return null;

  const effectiveDecision = overrideDecision || result.decision;
  const isOverriding = overrideDecision && overrideDecision !== result.decision;

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent
        size="md"
        title="Review Decision"
        description={truncate(result.title, 80)}
      >
        <div className="space-y-4">
          {/* AI Decision */}
          {result.decision && (
            <div className="p-3 bg-muted rounded-md">
              <div className="flex items-center gap-2 mb-1.5">
                <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                  AI Recommendation
                </p>
                <Badge variant={result.decision}>{result.decision}</Badge>
                {result.confidence != null && (
                  <span className="ml-auto text-[11px] font-mono text-muted-foreground">
                    {result.confidence}% confidence
                  </span>
                )}
              </div>
              {result.confidence != null && (
                <div className="mb-2">
                  <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        result.confidence >= 85
                          ? 'bg-include'
                          : result.confidence >= 65
                          ? 'bg-amber-500'
                          : 'bg-exclude'
                      }`}
                      style={{ width: `${result.confidence}%` }}
                    />
                  </div>
                  {result.confidenceReason && (
                    <p className="text-[11px] text-muted-foreground mt-1">{result.confidenceReason}</p>
                  )}
                </div>
              )}
              <p className="text-sm text-foreground leading-relaxed">{result.aiReasoning}</p>
            </div>
          )}

          {/* Override Decision */}
          <div>
            <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-2">
              Your Decision
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setOverrideDecision('include')}
                className={`flex items-center gap-2 flex-1 px-3 py-2.5 rounded-md border text-sm font-medium transition-all ${
                  effectiveDecision === 'include'
                    ? 'bg-include-bg border-include/30 text-include'
                    : 'border-border text-muted-foreground hover:border-include/30 hover:bg-include-bg/50'
                }`}
              >
                <Check className="w-4 h-4" />
                Include
              </button>
              <button
                onClick={() => setOverrideDecision('exclude')}
                className={`flex items-center gap-2 flex-1 px-3 py-2.5 rounded-md border text-sm font-medium transition-all ${
                  effectiveDecision === 'exclude'
                    ? 'bg-exclude-bg border-exclude/30 text-exclude'
                    : 'border-border text-muted-foreground hover:border-exclude/30 hover:bg-exclude-bg/50'
                }`}
              >
                <X className="w-4 h-4" />
                Exclude
              </button>
            </div>
            {isOverriding && (
              <div className="mt-1.5 flex items-center gap-1 text-xs text-amber-600">
                <RotateCcw className="w-3 h-3" />
                <span>Overriding AI recommendation</span>
              </div>
            )}
          </div>

          {/* Rationale */}
          <Textarea
            label="Rationale (Optional)"
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
            placeholder="Add reason for your decision, e.g. 'Animal study — does not meet inclusion criteria'..."
            rows={3}
          />

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant={effectiveDecision === 'include' ? 'primary' : 'danger'}
              size="sm"
              onClick={handleSave}
              disabled={!effectiveDecision}
            >
              Confirm {effectiveDecision || 'Decision'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
