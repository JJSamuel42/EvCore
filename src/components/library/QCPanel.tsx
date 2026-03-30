'use client';

import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { QCIssue } from '@/lib/qcChecks';
import { AlertTriangle, FileWarning, GitBranch, Check, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QCPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  issues: QCIssue[];
  onFixIssue: (issue: QCIssue) => void;
  onFixAll: (type: QCIssue['type']) => void;
  onFindReplace: (columnId: string, find: string, replace: string) => void;
}

const TYPE_LABELS: Record<QCIssue['type'], { label: string; icon: React.ReactNode; color: string }> = {
  blank: { label: 'Blank Cells', icon: <FileWarning className="w-3.5 h-3.5" />, color: 'text-yellow-500' },
  typo: { label: 'Possible Typos', icon: <AlertTriangle className="w-3.5 h-3.5" />, color: 'text-orange-500' },
  category_mismatch: { label: 'Category Mismatches', icon: <GitBranch className="w-3.5 h-3.5" />, color: 'text-exclude' },
};

export function QCPanel({ open, onOpenChange, issues, onFixIssue, onFixAll, onFindReplace }: QCPanelProps) {
  const [activeTab, setActiveTab] = useState<QCIssue['type'] | 'all'>('all');
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [findReplaceCol, setFindReplaceCol] = useState('');

  const grouped = useMemo(() => {
    const map: Record<string, QCIssue[]> = { blank: [], typo: [], category_mismatch: [] };
    for (const issue of issues) {
      map[issue.type].push(issue);
    }
    return map;
  }, [issues]);

  const filtered = activeTab === 'all' ? issues : (grouped[activeTab] || []);

  const uniqueColumns = useMemo(() => {
    const cols = new Map<string, string>();
    for (const issue of issues) {
      if (issue.type === 'typo') cols.set(issue.columnId, issue.columnName);
    }
    return Array.from(cols.entries());
  }, [issues]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <h3 className="font-serif text-base font-semibold mb-1">QC Check Results</h3>
        <p className="text-xs text-muted-foreground mb-4">
          {issues.length} issue{issues.length !== 1 ? 's' : ''} found across articles
        </p>

        {/* Summary badges */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <button
            onClick={() => setActiveTab('all')}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs border transition-colors',
              activeTab === 'all'
                ? 'bg-accent/10 border-accent/30 text-accent'
                : 'border-border text-muted-foreground hover:text-foreground'
            )}
          >
            All ({issues.length})
          </button>
          {(Object.keys(TYPE_LABELS) as QCIssue['type'][]).map((type) => {
            const count = grouped[type]?.length || 0;
            if (count === 0) return null;
            const { label, icon, color } = TYPE_LABELS[type];
            return (
              <button
                key={type}
                onClick={() => setActiveTab(type)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-colors',
                  activeTab === type
                    ? 'bg-accent/10 border-accent/30 text-accent'
                    : 'border-border text-muted-foreground hover:text-foreground'
                )}
              >
                <span className={color}>{icon}</span>
                {label} ({count})
              </button>
            );
          })}
        </div>

        {/* Fix All buttons */}
        {activeTab !== 'all' && grouped[activeTab]?.length > 0 && activeTab === 'category_mismatch' && (
          <div className="mb-3">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onFixAll('category_mismatch')}
              leftIcon={<Check className="w-3.5 h-3.5" />}
            >
              Fix All Category Mismatches
            </Button>
          </div>
        )}

        {/* Find & Replace (for typos) */}
        {(activeTab === 'typo' || activeTab === 'all') && grouped.typo.length > 0 && (
          <div className="mb-3 p-3 bg-muted rounded-md space-y-2">
            <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
              Find & Replace
            </p>
            <div className="flex gap-2 items-center flex-wrap">
              <select
                value={findReplaceCol}
                onChange={(e) => setFindReplaceCol(e.target.value)}
                className="h-7 px-2 text-xs bg-card border border-border rounded"
              >
                <option value="">Select column...</option>
                {uniqueColumns.map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
              <input
                value={findText}
                onChange={(e) => setFindText(e.target.value)}
                placeholder="Find..."
                className="h-7 px-2 text-xs bg-card border border-border rounded w-32"
              />
              <input
                value={replaceText}
                onChange={(e) => setReplaceText(e.target.value)}
                placeholder="Replace with..."
                className="h-7 px-2 text-xs bg-card border border-border rounded w-32"
              />
              <Button
                size="sm"
                variant="secondary"
                disabled={!findReplaceCol || !findText}
                onClick={() => {
                  onFindReplace(findReplaceCol, findText, replaceText);
                  setFindText('');
                  setReplaceText('');
                }}
                leftIcon={<Search className="w-3 h-3" />}
              >
                Replace All
              </Button>
            </div>
          </div>
        )}

        {/* Issue list */}
        <div className="flex-1 overflow-y-auto border border-border rounded-md">
          {filtered.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">
              No issues found
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((issue, idx) => (
                <div
                  key={`${issue.articleId}-${issue.columnId}-${idx}`}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-muted/30 transition-colors"
                >
                  <span className={TYPE_LABELS[issue.type].color}>
                    {TYPE_LABELS[issue.type].icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground">{issue.message}</p>
                  </div>
                  {issue.suggestedValue && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onFixIssue(issue)}
                      className="text-[11px] shrink-0"
                    >
                      Fix
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end mt-4">
          <DialogClose asChild>
            <Button variant="ghost" size="sm">Close</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
