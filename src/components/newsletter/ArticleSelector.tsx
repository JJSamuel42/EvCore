'use client';

import React from 'react';
import { LibraryArticle } from '@/types';
import { cn } from '@/lib/utils';

interface ArticleSelectorProps {
  articles: LibraryArticle[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
}

export function ArticleSelector({ articles, selectedIds, onToggle, onToggleAll }: ArticleSelectorProps) {
  const allSelected = articles.length > 0 && selectedIds.size === articles.length;

  return (
    <div className="border border-border rounded-md overflow-hidden">
      <div className="max-h-[300px] overflow-y-auto">
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
              <th className="text-left px-2 py-2 font-mono uppercase tracking-wider text-muted-foreground">#</th>
              <th className="text-left px-2 py-2 font-mono uppercase tracking-wider text-muted-foreground">Title</th>
              <th className="text-left px-2 py-2 font-mono uppercase tracking-wider text-muted-foreground w-32">Authors</th>
              <th className="text-left px-2 py-2 font-mono uppercase tracking-wider text-muted-foreground w-24">Date</th>
            </tr>
          </thead>
          <tbody>
            {articles.map((art) => (
              <tr
                key={art.id}
                className={cn(
                  'border-t border-border hover:bg-muted/30 transition-colors cursor-pointer',
                  selectedIds.has(art.id) && 'bg-accent/5'
                )}
                onClick={() => onToggle(art.id)}
              >
                <td className="px-2 py-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(art.id)}
                    onChange={() => onToggle(art.id)}
                    className="rounded border-border"
                  />
                </td>
                <td className="px-2 py-2 font-mono text-muted-foreground">{art.articleNumber}</td>
                <td className="px-2 py-2 text-foreground">
                  <p className="truncate max-w-sm">{art.title}</p>
                </td>
                <td className="px-2 py-2 text-muted-foreground truncate">{art.authors}</td>
                <td className="px-2 py-2 text-muted-foreground">{art.publicationDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-3 py-2 bg-muted border-t border-border text-xs text-muted-foreground">
        {selectedIds.size} of {articles.length} selected
      </div>
    </div>
  );
}
