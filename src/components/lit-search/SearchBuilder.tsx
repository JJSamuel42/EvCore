'use client';

import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { SearchTerm, PICOType, BooleanOperator } from '@/types';
import { PICOBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { cn, getPICOColor, getPICOBorderColor, getPICOLabel } from '@/lib/utils';

interface SearchBuilderProps {
  terms: SearchTerm[];
  onAddTerm: (term: Omit<SearchTerm, 'id'>) => void;
  onRemoveTerm: (termId: string) => void;
  query: string;
  onQueryChange: (q: string) => void;
}

const PICO_TYPES: PICOType[] = ['P', 'I', 'C', 'O'];
const OPERATORS: Array<{ value: BooleanOperator; label: string }> = [
  { value: 'AND', label: 'AND' },
  { value: 'OR', label: 'OR' },
  { value: 'NOT', label: 'NOT' },
];

const PICO_COLORS_BORDER: Record<PICOType, string> = {
  P: 'border-pico-p/30 bg-pico-p-bg',
  I: 'border-pico-i/30 bg-pico-i-bg',
  C: 'border-pico-c/30 bg-pico-c-bg',
  O: 'border-pico-o-bg border-pico-o/30 bg-pico-o-bg',
};

export function SearchBuilder({ terms, onAddTerm, onRemoveTerm, query, onQueryChange }: SearchBuilderProps) {
  const [newText, setNewText] = useState('');
  const [newType, setNewType] = useState<PICOType>('P');
  const [newOperator, setNewOperator] = useState<BooleanOperator>('AND');

  const handleAdd = () => {
    const text = newText.trim();
    if (!text) return;
    onAddTerm({
      text,
      type: newType,
      operator: terms.length === 0 ? null : newOperator,
    });
    setNewText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  const termsByType = (type: PICOType) => terms.filter((t) => t.type === type);

  return (
    <div className="space-y-4">
      <SectionLabel>Search Terms</SectionLabel>

      {/* PICO Term Groups */}
      <div className="grid grid-cols-1 gap-3">
        {PICO_TYPES.map((type) => {
          const typeTerms = termsByType(type);
          return (
            <div key={type} className={cn('rounded-md border p-3', PICO_COLORS_BORDER[type])}>
              <div className="flex items-center gap-2 mb-2">
                <PICOBadge type={type} />
                <span className="text-xs font-medium text-foreground">{getPICOLabel(type)}</span>
                <span className="text-[11px] text-muted-foreground">
                  {typeTerms.length} term{typeTerms.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {typeTerms.map((term) => (
                  <span
                    key={term.id}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border',
                      getPICOColor(term.type),
                      'border-current/20'
                    )}
                  >
                    {term.operator && terms.indexOf(term) > 0 && (
                      <span className="text-[10px] font-mono opacity-60">{term.operator}</span>
                    )}
                    {term.text}
                    <button
                      onClick={() => onRemoveTerm(term.id)}
                      className="opacity-60 hover:opacity-100 transition-opacity ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {typeTerms.length === 0 && (
                  <span className="text-xs text-muted-foreground italic">No terms added</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add term row */}
      <div className="flex items-center gap-2 bg-muted rounded-md px-3 py-2">
        {terms.length > 0 && (
          <select
            value={newOperator || 'AND'}
            onChange={(e) => setNewOperator(e.target.value as BooleanOperator)}
            className="h-7 px-1.5 text-xs bg-card border border-border rounded font-mono font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-accent w-16"
          >
            {OPERATORS.map((op) => (
              <option key={op.value} value={op.value}>{op.label}</option>
            ))}
          </select>
        )}

        <div className="flex gap-1">
          {PICO_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setNewType(type)}
              className={cn(
                'w-6 h-6 rounded text-[11px] font-mono font-bold border transition-all',
                newType === type
                  ? cn(getPICOColor(type), 'border-current/30 shadow-sm')
                  : 'text-muted-foreground border-border hover:border-border-hover bg-card'
              )}
            >
              {type}
            </button>
          ))}
        </div>

        <input
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add search term..."
          className="flex-1 h-8 px-2 text-sm bg-card border border-border rounded focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
        />

        <Button size="sm" variant="primary" onClick={handleAdd} leftIcon={<Plus className="w-3.5 h-3.5" />}>
          Add
        </Button>
      </div>

      {/* Query — editable */}
      {query && (
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
              PubMed Query
            </p>
            <p className="text-[11px] text-muted-foreground italic">Editable — changes here override the generated query</p>
          </div>
          <textarea
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            rows={3}
            spellCheck={false}
            className="w-full bg-foreground/5 border border-border rounded-md p-3 font-mono text-xs text-foreground leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
          />
        </div>
      )}
    </div>
  );
}
