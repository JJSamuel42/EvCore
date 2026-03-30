'use client';

import React, { useState } from 'react';
import { Plus, X, ChevronDown, ChevronRight, Trash2, GripVertical } from 'lucide-react';
import { LibraryColumn } from '@/types';
import { cn } from '@/lib/utils';

interface ColumnSetupTableProps {
  columns: Omit<LibraryColumn, 'id' | 'order'>[];
  onChange: (columns: Omit<LibraryColumn, 'id' | 'order'>[]) => void;
}

const TYPE_OPTIONS: { value: LibraryColumn['type']; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'select', label: 'Select' },
  { value: 'date', label: 'Date' },
  { value: 'number', label: 'Number' },
];

export function ColumnSetupTable({ columns, onChange }: ColumnSetupTableProps) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [newValInputs, setNewValInputs] = useState<Record<number, string>>({});

  const updateColumn = (idx: number, data: Partial<Omit<LibraryColumn, 'id' | 'order'>>) => {
    onChange(columns.map((col, i) => (i === idx ? { ...col, ...data } : col)));
  };

  const removeColumn = (idx: number) => {
    onChange(columns.filter((_, i) => i !== idx));
    if (expandedIdx === idx) setExpandedIdx(null);
    else if (expandedIdx !== null && expandedIdx > idx) setExpandedIdx(expandedIdx - 1);
  };

  const addColumn = () => {
    const newCol: Omit<LibraryColumn, 'id' | 'order'> = {
      name: '',
      description: '',
      type: 'text',
      isFilter: false,
      aiPrompt: '',
    };
    onChange([...columns, newCol]);
    setExpandedIdx(columns.length);
  };

  const addPredefinedValue = (idx: number) => {
    const val = (newValInputs[idx] || '').trim();
    if (!val) return;
    const col = columns[idx];
    if (!col.predefinedValues?.includes(val)) {
      updateColumn(idx, { predefinedValues: [...(col.predefinedValues || []), val] });
    }
    setNewValInputs((prev) => ({ ...prev, [idx]: '' }));
  };

  const removePredefinedValue = (colIdx: number, valIdx: number) => {
    const col = columns[colIdx];
    updateColumn(colIdx, {
      predefinedValues: col.predefinedValues?.filter((_, i) => i !== valIdx),
    });
  };

  return (
    <div className="space-y-1">
      {/* Header */}
      <div className="grid grid-cols-[1fr_100px_80px_60px_36px] gap-2 px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
        <span>Column Name</span>
        <span>Type</span>
        <span>Filter</span>
        <span>Default</span>
        <span />
      </div>

      {columns.map((col, idx) => (
        <div key={idx} className="border border-border rounded-md overflow-hidden">
          {/* Row summary */}
          <div
            className={cn(
              'grid grid-cols-[1fr_100px_80px_60px_36px] gap-2 items-center px-3 py-2 cursor-pointer hover:bg-muted/30 transition-colors',
              expandedIdx === idx && 'bg-muted/30'
            )}
            onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
          >
            <div className="flex items-center gap-2">
              {expandedIdx === idx ? (
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              )}
              <span className="text-sm text-foreground truncate">
                {col.name || <span className="text-muted-foreground italic">Untitled</span>}
              </span>
            </div>
            <span className="text-xs text-muted-foreground capitalize">{col.type}</span>
            <span className={cn('text-xs', col.isFilter ? 'text-accent' : 'text-muted-foreground')}>
              {col.isFilter ? 'Yes' : 'No'}
            </span>
            <span className="text-xs text-muted-foreground">{col.isDefault ? 'Yes' : '—'}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeColumn(idx);
              }}
              className="text-muted-foreground hover:text-exclude transition-colors p-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Expanded editor */}
          {expandedIdx === idx && (
            <div className="px-4 py-3 border-t border-border space-y-3 bg-card">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
                    Column Name
                  </label>
                  <input
                    value={col.name}
                    onChange={(e) => updateColumn(idx, { name: e.target.value })}
                    className="w-full h-8 px-2 text-sm bg-card border border-border rounded focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
                    Type
                  </label>
                  <select
                    value={col.type}
                    onChange={(e) =>
                      updateColumn(idx, { type: e.target.value as LibraryColumn['type'] })
                    }
                    className="w-full h-8 px-2 text-sm bg-card border border-border rounded focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    {TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
                  Description
                </label>
                <input
                  value={col.description}
                  onChange={(e) => updateColumn(idx, { description: e.target.value })}
                  placeholder="Describe what this column captures..."
                  className="w-full h-8 px-2 text-sm bg-card border border-border rounded focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={col.isFilter}
                    onChange={(e) => updateColumn(idx, { isFilter: e.target.checked })}
                    className="rounded border-border"
                  />
                  Show in Filters
                </label>
              </div>

              {col.type === 'select' && (
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
                    Predefined Values
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {(col.predefinedValues || []).map((val, vi) => (
                      <span
                        key={vi}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs text-foreground"
                      >
                        {val}
                        <button
                          type="button"
                          onClick={() => removePredefinedValue(idx, vi)}
                          className="text-muted-foreground hover:text-exclude"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-1.5">
                    <input
                      value={newValInputs[idx] || ''}
                      onChange={(e) =>
                        setNewValInputs((prev) => ({ ...prev, [idx]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addPredefinedValue(idx);
                        }
                      }}
                      placeholder="Add value..."
                      className="flex-1 h-7 px-2 text-xs bg-card border border-border rounded focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                    <button
                      type="button"
                      onClick={() => addPredefinedValue(idx)}
                      className="h-7 px-2 bg-accent text-white rounded text-xs hover:bg-accent/90"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
                  AI Extraction Prompt
                </label>
                <textarea
                  value={col.aiPrompt}
                  onChange={(e) => updateColumn(idx, { aiPrompt: e.target.value })}
                  placeholder="Describe how AI should extract or classify values for this column..."
                  rows={2}
                  className="w-full px-2 py-1.5 text-xs bg-card border border-border rounded focus:outline-none focus:ring-2 focus:ring-accent resize-y"
                />
              </div>
            </div>
          )}
        </div>
      ))}

      <button
        type="button"
        onClick={addColumn}
        className="flex items-center gap-1.5 text-xs text-accent hover:text-accent/80 transition-colors mt-2 px-3 py-2"
      >
        <Plus className="w-3.5 h-3.5" />
        Add Column
      </button>
    </div>
  );
}
