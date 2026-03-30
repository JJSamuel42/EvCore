'use client';

import React from 'react';
import { ArticleMetadata } from '@/lib/pubmed';
import { cn } from '@/lib/utils';

interface ImportPreviewProps {
  articles: ArticleMetadata[];
  selected: Set<string>;
  onToggle: (key: string) => void;
  onToggleAll: () => void;
}

export function ImportPreview({ articles, selected, onToggle, onToggleAll }: ImportPreviewProps) {
  const allSelected = articles.length > 0 && selected.size === articles.length;

  return (
    <div className="border border-border rounded-md overflow-hidden">
      <div className="max-h-[400px] overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="bg-muted sticky top-0 z-10">
            <tr>
              <th className="w-8 px-2 py-2">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleAll}
                  className="rounded border-border"
                />
              </th>
              <th className="text-left px-2 py-2 font-mono uppercase tracking-wider text-muted-foreground">
                Title
              </th>
              <th className="text-left px-2 py-2 font-mono uppercase tracking-wider text-muted-foreground w-32">
                Authors
              </th>
              <th className="text-left px-2 py-2 font-mono uppercase tracking-wider text-muted-foreground w-28">
                Journal
              </th>
              <th className="text-left px-2 py-2 font-mono uppercase tracking-wider text-muted-foreground w-24">
                Date
              </th>
              <th className="text-left px-2 py-2 font-mono uppercase tracking-wider text-muted-foreground w-20">
                PMID
              </th>
            </tr>
          </thead>
          <tbody>
            {articles.map((art, idx) => {
              const key = art.pmid || art.doi || String(idx);
              const isSelected = selected.has(key);
              return (
                <tr
                  key={key}
                  className={cn(
                    'border-t border-border hover:bg-muted/30 transition-colors cursor-pointer',
                    isSelected && 'bg-accent/5'
                  )}
                  onClick={() => onToggle(key)}
                >
                  <td className="px-2 py-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggle(key)}
                      className="rounded border-border"
                    />
                  </td>
                  <td className="px-2 py-2 text-foreground max-w-0">
                    <p className="truncate">{art.title}</p>
                  </td>
                  <td className="px-2 py-2 text-muted-foreground truncate">{art.authors}</td>
                  <td className="px-2 py-2 text-muted-foreground truncate">{art.journal}</td>
                  <td className="px-2 py-2 text-muted-foreground">{art.publicationDate}</td>
                  <td className="px-2 py-2 text-muted-foreground font-mono">{art.pmid || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="px-3 py-2 bg-muted border-t border-border text-xs text-muted-foreground">
        {selected.size} of {articles.length} articles selected
      </div>
    </div>
  );
}
