'use client';

import React, { useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { X, Plus, Trash2 } from 'lucide-react';
import { LibraryColumn } from '@/types';
import { Input, Textarea } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface ColumnEditorProps {
  column: LibraryColumn;
  onUpdate: (data: Partial<LibraryColumn>) => void;
  onDelete: () => void;
  children: React.ReactNode;
}

const TYPE_OPTIONS = [
  { value: 'text', label: 'Text' },
  { value: 'select', label: 'Select (predefined)' },
  { value: 'date', label: 'Date' },
  { value: 'number', label: 'Number' },
];

export function ColumnEditor({ column, onUpdate, onDelete, children }: ColumnEditorProps) {
  const [open, setOpen] = useState(false);
  const [local, setLocal] = useState<LibraryColumn>({ ...column });
  const [newValue, setNewValue] = useState('');

  const handleSave = () => {
    onUpdate({
      name: local.name,
      description: local.description,
      type: local.type,
      predefinedValues: local.predefinedValues,
      isFilter: local.isFilter,
      aiPrompt: local.aiPrompt,
    });
    setOpen(false);
  };

  const addPredefinedValue = () => {
    const v = newValue.trim();
    if (!v) return;
    setLocal((prev) => ({
      ...prev,
      predefinedValues: [...(prev.predefinedValues || []), v],
    }));
    setNewValue('');
  };

  const removePredefinedValue = (idx: number) => {
    setLocal((prev) => ({
      ...prev,
      predefinedValues: prev.predefinedValues?.filter((_, i) => i !== idx),
    }));
  };

  return (
    <Popover.Root open={open} onOpenChange={(o) => { setOpen(o); if (o) setLocal({ ...column }); }}>
      <Popover.Trigger asChild>{children}</Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="start"
          sideOffset={4}
          className={cn(
            'w-[480px] bg-card border border-border rounded-lg shadow-lg z-50',
            'focus:outline-none'
          )}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="text-sm font-medium font-serif">Edit Column</h3>
            <Popover.Close className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted">
              <X className="w-3.5 h-3.5" />
            </Popover.Close>
          </div>

          <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
            <Input
              label="Column Name"
              value={local.name}
              onChange={(e) => setLocal((p) => ({ ...p, name: e.target.value }))}
            />

            <Input
              label="Description"
              value={local.description}
              onChange={(e) => setLocal((p) => ({ ...p, description: e.target.value }))}
              placeholder="Describe what this column captures..."
            />

            <Select
              label="Column Type"
              value={local.type}
              onValueChange={(v) => setLocal((p) => ({ ...p, type: v as LibraryColumn['type'] }))}
              options={TYPE_OPTIONS}
            />

            {local.type === 'select' && (
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
                  Predefined Values
                </p>
                <div className="space-y-1 mb-2">
                  {(local.predefinedValues || []).map((val, idx) => (
                    <div key={idx} className="flex items-center gap-2 px-2 py-1.5 bg-muted rounded text-xs">
                      <span className="flex-1 text-foreground">{val}</span>
                      <button
                        onClick={() => removePredefinedValue(idx)}
                        className="text-muted-foreground hover:text-exclude transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addPredefinedValue())}
                    placeholder="Add value..."
                    className="flex-1 h-8 px-2 text-xs bg-card border border-border rounded focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  <button
                    onClick={addPredefinedValue}
                    className="h-8 px-2 bg-accent text-white rounded text-xs hover:bg-accent/90"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Show in Filters</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Appear in the filter bar</p>
              </div>
              <button
                onClick={() => setLocal((p) => ({ ...p, isFilter: !p.isFilter }))}
                className={cn(
                  'w-9 h-5 rounded-full transition-colors relative',
                  local.isFilter ? 'bg-accent' : 'bg-border'
                )}
              >
                <span
                  className={cn(
                    'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
                    local.isFilter ? 'translate-x-4' : 'translate-x-0.5'
                  )}
                />
              </button>
            </div>

            <Textarea
              label="AI Extraction Prompt"
              value={local.aiPrompt}
              onChange={(e) => setLocal((p) => ({ ...p, aiPrompt: e.target.value }))}
              placeholder="Describe how AI should extract or classify values for this column..."
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <button
              onClick={() => { onDelete(); setOpen(false); }}
              className="flex items-center gap-1 text-xs text-exclude hover:text-exclude/80 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Column</span>
            </button>
            <Button size="sm" variant="primary" onClick={handleSave}>
              Save
            </Button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
